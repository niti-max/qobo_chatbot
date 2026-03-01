import { useState } from "react";
import ChatInput from "../components/ChatInput.jsx";
import ChatMessages from "../components/ChatMessages.jsx";
import { sendChatMessage } from "../services/chatService.js";

const initialMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hello! I'm your Qobo AI Assistant.\n\nAsk me anything about Qobo — pricing, features, how it works, or anything else. I'll get you an accurate answer instantly.",
  type: "predefined",
  source: "qobo.dev",
};

const SUGGESTED = [
  "What is Qobo?",
  "How much does Qobo cost?",
  "How do I build a website with Qobo?",
  "Can I preview before paying?",
  "What's included in the annual plan?",
  "Does Qobo include hosting?",
  "Who is Qobo for?",
  "How do I contact Qobo?",
];

const createMessage = (payload) => ({ id: crypto.randomUUID(), ...payload });

// ── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ onAsk, onClose }) => (
  <aside className="flex h-full w-72 flex-col border-r border-white/5 bg-white/2 backdrop-blur-xl lg:w-full">
    {/* Brand block */}
    <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f8a70] to-[#125d50] shadow-xl shadow-[#1f8a70]/30">
        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <div className="absolute inset-0 rounded-2xl bg-[#1f8a70] opacity-25 blur-lg" />
      </div>
      <h2 className="text-base font-bold text-white">Qobo AI</h2>

      {/* Divider */}
      <div className="mt-5 h-px w-full bg-white/6" />

      <p className="mt-5 text-left text-[13px] leading-relaxed text-white/55">
        Build a professional website just by chatting — no code, no design skills needed.
        Get an instant preview before you pay anything.
      </p>

      {/* Quick links */}
      <div className="mt-5 flex w-full flex-col gap-2">
        <a href="https://qobo.dev" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/4 px-3 py-2.5 text-xs text-white/60 transition-all hover:border-[#1f8a70]/30 hover:bg-[#1f8a70]/8 hover:text-white">
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#1f8a70]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          Visit qobo.dev
        </a>
        <a href="https://wa.me/919901631188" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/4 px-3 py-2.5 text-xs text-white/60 transition-all hover:border-[#25d366]/30 hover:bg-[#25d366]/8 hover:text-white">
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#25d366]" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.489 2.027 7.789L.057 31.25a.75.75 0 00.916.916l7.461-2.037A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.275 13.275 0 01-6.773-1.852l-.486-.29-4.933 1.347 1.347-4.932-.29-.486A13.275 13.275 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333z"/>
            <path d="M23.3 19.773c-.405-.203-2.394-1.182-2.766-1.317-.373-.136-.644-.203-.914.203-.271.405-1.047 1.317-1.283 1.587-.236.271-.473.304-.878.101-.405-.203-1.71-.63-3.257-2.01-1.204-1.073-2.017-2.399-2.253-2.804-.236-.405-.025-.624.177-.826.182-.181.405-.473.608-.708.203-.236.27-.405.405-.676.136-.271.068-.507-.034-.71-.101-.203-.914-2.196-1.25-3.007-.33-.79-.664-.682-.914-.695-.236-.011-.507-.014-.778-.014-.271 0-.71.101-1.081.507-.371.405-1.418 1.385-1.418 3.378 0 1.993 1.452 3.919 1.655 4.19.203.27 2.858 4.362 6.921 6.118.967.418 1.721.667 2.31.852.97.31 1.854.266 2.552.161.778-.116 2.394-.979 2.732-1.926.338-.946.338-1.756.236-1.926-.101-.169-.372-.271-.777-.473z"/>
          </svg>
          Chat on WhatsApp
        </a>
      </div>
    </div>

    {/* Suggested questions */}
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        Try asking
      </p>
      <div className="flex flex-col gap-1.5">
        {SUGGESTED.map((q) => (
          <button
            key={q}
            onClick={() => { onAsk(q); onClose?.(); }}
            className="w-full rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-left text-[12.5px] text-white/55 transition-all hover:border-[#1f8a70]/25 hover:bg-[#1f8a70]/8 hover:text-white/90 active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-white/5 px-5 py-4 text-center">
      <p className="text-[10px] text-white/20">© 2025 Qobo · All rights reserved</p>
    </div>
  </aside>
);

// ── Main page ───────────────────────────────────────────────────────────────
const ChatPage = () => {
  const [messages, setMessages] = useState([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = async (input) => {
    setMessages((prev) => [...prev, createMessage({ role: "user", text: input })]);
    setLoading(true);
    try {
      const result = await sendChatMessage(input);
      setMessages((prev) => [
        ...prev,
        createMessage({
          role: "assistant",
          text: result.answer,
          type: result.type,
          source: result.source,
          sourceUrl: result.sourceUrl,
        }),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage({
          role: "assistant",
          text: "I'm unable to fetch a response right now. Please try again in a moment.",
          type: "ai-generated",
          source: "gemini",
        }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117]">

      {/* Mesh background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 10% 20%, rgba(31,138,112,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 85%, rgba(31,138,112,0.10) 0%, transparent 55%), radial-gradient(ellipse 100% 100% at 50% 50%, #0d1117 0%, #080c10 100%)",
      }} />

      {/* ── Header ── */}
      <header className="relative z-20 flex flex-shrink-0 items-center justify-between border-b border-white/5 bg-white/3 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/6 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >bar
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f8a70] to-[#125d50] shadow-lg shadow-[#1f8a70]/30">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">Qobo AI ChatBot</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/60" />
              <span className="text-[11px] text-white/35">Online · Always available</span>
            </div>
          </div>
        </div>

        {/* Right icons (shown on mobile since sidebar is hidden) */}
        <div className="flex items-center gap-1 lg:hidden">
          <a href="https://wa.me/919901631188" target="_blank" rel="noopener noreferrer" title="WhatsApp"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-[#25d366]/10 hover:text-[#25d366]">
            <svg className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.489 2.027 7.789L.057 31.25a.75.75 0 00.916.916l7.461-2.037A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.275 13.275 0 01-6.773-1.852l-.486-.29-4.933 1.347 1.347-4.932-.29-.486A13.275 13.275 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333z"/>
              <path d="M23.3 19.773c-.405-.203-2.394-1.182-2.766-1.317-.373-.136-.644-.203-.914.203-.271.405-1.047 1.317-1.283 1.587-.236.271-.473.304-.878.101-.405-.203-1.71-.63-3.257-2.01-1.204-1.073-2.017-2.399-2.253-2.804-.236-.405-.025-.624.177-.826.182-.181.405-.473.608-.708.203-.236.27-.405.405-.676.136-.271.068-.507-.034-.71-.101-.203-.914-2.196-1.25-3.007-.33-.79-.664-.682-.914-.695-.236-.011-.507-.014-.778-.014-.271 0-.71.101-1.081.507-.371.405-1.418 1.385-1.418 3.378 0 1.993 1.452 3.919 1.655 4.19.203.27 2.858 4.362 6.921 6.118.967.418 1.721.667 2.31.852.97.31 1.854.266 2.552.161.778-.116 2.394-.979 2.732-1.926.338-.946.338-1.756.236-1.926-.101-.169-.372-.271-.777-.473z"/>
            </svg>
          </a>
          <a href="https://qobo.dev" target="_blank" rel="noopener noreferrer" title="qobo.dev"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-[#1f8a70]/10 hover:text-[#1f8a70]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </a>
        </div>
      </header>

      {/* ── Body: sidebar + chat ── */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">

        {/* Mobile drawer overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — desktop always visible, mobile as drawer */}
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? "22%" : undefined }}
          className={`fixed inset-y-0 left-0 z-40 pt-[57px] transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:flex-shrink-0 lg:pt-0 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onAsk={handleSend} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatMessages messages={messages} isTyping={loading} />
          </div>
          <div className="flex-shrink-0">
            <ChatInput onSend={handleSend} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
