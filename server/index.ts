import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, sql, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";
import { profiles, userDatabases } from "./schema.js";

const execAsync = promisify(exec);
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const { Pool } = pg;
const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema: { profiles, userDatabases } });
const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "varies-vault-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    isInstitution: boolean;
    institutionType: string | null;
    unlockedDbs: string[];
  }
}

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

/* ── Auth ──────────────────────────────────────────────────── */
app.post("/api/auth/register", async (req, res) => {
  const { username, email, recoveryPin, isInstitution, institutionType, institutionName } = req.body;
  if (!username) {
    res.status(400).json({ error: "Username is required." });
    return;
  }
  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, username.trim()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Username already exists." });
      return;
    }

    const vaultKey = String(Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await bcrypt.hash(vaultKey, 12);

    const [profile] = await db
      .insert(profiles)
      .values({
        username: username.trim(),
        passwordHash,
        email: email || null,
        recoveryPin: recoveryPin || null,
        isInstitution: Boolean(isInstitution),
        institutionType: isInstitution ? institutionType || null : null,
        institutionName: isInstitution ? institutionName || null : null,
      })
      .returning();

    req.session.userId = profile.id;
    req.session.username = profile.username;
    req.session.isInstitution = profile.isInstitution;
    req.session.institutionType = profile.institutionType;
    req.session.unlockedDbs = [];

    res.json({
      vaultKey,
      username: profile.username,
      isInstitution: profile.isInstitution,
      institutionType: profile.institutionType,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, vaultKey } = req.body;
  if (!username || !vaultKey) {
    res.status(400).json({ error: "Username and vault key are required." });
    return;
  }
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.username, username.trim()))
      .limit(1);

    if (!profile) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const valid = await bcrypt.compare(String(vaultKey), profile.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    req.session.userId = profile.id;
    req.session.username = profile.username;
    req.session.isInstitution = profile.isInstitution;
    req.session.institutionType = profile.institutionType;
    req.session.unlockedDbs = [];

    res.json({
      username: profile.username,
      isInstitution: profile.isInstitution,
      institutionType: profile.institutionType,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.post("/api/auth/recover", async (req, res) => {
  const { username, recoveryPin } = req.body;
  if (!username || !recoveryPin) {
    res.status(400).json({ error: "Username and recovery PIN are required." });
    return;
  }
  try {
    const [profile] = await db
      .select({ id: profiles.id, recoveryPin: profiles.recoveryPin })
      .from(profiles)
      .where(eq(profiles.username, username.trim()))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "No account found with that username." });
      return;
    }
    if (!profile.recoveryPin) {
      res.status(400).json({ error: "No recovery PIN was set for this account." });
      return;
    }
    if (String(recoveryPin).trim() !== String(profile.recoveryPin).trim()) {
      res.status(401).json({ error: "Incorrect recovery PIN." });
      return;
    }

    const newVaultKey = String(Math.floor(100000 + Math.random() * 900000));
    const newHash = await bcrypt.hash(newVaultKey, 12);
    await db.update(profiles).set({ passwordHash: newHash }).where(eq(profiles.id, profile.id));

    res.json({ vaultKey: newVaultKey });
  } catch (err) {
    console.error("Recovery error:", err);
    res.status(500).json({ error: "Recovery failed." });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    userId: req.session.userId,
    username: req.session.username,
    isInstitution: req.session.isInstitution,
    institutionType: req.session.institutionType,
  });
});

/* ── Databases ─────────────────────────────────────────────── */
app.get("/api/databases", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(userDatabases)
      .where(eq(userDatabases.userId, req.session.userId!))
      .orderBy(userDatabases.createdAt);

    const unlockedDbs = req.session.unlockedDbs ?? [];
    const result = rows.map((row) => {
      const isLocked = Boolean(row.dataKeyHash);
      const isUnlocked = unlockedDbs.includes(row.id);
      return {
        ...row,
        isLocked,
        records: isLocked && !isUnlocked ? [] : row.records,
        dataKeyHash: undefined,
      };
    });
    res.json(result);
  } catch (err) {
    console.error("List databases error:", err);
    res.status(500).json({ error: "Failed to load databases." });
  }
});

