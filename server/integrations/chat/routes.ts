import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { chatStorage } from "./storage";

const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const GROQ_MODEL = "llama-3.3-70b-versatile";

const systemPrompt = `
You are CyberGuard Assistant, a cybersecurity assistant.

Provide:
- Simple explanations
- Safe cybersecurity advice
- Clear step-by-step guidance
- Beginner-friendly answers
`;

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

        const chatMessages: ChatCompletionMessageParam[] = messages.map(
          (m) => ({
            role:
              m.role === "assistant"
                ? ("assistant" as const)
                : ("user" as const),
            content: m.content,
          }),
        );

        if (!groqClient) {
          return res.status(503).json({ error: "Groq AI not configured" });
        }

        const completion = await groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...chatMessages,
          ],
          temperature: 0.4,
        });

        const fullResponse = completion.choices[0]?.message?.content;

        if (!fullResponse) {
          throw new Error("Empty response from Groq");
        }

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
