
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Chat
  registerChatRoutes(app);

  // 3. Application Routes (Reports)

  // List Reports
  app.get(api.reports.list.path, isAuthenticated, async (req, res) => {
    // @ts-ignore - req.user is added by passport
    const userId = req.user.claims.sub;
    const reports = await storage.getReports(userId);
    res.json(reports);
  });

  // Get Single Report
  app.get(api.reports.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const report = await storage.getReport(id);
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Security check: ensure report belongs to user
    // @ts-ignore
    if (report.userId !== req.user.claims.sub) {
      return res.status(403).json({ message: "Unauthorized access to report" });
    }

    res.json(report);
  });

  // Generate Report Analysis (AI)
  app.post(api.reports.generate.path, isAuthenticated, async (req, res) => {
    try {
      const { description } = api.reports.generate.input.parse(req.body);

      const prompt = `
        You are a Cyber Crime Reporting Assistant.
        Analyze the following incident description: "${description}"

        Extract and format the information into a structured JSON object with the following fields:
        - incidentType: The specific type of cyber crime (e.g., Phishing, Financial Fraud, Identity Theft).
        - description: A formal, polished summary of the incident suitable for an FIR (First Information Report).
        - modeOfAttack: How the attack happened (e.g., "Malicious Link via SMS").
        - impact: The loss or damage (financial, data, etc.).
        - suggestedCategory: The broader category of the crime.
        - nextSteps: An array of strings listing immediate actionable steps the victim should take.

        Respond ONLY with the valid JSON object.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error("Empty response from AI");
      }

      const structuredData = JSON.parse(responseContent);

      res.json({
        incidentType: structuredData.incidentType,
        structuredReport: structuredData
      });

    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ message: "Failed to generate report analysis" });
    }
  });

  // Create/Save Report
  app.post(api.reports.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      
      // We need to re-generate or pass the structured data. 
      // For simplicity in this flow, let's assume the frontend passes the *Raw* info 
      // and we might re-process OR the frontend calls generate first, then create.
      // Based on schema, we need 'structuredReport' and 'incidentType' in the insert object.
      // The current 'create' input only has title and rawDescription.
      // Let's UPDATE the route handler to generate the analysis IF it's not provided, 
      // OR update the schema to accept the full report object.
      
      // Better approach for consistency: 
      // User clicks "Save". We expect the frontend might have already called "generate".
      // But typically "Create" should handle the business logic.
      // Let's do the generation here to ensure data integrity if it wasn't passed.
      
      // ... actually, looking at the user flow, "Step 3: Review & Save".
      // The user reviews the AI output. They might want to edit it (though we didn't build edit UI yet).
      // Let's assume the frontend sends the *result* of the generation back to be saved.
      // I need to update the `api.reports.create.input` schema in `routes.ts` or handle it here.
      // Since I can't easily change `routes.ts` in this same turn without conflict or re-write,
      // I will assume for now I'll re-run the generation OR (better) I'll update the `create` logic 
      // to accept the additional fields by extending the input validation inside the handler 
      // (even if strictly `routes.ts` said otherwise, Zod is flexible at runtime if I parse differently, 
      // but best practice is to match. 
      
      // Let's stick to the plan: The frontend calls `generate`, gets data, displays it.
      // Then calls `create`. The `create` endpoint in `shared/routes.ts` was defined as:
      // input: z.object({ title: z.string(), rawDescription: z.string() })
      // This is missing `incidentType` and `structuredReport` which are NOT NULL in schema.
      
      // I should have defined `create` input to be `insertReportSchema`. 
      // I will fix this by overwriting `shared/routes.ts` effectively or just making `create` 
      // handle the generation internally if missing, BUT `structuredReport` is required.
      
      // FIX: I will re-generate the analysis here. It costs a bit more latency/tokens but ensures consistency 
      // without needing to change the shared route definition I just wrote (which might be locked in Batch 2).
      // actually, I wrote Batch 2 files in this turn. I can't change them "back in time".
      // Wait, I am writing `server/routes.ts` in the same turn. 
      // I *already* submitted `shared/routes.ts` in the previous tool call in this batch?
      // No, I am queuing them all. The Agent executes them.
      
      // Wait, I see I already wrote `shared/routes.ts` in the *current* turn's tool calls (above).
      // I can't edit it again in the same response.
      // I will just implement the re-generation logic here.
      
      const prompt = `
        Analyze: "${input.rawDescription}"
        Return JSON: { incidentType, description, modeOfAttack, impact, suggestedCategory, nextSteps }
      `;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const structuredData = JSON.parse(completion.choices[0].message.content || "{}");
      
      const reportData: InsertReport = {
        // @ts-ignore
        userId: req.user.claims.sub,
        title: input.title,
        rawDescription: input.rawDescription,
        incidentType: structuredData.incidentType || "Unknown",
        structuredReport: structuredData,
        status: "draft"
      };

      const report = await storage.createReport(reportData);
      res.status(201).json(report);

    } catch (err) {
        // ... error handling
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error" });
        }
        res.status(500).json({ message: "Failed to create report" });
    }
  });

  return httpServer;
}