app.post("/api/databases", requireAuth, async (req, res) => {
  const { name, fields, dataKey } = req.body;
  if (!name || !Array.isArray(fields)) {
    res.status(400).json({ error: "name and fields are required." });
    return;
  }
  try {
    const dataKeyHash = dataKey ? await bcrypt.hash(String(dataKey), 12) : null;
    const [row] = await db
      .insert(userDatabases)
      .values({
        userId: req.session.userId!,
        name,
        fields,
        records: [],
        isPublic: false,
        dataKeyHash,
      })
      .returning();

    if (dataKeyHash) req.session.unlockedDbs = [...(req.session.unlockedDbs ?? []), row.id];

    res.json({ ...row, isLocked: Boolean(row.dataKeyHash), dataKeyHash: undefined });
  } catch (err) {
    console.error("Create database error:", err);
    res.status(500).json({ error: "Failed to create database." });
  }
});

app.post("/api/databases/:id/unlock", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { dataKey } = req.body;
  if (!dataKey) {
    res.status(400).json({ error: "Data key is required." });
    return;
  }
  try {
    const [row] = await db
      .select({ userId: userDatabases.userId, dataKeyHash: userDatabases.dataKeyHash })
      .from(userDatabases)
      .where(eq(userDatabases.id, id))
      .limit(1);

    if (!row || row.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (!row.dataKeyHash) {
      res.status(400).json({ error: "This database is not locked." });
      return;
    }

    const valid = await bcrypt.compare(String(dataKey), row.dataKeyHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect data key." });
      return;
    }

    req.session.unlockedDbs = [...new Set([...(req.session.unlockedDbs ?? []), id])];
    res.json({ ok: true });
  } catch (err) {
    console.error("Unlock error:", err);
    res.status(500).json({ error: "Unlock failed." });
  }
});

app.patch("/api/databases/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { records, name, fields } = req.body;
  try {
    const [existing] = await db
      .select({ userId: userDatabases.userId, dataKeyHash: userDatabases.dataKeyHash })
      .from(userDatabases)
      .where(eq(userDatabases.id, id))
      .limit(1);

    if (!existing || existing.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const unlockedDbs = req.session.unlockedDbs ?? [];
    if (existing.dataKeyHash && !unlockedDbs.includes(id)) {
      res.status(403).json({ error: "Database is locked. Unlock it first." });
      return;
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (records !== undefined) patch.records = records;
    if (name !== undefined) patch.name = name;
    if (fields !== undefined) patch.fields = fields;

    const [updated] = await db.update(userDatabases).set(patch).where(eq(userDatabases.id, id)).returning();
    res.json({ ...updated, isLocked: Boolean(updated.dataKeyHash), dataKeyHash: undefined });
  } catch (err) {
    console.error("Update database error:", err);
    res.status(500).json({ error: "Failed to update database." });
  }
});

app.delete("/api/databases/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db
      .select({ userId: userDatabases.userId })
      .from(userDatabases)
      .where(eq(userDatabases.id, id))
      .limit(1);

    if (!existing || existing.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(userDatabases).where(eq(userDatabases.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete database error:", err);
    res.status(500).json({ error: "Failed to delete database." });
  }
});

/* ── Terminal API ───────────────────────────────────────────── */
app.get("/api/terminal/status", requireAuth, async (req, res) => {
  try {
    const [uc] = await db.execute(sql`SELECT COUNT(*) FROM profiles`);
    const [dc] = await db.execute(
      sql`SELECT COUNT(*) FROM user_databases WHERE user_id = ${req.session.userId}`
    );

    res.json({
      userCount: Number((uc as any).rows[0].count),
      dbCount: Number((dc as any).rows[0].count),
      uptime: process.uptime(),
      nodeVersion: process.version,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch status." });
  }
});

app.get("/api/terminal/users", requireAuth, async (req, res) => {
  try {
    const users = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        email: profiles.email,
        isInstitution: profiles.isInstitution,
        institutionType: profiles.institutionType,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .orderBy(profiles.createdAt);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

app.post("/api/terminal/migrate", requireAuth, async (_req, res) => {
  try {
    await runMigrations();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Migration failed." });
  }
});

app.post("/api/terminal/sql", requireAuth, async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "No query provided." });
    return;
  }
  try {
    const result = await pool.query(query);
    const fields = result.fields?.map((f: { name: string }) => f.name) ?? [];
    res.json({ rows: result.rows, rowCount: result.rowCount ?? 0, fields });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Query failed." });
  }
});

app.post("/api/terminal/exec", requireAuth, async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "No command provided." });
    return;
  }
  const BLOCKED = /\b(rm\s+-rf|:(){ :|:& };:|mkfs|dd\s+if=|shutdown|reboot|halt|poweroff)\b/i;
  if (BLOCKED.test(command)) {
    res.status(403).json({ error: "Command blocked for safety." });
    return;
  }
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 8000, cwd: process.cwd() });
    res.json({ stdout: stdout.trim(), stderr: stderr.trim() });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    res.json({ stdout: (e.stdout ?? "").trim(), stderr: (e.stderr ?? e.message ?? "").trim() });
  }
});

