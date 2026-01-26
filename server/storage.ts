
import { db } from "./db";
import {
  reports,
  type Report,
  type InsertReport,
  type User
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Import Auth storage interface
import { IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Report operations
  getReports(userId: string): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
}

export class DatabaseStorage implements IStorage {
  // === Auth Storage Implementation (delegated or implemented here) ===
  // Since we have a separate auth storage file, we can either extend it or implement it.
  // The template usually expects a single storage instance or composed one.
  // For simplicity, I'll re-implement the methods calling the db directly 
  // or we could merge them. Let's implement directly to keep it self-contained in one class if needed,
  // BUT the auth integration already exports `authStorage`.
  // To strictly follow the "one storage" pattern often used in these templates:

  async getUser(id: string): Promise<User | undefined> {
    // This duplicates logic from auth/storage.ts but ensures IStorage satisfies IAuthStorage
    // Ideally we'd import the auth storage and delegate, but types need to match.
    // Let's just use the db directly here as it's safe.
    const { users } = await import("@shared/models/auth");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const { users } = await import("@shared/models/auth");
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // === Report Operations ===
  async getReports(userId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }
}

export const storage = new DatabaseStorage();
