import { pgTable, text, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email"),
  recoveryPin: text("recovery_pin"),
  isInstitution: boolean("is_institution").notNull().default(false),
  institutionType: text("institution_type"),
  institutionName: text("institution_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userDatabases = pgTable("user_databases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fields: text("fields").array().notNull().default(sql`'{}'`),
  records: jsonb("records").notNull().default(sql`'[]'`),
  isPublic: boolean("is_public").notNull().default(false),
  dataKeyHash: text("data_key_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