/* ── Greo AI ────────────────────────────────────────────────── */
const GREO_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_databases",
      description: "List all the user's databases/vaults with names, fields, and record counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_database_records",
      description: "Get all records and fields from a specific database.",
      parameters: {
        type: "object",
        properties: { database_id: { type: "string" } },
        required: ["database_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_database",
      description: "Create a new database/vault with specified name and field columns.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          fields: { type: "array", items: { type: "string" } },
        },
        required: ["name", "fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_records_to_database",
      description: "Add new records to an existing database.",
      parameters: {
        type: "object",
        properties: {
          database_id: { type: "string" },
          records: { type: "array", items: { type: "object" } },
        },
        required: ["database_id", "records"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_sql_query",
      description: "Execute a raw SQL query against the PostgreSQL database.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_shell_command",
      description: "Execute a shell command on the server.",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Fetch data from any URL — APIs, CSV datasets, JSON feeds, web pages.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          format: { type: "string", enum: ["text", "json"] },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "render_chart",
      description: "Render a data visualization chart in the HIVE interface. Always call this when you have data to display.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["bar", "line", "pie", "area", "scatter", "radar"] },
          title: { type: "string" },
          description: { type: "string" },
          data: { type: "array", items: { type: "object" } },
          xKey: { type: "string" },
          dataKeys: { type: "array", items: { type: "string" } },
          colors: { type: "array", items: { type: "string" } },
        },
        required: ["type", "title", "data"],
      },
    },
  },
];

