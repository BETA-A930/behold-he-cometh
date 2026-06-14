import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Send,
  Globe,
  Database,
  Terminal,
  Trash2,
  RefreshCw,
  BarChart3,
  KeyRound,
  ExternalLink,
  Zap,
} from "lucide-react";
import greoLogo from "@/assets/greo-logo.svg";

interface ChartSpec {
  type: "bar" | "line" | "pie" | "area" | "scatter" | "radar";
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  xKey?: string;
  dataKeys?: string[];
  colors?: string[];
}

interface GreoMsg {
  id: string;
  role: "user" | "greo";
  content: string;
  charts?: ChartSpec[];
  actions?: string[];
  ts: Date;
  thinking?: boolean;
}

type ApiMsg = { role: "user" | "assistant"; content: string };

const FIRE = [
  "#F97316",
  "#FBBF24",
  "#EF4444",
  "#A78BFA",
  "#60A5FA",
  "#34D399",
  "#FB923C",
  "#F472B6",
  "#14B8A6",
  "#818CF8",
];

const mkId = () => Math.random().toString(36).slice(2);

const ChartRenderer = ({ spec }: { spec: ChartSpec }) => {
  const colors = spec.colors?.length ? spec.colors : FIRE;
  const dataKeys = spec.dataKeys?.length
    ? spec.dataKeys
    : spec.data.length
    ? Object.keys(spec.data[0]).filter((k) => k !== spec.xKey && typeof spec.data[0][k] === "number").slice(0, 5)
    : [];
  const COMMON = { margin: { top: 8, right: 16, left: 0, bottom: 8 } };
  const TT = { contentStyle: { background: "#1a1f35", border: "1px solid #F9731640", color: "#fff", fontSize: 12, borderRadius: 6 } };
  const LEG = { wrapperStyle: { fontSize: 11, color: "#ffffff80" } };
  const xTick = { fill: "#ffffff70", fontSize: 10 };
  const yTick = { fill: "#ffffff70", fontSize: 10 };

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-sm font-bold mb-0.5 truncate" style={{ color: "#F97316" }}>
        {spec.title}
      </p>
      {spec.description && (
        <p className="text-[11px] mb-3" style={{ color: "#ffffff50" }}>
          {spec.description}
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "bar" ? (
            <BarChart data={spec.data} {...COMMON}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
              <XAxis dataKey={spec.xKey} tick={xTick} />
              <YAxis tick={yTick} />
              <Tooltip {...TT} />
              <Legend {...LEG} />
              {dataKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={800} />
              ))}
            </BarChart>
          ) : spec.type === "line" ? (
            <LineChart data={spec.data} {...COMMON}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
              <XAxis dataKey={spec.xKey} tick={xTick} />
              <YAxis tick={yTick} />
              <Tooltip {...TT} />
              <Legend {...LEG} />
              {dataKeys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
              ))}
            </LineChart>
          ) : spec.type === "area" ? (
            <AreaChart data={spec.data} {...COMMON}>
              <defs>
                {dataKeys.map((k, i) => (
                  <linearGradient key={k} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
              <XAxis dataKey={spec.xKey} tick={xTick} />
              <YAxis tick={yTick} />
              <Tooltip {...TT} />
              <Legend {...LEG} />
              {dataKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} fill={`url(#ag${i})`} strokeWidth={2} isAnimationActive animationDuration={800} />
              ))}
            </AreaChart>
          ) : spec.type === "pie" ? (
            <PieChart>
              <Pie data={spec.data} dataKey={dataKeys[0] || "value"} nameKey={spec.xKey || "name"} cx="50%" cy="50%" outerRadius="70%" isAnimationActive animationDuration={800} label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#ffffff20" }}>
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          ) : spec.type === "scatter" ? (
            <ScatterChart {...COMMON}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
              <XAxis dataKey={spec.xKey || dataKeys[0]} tick={xTick} />
              <YAxis dataKey={dataKeys[1] || dataKeys[0]} tick={yTick} />
              <Tooltip {...TT} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={spec.data} fill={colors[0]} isAnimationActive animationDuration={800} />
            </ScatterChart>
          ) : (
            <RadarChart data={spec.data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#ffffff15" />
              <PolarAngleAxis dataKey={spec.xKey || "subject"} tick={xTick} />
              <PolarRadiusAxis tick={{ fill: "#ffffff40", fontSize: 9 }} />
              {dataKeys.map((k, i) => (
                <Radar key={k} name={k} dataKey={k} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.3} isAnimationActive animationDuration={800} />
              ))}
              <Legend {...LEG} />
              <Tooltip {...TT} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ActionEntry = ({ text }: { text: string }) => {
  const isError = text.startsWith("Error") || text.startsWith("Blocked");
  const Icon =
    text.startsWith("SQL") || text.startsWith("Shell")
      ? Terminal
      : text.startsWith("Fetched http")
      ? Globe
      : text.startsWith("Rendering")
      ? BarChart3
      : text.startsWith("Listed") || text.startsWith("Fetched records") || text.startsWith("Created") || text.startsWith("Added")
      ? Database
      : Zap;
  return (
    <div className={`flex items-start gap-1.5 py-0.5 text-[11px] leading-relaxed ${isError ? "text-red-400/80" : "text-white/45"}`}>
      <Icon size={10} className="mt-0.5 shrink-0" style={{ color: isError ? "#F87171" : "#F9731670" }} />
      <span>{text}</span>
    </div>
  );
};

interface TellerFourProps {
  username?: string;
  onLogout?: () => void;
}

const TellerFour = ({ username = "User" }: TellerFourProps) => {
  const [messages, setMessages] = useState<GreoMsg[]>([
    {
      id: mkId(),
      role: "greo",
      ts: new Date(),
      content: `Hello ${username}! I'm **Greo** — your AI data analyst powered by the phoenix. I have full access to your HIVE databases, can run SQL queries, execute shell commands, fetch data from the internet, and generate live visualizations.

Try asking me:
• *"Show me all my databases"*
• *"Create a chart from my data"*
• *"Fetch a public dataset from https://jsonplaceholder.typicode.com/users and visualize it"*
• *"Run a SQL query on the users table"*`,
    },
  ]);
  const [apiMsgs, setApiMsgs] = useState<ApiMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const [allCharts, setAllCharts] = useState<ChartSpec[]>([]);
  const [chartIdx, setChartIdx] = useState(0);
  const [allActions, setAllActions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");

    const userMsg: GreoMsg = { id: mkId(), role: "user", content: text, ts: new Date() };
    const thinkId = mkId();
    const thinkMsg: GreoMsg = { id: thinkId, role: "greo", content: "", ts: new Date(), thinking: true };

    setMessages((prev) => [...prev, userMsg, thinkMsg]);
    setThinking(true);

    const nextApi: ApiMsg[] = [...apiMsgs, { role: "user", content: text }];

    try {
      const res = await fetch("/api/greo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: nextApi, username }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) setNoKey(true);
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkId)
            .concat({ id: mkId(), role: "greo", content: data.error || "Something went wrong.", ts: new Date() })
        );
        return;
      }

      const greoMsg: GreoMsg = {
        id: mkId(),
        role: "greo",
        ts: new Date(),
        content: data.response,
        charts: data.visualizations ?? [],
        actions: data.actionLog ?? [],
      };

      setMessages((prev) => prev.filter((m) => m.id !== thinkId).concat(greoMsg));
      setApiMsgs([...nextApi, { role: "assistant", content: data.response }]);

      if (data.visualizations?.length) {
        setAllCharts((prev) => {
          const next = [...prev, ...data.visualizations];
          setChartIdx(next.length - 1);
          return next;
        });
      }
      if (data.actionLog?.length) setAllActions((prev) => [...prev, ...data.actionLog].slice(-60));
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkId)
          .concat({ id: mkId(), role: "greo", content: "Network error. Please try again.", ts: new Date() })
      );
    } finally {
      setThinking(false);
    }
  }, [input, thinking, apiMsgs, username]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ id: mkId(), role: "greo", ts: new Date(), content: `Chat cleared. Ready when you are, ${username}.` }]);
    setApiMsgs([]);
    setAllCharts([]);
    setChartIdx(0);
    setAllActions([]);
  };

  const renderText = (text: string) =>
    text.split("\n").map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, '<code style="background:#F9731620;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>');
      return <p key={i} className="leading-relaxed min-h-[1em]" dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />;
    });

  const currentChart = allCharts[chartIdx];

  const QUICK = [
    { icon: Database, label: "List my databases", q: "List all my databases with their sizes" },
    { icon: BarChart3, label: "Visualize data", q: "Show me a bar chart of my data" },
    {
      icon: Globe,
      label: "Fetch data online",
      q: "Fetch a sample JSON dataset from https://jsonplaceholder.typicode.com/users and visualize it",
    },
    {
      icon: Terminal,
      label: "Run a SQL query",
      q: "Run: SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) FROM information_schema.tables WHERE table_schema='public'",
    },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: "hsl(228 30% 8%)" }}>
      <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 border-b" style={{ background: "hsl(228 35% 11%)", borderColor: "#F9731622" }}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full blur-lg opacity-50" style={{ background: "#F97316" }} />
          <motion.img
            src={greoLogo}
            alt="Greo"
            className="relative w-8 h-8 object-contain rounded-full"
            animate={{
              filter: ["drop-shadow(0 0 6px #F97316)", "drop-shadow(0 0 14px #EF4444)", "drop-shadow(0 0 6px #F97316)"],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-[0.2em]" style={{ color: "#F97316" }}>
            GREO
          </h2>
          <p className="text-[9px] tracking-widest uppercase leading-none mt-0.5" style={{ color: "#FBBF2460" }}>
            Data Visualization AI
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#ffffff30" }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: noKey ? "#EF4444" : "#34D399", boxShadow: noKey ? "0 0 4px #EF4444" : "0 0 4px #34D399" }}
            />
            {noKey ? "API key missing" : "Active"}
          </span>
          <button onClick={clearChat} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: "#ffffff30" }} title="Clear chat">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {noKey && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="shrink-0 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm" style={{ background: "#EF444418", borderBottom: "1px solid #EF444430" }}>
              <KeyRound size={13} className="text-red-400 shrink-0" />
              <span className="flex-1 text-[13px]" style={{ color: "#FCA5A5" }}>
                <strong>OPENAI_API_KEY</strong> not configured — add it in your Replit <strong>Secrets</strong> tab, then restart.
              </span>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs shrink-0" style={{ color: "#F87171" }}>
                Get key <ExternalLink size={10} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 overflow-hidden flex">
        <div className="flex flex-col" style={{ width: "42%", borderRight: "1px solid #F9731615" }}>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#F9731625 transparent" }}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "greo" ? (
                  <img src={greoLogo} alt="Greo" className="shrink-0 w-6 h-6 rounded-full object-cover mt-0.5" />
                ) : (
                  <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: "hsl(220 18% 26%)", color: "#ffffff70" }}>
                    {username[0].toUpperCase()}
                  </div>
                )}
                <div
                  className="max-w-[84%] rounded-xl px-3.5 py-2.5 text-[13px]"
                  style={
                    msg.role === "user"
                      ? { background: "hsl(220 20% 20%)", color: "#ffffffdd", borderRadius: "12px 4px 12px 12px" }
                      : { background: "hsl(228 28% 15%)", border: "1px solid #F9731618", color: "#ffffffcc", borderRadius: "4px 12px 12px 12px" }
                  }
                >
                  {msg.thinking ? (
                    <div className="flex items-center gap-1 py-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full block" style={{ background: "#F97316" }} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.13 }} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5">{renderText(msg.content)}</div>
                  )}
                  {msg.charts && msg.charts.length > 0 && (
                    <p className="text-[10px] mt-2 font-medium" style={{ color: "#F97316" }}>
                      ↗ {msg.charts.length} visualization{msg.charts.length !== 1 ? "s" : ""} rendered →
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: "#F9731615" }}>
            <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ background: "hsl(228 28% 15%)", border: `1px solid ${thinking ? "#F9731640" : "#F9731620"}`, transition: "border-color 0.2s" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Greo anything about your data…"
                rows={1}
                className="flex-1 text-[13px] outline-none max-h-28 overflow-y-auto py-0.5"
                style={{ resize: "none", background: "transparent", color: "#ffffffcc", scrollbarWidth: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: !input.trim() || thinking ? "#F9731628" : "#F97316", color: "#fff" }}
              >
                {thinking ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
            <p className="text-[10px] mt-1 text-center" style={{ color: "#ffffff18" }}>
              Enter sends · Shift+Enter for new line
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden px-5 py-4 flex flex-col">
            <AnimatePresence mode="wait">
              {currentChart ? (
                <motion.div key={chartIdx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0">
                    <ChartRenderer spec={currentChart} />
                  </div>
                  {allCharts.length > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3 shrink-0">
                      <button
                        onClick={() => setChartIdx((i) => Math.max(0, i - 1))}
                        disabled={chartIdx === 0}
                        className="text-[11px] px-2.5 py-1 rounded-md disabled:opacity-30"
                        style={{ background: "#F9731620", color: "#F97316" }}
                      >
                        ← Prev
                      </button>
                      <span className="text-[11px]" style={{ color: "#ffffff35" }}>
                        {chartIdx + 1} / {allCharts.length}
                      </span>
                      <button
                        onClick={() => setChartIdx((i) => Math.min(allCharts.length - 1, i + 1))}
                        disabled={chartIdx === allCharts.length - 1}
                        className="text-[11px] px-2.5 py-1 rounded-md disabled:opacity-30"
                        style={{ background: "#F9731620", color: "#F97316" }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-3xl opacity-25" style={{ background: "#F97316", transform: "scale(1.8)" }} />
                    <motion.img
                      src={greoLogo}
                      alt="Greo"
                      className="relative w-20 h-20 object-contain"
                      animate={{
                        filter: ["drop-shadow(0 0 6px #F97316)", "drop-shadow(0 0 18px #EF4444)", "drop-shadow(0 0 6px #F97316)"],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: "#F97316" }}>
                      Visualizations appear here
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#ffffff28" }}>
                      Ask Greo to chart, analyse, or fetch data
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                    {QUICK.map(({ icon: Icon, label, q }) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 30);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "hsl(228 28% 15%)", border: "1px solid #F9731620", color: "#ffffff60" }}
                      >
                        <Icon size={11} style={{ color: "#F97316", flexShrink: 0 }} />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="shrink-0 border-t" style={{ borderColor: "#F9731618" }}>
            <div className="flex items-center justify-between px-4 py-1.5" style={{ borderBottom: "1px solid #F9731610" }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "#F9731650" }}>
                Action Log
              </span>
              {allActions.length > 0 && (
                <button onClick={() => setAllActions([])} className="text-[9px] uppercase tracking-wider" style={{ color: "#ffffff18" }}>
                  clear
                </button>
              )}
            </div>
            <div className="overflow-y-auto px-4 py-2" style={{ maxHeight: 130, scrollbarWidth: "thin", scrollbarColor: "#F9731618 transparent" }}>
              {allActions.length === 0 ? (
                <p className="text-[11px] italic" style={{ color: "#ffffff18" }}>
                  No actions yet
                </p>
              ) : (
                <div className="space-y-0.5">{[...allActions].reverse().map((a, i) => (<ActionEntry key={i} text={a} />))}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TellerFour;
