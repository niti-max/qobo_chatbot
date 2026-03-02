import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const ChatInput = ({ onSend, loading }) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setValue("");
    await onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const canSend = !loading && value.trim().length > 0;

  return (
    <div className="border-t border-white/5 bg-white/2 backdrop-blur-xl">
    <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all duration-200 ${
          canSend ? "border-[#1f8a70]/50 bg-white/5 shadow-sm shadow-[#1f8a70]/10" : "border-white/8 bg-white/4"
        }`}>
          {/* Mic / chat icon on left */}
          <svg className="h-4 w-4 flex-shrink-0 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>

          <input
            id="chat-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Qobo..."
            disabled={loading}
            autoComplete="off"
            className="flex-1 bg-transparent text-base sm:text-sm text-white placeholder:text-white/25 outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!canSend}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1f8a70] text-white shadow-md shadow-[#1f8a70]/30 transition-all duration-150 hover:bg-[#26b090] hover:scale-105 hover:shadow-[#1f8a70]/50 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:scale-100 disabled:shadow-none"
            aria-label="Send"
          >
            {loading ? <LoadingSpinner /> : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </form>
      <p className="mt-2.5 text-center text-[10px] text-white/18">
        Qobo AI · Answers sourced from verified FAQs &amp; live data
      </p>
    </div>
    </div>
  );
};

export default ChatInput;