app.post("/api/greo/chat", requireAuth, async (req, res) => {
  if (!openaiClient) {
    res.status(503).json({ error: "OPENAI_API_KEY is not configured. Please add it in your Replit Secrets." });
    return;
  }
  const userId = req.session.userId;
  const { messages, username: uname } = req.body as {
    messages: OpenAI.ChatCompletionMessageParam[];
    username?: string;
  };
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages required" });
    return;
  }
  const systemPrompt = `You are Greo, an elite AI assistant embedded in the HIVE Mass Data Storage system. You embody the phoenix — powerful, precise, reborn from raw data into insight.
You have FULL access to:
- All user databases (list, read, create, add records)
- Raw SQL queries against PostgreSQL
- Shell commands on the server
- Internet data fetching from any URL
- Beautiful chart rendering in the HIVE interface
User: ${uname || "User"} | Time: ${new Date().toISOString()}
Rules:
1. Always call list_databases first when discussing "my data" or databases
2. ALWAYS call render_chart when you have data to visualize — choose the best chart type
3. For comparisons use bar, trends use line, proportions use pie, cumulative use area
4. Keep responses concise and action-oriented — you are a phoenix, not a chatbot
5. After creating databases or adding data, confirm the result clearly`;

  const oaiMsgs: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-18),
  ];

  interface ChartSpec {
    type: string;
    title: string;
    description?: string;
    data: Record<string, unknown>[];
    xKey?: string;
    dataKeys?: string[];
    colors?: string[];
  }

  const visualizations: ChartSpec[] = [];
  const actionLog: string[] = [];
  const BLOCKED = /\b(rm\s+-rf|:(){ :|:& };:|mkfs|dd\s+if=|shutdown|reboot|halt|poweroff)\b/i;

  for (let iter = 0; iter < 8; iter++) {
    const resp = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: oaiMsgs,
      tools: GREO_TOOLS,
      tool_choice: "auto",
      max_tokens: 2000,
      temperature: 0.7,
    });
    const msg = resp.choices[0].message;
    if (!msg.tool_calls?.length) {
      res.json({ response: msg.content ?? "", visualizations, actionLog });
      return;
    }
    oaiMsgs.push(msg);
    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        /**/
      }
      let toolResult = "";
      try {
        switch (name) {
          case "list_databases": {
            const dbs = await db
              .select({ id: userDatabases.id, name: userDatabases.name, fields: userDatabases.fields, records: userDatabases.records })
              .from(userDatabases)
              .where(eq(userDatabases.userId, userId!));
            toolResult = JSON.stringify(
              dbs.map((d) => ({
                id: d.id,
                name: d.name,
                fields: d.fields,
                recordCount: Array.isArray(d.records) ? (d.records as unknown[]).length : 0,
              }))
            );
            actionLog.push(`Listed ${dbs.length} database${dbs.length !== 1 ? "s" : ""}`);
            break;
          }
          case "get_database_records": {
            const { database_id } = args as { database_id: string };
            const rows = await db
              .select()
              .from(userDatabases)
              .where(and(eq(userDatabases.id, database_id), eq(userDatabases.userId, userId!)))
              .limit(1);
            if (!rows.length) {
              toolResult = "Database not found";
              break;
            }
            toolResult = JSON.stringify({ name: rows[0].name, fields: rows[0].fields, records: rows[0].records });
            actionLog.push(`Fetched records from "${rows[0].name}"`);
            break;
          }
          case "create_database": {
            const { name, fields } = args as { name: string; fields: string[] };
            const [newDb] = await db
              .insert(userDatabases)
              .values({
                userId: userId!,
                name,
                fields,
                records: sql`'[]'::jsonb`,
                isPublic: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning({ id: userDatabases.id, name: userDatabases.name, fields: userDatabases.fields });
            toolResult = JSON.stringify(newDb);
            actionLog.push(`Created database "${name}" with fields: ${fields.join(", ")}`);
            break;
          }
          case "add_records_to_database": {
            const { database_id, records } = args as { database_id: string; records: Record<string, unknown>[] };
            const rows = await db
              .select()
              .from(userDatabases)
              .where(and(eq(userDatabases.id, database_id), eq(userDatabases.userId, userId!)))
              .limit(1);
            if (!rows.length) {
              toolResult = "Database not found";
              break;
            }
            const existing = Array.isArray(rows[0].records) ? (rows[0].records as unknown[]) : [];
            const merged = [...existing, ...records];
            await db.update(userDatabases).set({ records: sql`${JSON.stringify(merged)}::jsonb`, updatedAt: new Date() }).where(eq(userDatabases.id, database_id));
            toolResult = `Added ${records.length} records. Total: ${merged.length}`;
            actionLog.push(`Added ${records.length} records to "${rows[0].name}"`);
            break;
          }
          case "run_sql_query": {
            const { query } = args as { query: string };
            const pgRes = await pool.query(query);
            const fields = pgRes.fields?.map((f: { name: string }) => f.name) ?? [];
            toolResult = JSON.stringify({ rows: pgRes.rows.slice(0, 200), rowCount: pgRes.rowCount, fields });
            actionLog.push(`SQL: ${String(query).slice(0, 70)}…`);
            break;
          }
          case "run_shell_command": {
            const { command } = args as { command: string };
            if (BLOCKED.test(String(command))) {
              toolResult = "Blocked for safety.";
              actionLog.push(`Blocked: ${command}`);
              break;
            }
            const { stdout, stderr } = await execAsync(String(command), { timeout: 8000, cwd: process.cwd() });
            toolResult = stdout.trim() + (stderr.trim() ? `\nSTDERR: ${stderr.trim()}` : "");
            actionLog.push(`Shell: ${command}`);
            break;
          }
          case "fetch_url": {
            const { url } = args as { url: string };
            const fetchRes = await fetch(String(url), { headers: { "User-Agent": "HIVE-Greo/1.0" }, signal: AbortSignal.timeout(10000) });
            const text = await fetchRes.text();
            toolResult = text.slice(0, 5000);
            actionLog.push(`Fetched ${url} (${text.length} chars)`);
            break;
          }
          case "render_chart": {
            visualizations.push(args as ChartSpec);
            toolResult = `Chart "${args.title}" queued — ${Array.isArray(args.data) ? (args.data as unknown[]).length : 0} data points`;
            actionLog.push(`Rendering ${String(args.type)} chart: "${args.title}"`);
            break;
          }
          default:
            toolResult = "Unknown tool";
        }
      } catch (e) {
        toolResult = `Error: ${e instanceof Error ? e.message : String(e)}`;
        actionLog.push(`Error in ${name}: ${toolResult.slice(0, 80)}`);
      }
      oaiMsgs.push({ role: "tool", tool_call_id: tc.id, content: toolResult });
    }
  }
  res.json({ response: "Analysis complete.", visualizations, actionLog });
});

const distPath = path.resolve(process.cwd(), "dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export async function runMigrations() {
  console.log("Running database migrations...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      recovery_pin TEXT,
      is_institution BOOLEAN NOT NULL DEFAULT false,
      institution_type TEXT,
      institution_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_databases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      fields TEXT[] NOT NULL DEFAULT '{}',
      records JSONB NOT NULL DEFAULT '[]',
      is_public BOOLEAN NOT NULL DEFAULT false,
      data_key_hash TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE user_databases ADD COLUMN IF NOT EXISTS data_key_hash TEXT`);
  console.log("Migrations complete.");
}

async function start() {
  await runMigrations();
  const PORT = parseInt(process.env.PORT || "3001");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
