import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold mb-4">Cyber Assistant</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Get real-time answers about cybersecurity threats, terms, and protection strategies.
          Our AI is here to guide you.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
