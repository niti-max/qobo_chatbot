import { useMemo, useState } from "react";
import ChatInput from "../components/ChatInput.jsx";
import ChatMessages from "../components/ChatMessages.jsx";
import { sendChatMessage } from "../services/chatService.js";

const initialMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hello! I’m your Qobo assistant. Ask me anything about Qobo.",
  type: "predefined",
  source: "qobo.dev"
};

const createMessage = (payload) => ({
  id: crypto.randomUUID(),
  ...payload
});

const ChatPage = () => {
  const [messages, setMessages] = useState([initialMessage]);
  const [loading, setLoading] = useState(false);

  const isTyping = useMemo(() => loading, [loading]);

  const handleSend = async (input) => {
    const userMessage = createMessage({ role: "user", text: input });
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      const result = await sendChatMessage(input);
      const assistantMessage = createMessage({
        role: "assistant",
        text: result.answer,
        type: result.type,
        source: result.source,
        sourceUrl: result.sourceUrl
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (_error) {
      const fallback = createMessage({
        role: "assistant",
        text: "I’m unable to fetch a response right now. Please try again in a moment.",
        type: "ai-generated",
        source: "gemini"
      });
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-4 sm:px-6 sm:py-8">
      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Qobo Chatbot</h1>
        <p className="mt-1 text-sm text-slate-600">FAQ-first answers with Gemini fallback when no verified match exists.</p>
      </section>

      <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
        <div className="flex-1 overflow-hidden">
          <ChatMessages messages={messages} isTyping={isTyping} />
        </div>
        <ChatInput onSend={handleSend} loading={loading} />
      </section>
    </main>
  );
};

export default ChatPage;
