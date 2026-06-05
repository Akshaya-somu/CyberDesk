import type { Express, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatStorage } from "./storage";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);

      const conversation = await chatStorage.getConversation(id);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await chatStorage.getMessagesByConversation(id);

      res.json({
        ...conversation,
        messages,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;

      const conversation = await chatStorage.createConversation(
        title || "New Chat",
      );

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);

      await chatStorage.deleteConversation(id);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response
  app.post(
    "/api/conversations/:id/messages",
    async (req: Request, res: Response) => {
      try {
        const conversationId = parseInt(String(req.params.id), 10);
        const { content } = req.body;

        // Save user message
        await chatStorage.createMessage(conversationId, "user", content);

        // Get conversation history
        const messages =
          await chatStorage.getMessagesByConversation(conversationId);

        const chatMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        if (!genAI) {
          return res.status(503).json({ error: "Gemini not configured" });
        }

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        });

        const prompt = `
You are CyberGuard Assistant, a cybersecurity assistant.

Provide:
- Simple explanations
- Safe cybersecurity advice
- Clear step-by-step guidance
- Beginner-friendly answers

Conversation:
${chatMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}
`;

        const result = await model.generateContent(prompt);

        const fullResponse = result.response.text();

        // Save assistant response
        await chatStorage.createMessage(
          conversationId,
          "assistant",
          fullResponse,
        );

        res.json({
          content: fullResponse,
        });
      } catch (error) {
        console.error("Error sending message:", error);

        res.status(500).json({
          error: "Failed to send message",
        });
      }
    },
  );
}
