
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export Auth and Chat models so they are available
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === REPORTS TABLE ===
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id), // Use text to match Auth user ID type (varchar)
  title: text("title").notNull(),
  rawDescription: text("raw_description").notNull(),
  incidentType: text("incident_type").notNull(), // e.g. "phishing", "financial_fraud", "identity_theft"
  structuredReport: jsonb("structured_report").notNull(), // JSON object with FIR fields and full text
  status: text("status").notNull().default("draft"), // draft, finalized
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true 
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// === API TYPES ===
export type CreateReportRequest = {
  title: string;
  rawDescription: string;
};

export type GenerateReportResponse = {
  incidentType: string;
  structuredReport: {
    incidentType: string;
    description: string;
    modeOfAttack: string;
    impact: string;
    suggestedCategory: string;
    nextSteps: string[];
  };
};

export type ReportResponse = Report;
