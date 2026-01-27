
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { getResponseGuidance } from "./incident_response";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Incident Response logic for different categories of cybercrime.
 * This is kept simple and readable for easy explanation.
 */
const INCIDENT_RESPONSE_STEPS: Record<string, any> = {
  phishing: {
    immediate: ["Disconnect from the internet", "Do not click any more links", "Close all browser tabs"],
    security: ["Change passwords for affected accounts", "Enable Two-Factor Authentication (2FA)"],
    evidence: ["Take screenshots of the phishing email/SMS", "Copy the URL of the malicious site"],
    nextSteps: ["Report to the service provider (e.g., your bank)", "Report on official cyber crime portal"]
  },
  financial_fraud: {
    immediate: ["Call your bank to freeze your account/cards", "Block the UPI ID or mobile number used", "Check recent transactions"],
    security: ["Reset your mobile banking PIN/Password", "Update your bank's contact details if changed"],
    evidence: ["Save transaction IDs/UTR numbers", "Keep screenshots of payment confirmations"],
    nextSteps: ["File a complaint with the bank's fraud department", "Report at cybercrime.gov.in"]
  },
  account_hacking: {
    immediate: ["Log out from all other devices", "Check if recovery email/phone has been changed"],
    security: ["Perform a password reset", "Revoke access to suspicious third-party apps", "Set up 2FA"],
    evidence: ["Screenshot login attempt notifications", "Record the hacker's activity if visible"],
    nextSteps: ["Contact the platform support (e.g., Instagram/Facebook)", "Inform your contacts about the hack"]
  },
  identity_theft: {
    immediate: ["Check for unauthorized account openings", "Alert your primary bank and creditors"],
    security: ["Place a fraud alert on your credit report", "Change passwords for all major services"],
    evidence: ["Gather all instances of impersonation or misuse", "Document any unauthorized correspondence"],
    nextSteps: ["Contact local police to report identity misuse", "Monitor your financial statements closely"]
  },
  default: {
    immediate: ["Stay calm and stop interacting with the threat", "Secure your device"],
    security: ["Change major account passwords", "Check privacy settings"],
    evidence: ["Preserve all communication logs and screenshots"],
    nextSteps: ["Consult a cyber security professional", "Report to the local cyber cell"]
  }
};

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

        Extract and format the information into a structured JSON object.
        CRITICAL INSTRUCTION: Do NOT include placeholders like "[address]", "[date]", "[unknown]" or similar tags. 
        If a detail is missing, omit it from the object or use the phrase "Information not available at the time of reporting".

        JSON fields to include:
        - incidentType: One of [phishing, financial_fraud, account_hacking, identity_theft] or "other".
        - description: A formal FIR summary. 
        - modeOfAttack: e.g. "SMS", "Phone Call" (if known).
        - impact: The loss or damage.
        - suggestedCategory: Broader category.
        - extractedDetails: A JSON object containing only keys that were explicitly mentioned (e.g., date, platform, suspect_details, loss_amount). Do NOT include keys for missing information.
        - nextSteps: AI-generated specific response instructions based on the incident.

        Respond ONLY with the valid JSON object.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) throw new Error("Empty response from AI");

      const structuredData = JSON.parse(responseContent);
      
      // INCIDENT RESPONSE MODULE:
      // We map the detected incident to expert-vetted guidance.
      // We use a more robust matching strategy to ensure the user gets help even if the AI's label varies slightly.
      let category = (structuredData.incidentType || "").toLowerCase();
      
      // Standardize the category for better matching
      if (category.includes("phish")) category = "phishing";
      else if (category.includes("fraud") || category.includes("money") || category.includes("bank")) category = "financial_fraud";
      else if (category.includes("hack") || category.includes("compromise")) category = "account_hacking";
      else if (category.includes("identity") || category.includes("theft")) category = "identity_theft";
      else if (category.includes("email")) category = "email_compromise";
      
      const isUncertain = !category || category === "other" || category === "unknown";
      const guidance = isUncertain ? null : getResponseGuidance(category);

      // Dynamic report building logic:
      // We check for available fields in extractedDetails to avoid displaying empty placeholders.
      // This makes the report professional and ready for official use.
      let reportLines = [
        "Cybercrime Report Template",
        "To: The Officer-in-Charge, Cyber Cell",
        `Subject: Complaint regarding ${structuredData.incidentType}`
      ];

      // Conditional rendering: only add fields if AI found them in the user input.
      const details = structuredData.extractedDetails || {};
      if (details.complainant_name) reportLines.push(`Complainant: ${details.complainant_name}`);
      if (details.date) reportLines.push(`Date and Time: ${details.date}`);
      if (details.platform) reportLines.push(`Platform: ${details.platform}`);
      if (details.suspect_details) reportLines.push(`Suspect Details: ${details.suspect_details}`);
      
      reportLines.push("\nChronological Description:");
      reportLines.push(structuredData.description);
      
      if (structuredData.impact) reportLines.push(`\nLoss/Impact: ${structuredData.impact}`);
      
      reportLines.push("\nPrayer/Request: I request you to register this complaint and take necessary action under the relevant sections of the IT Act and IPC to recover my funds/data and apprehend the culprit.");

      structuredData.generatedReportText = reportLines.join("\n");
      structuredData.guidance = guidance;

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
      // For simplicity, we re-run generation here as done previously
      const prompt = `Analyze: "${input.rawDescription}" and return JSON with incidentType, description, etc. NO placeholders.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const structuredData = JSON.parse(completion.choices[0].message.content || "{}");
      
      const reportData = {
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
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  return httpServer;
}
