import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const ChatInput = ({ onSend, loading }) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed || loading) {
      return;
    }

    setValue("");
    await onSend(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask anything about Qobo..."
          className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none ring-0 transition focus:border-slate-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 min-w-24 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <LoadingSpinner /> : "Send"}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
