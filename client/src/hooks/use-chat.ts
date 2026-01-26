import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertConversation, type InsertMessage } from "@shared/models/chat";
import { useToast } from "@/hooks/use-toast";

// Since chat routes aren't in shared/routes (from blueprint), we define them here based on the blueprint spec
const CHAT_API = {
  conversations: "/api/conversations",
  messages: (id: number) => `/api/conversations/${id}/messages`,
  history: (id: number) => `/api/conversations/${id}`,
};

export function useConversations() {
  return useQuery({
    queryKey: [CHAT_API.conversations],
    queryFn: async () => {
      const res = await fetch(CHAT_API.conversations, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json();
    },
  });
}

export function useChatHistory(id: number | null) {
  return useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(CHAT_API.history(id), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chat history");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (title: string = "New Assistance Chat") => {
      const res = await fetch(CHAT_API.conversations, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start conversation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_API.conversations] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not start a new chat.",
        variant: "destructive",
      });
    },
  });
}

// NOTE: Sending messages is usually handled with SSE manually in the component for streaming,
// but we provide a basic mutation here just in case.
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      // This endpoint returns a stream, so we might not want to use standard mutation for the stream itself,
      // but this is useful if we just want to fire and forget (though UI usually wants to show the stream).
      // For proper streaming, use the fetch API directly in the component.
      throw new Error("Use streaming implementation in component for chat messages");
    }
  });
}
