const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/6 bg-white/5 px-4 py-3 backdrop-blur-sm">
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1f8a70] [animation-delay:-0.3s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1f8a70] [animation-delay:-0.15s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1f8a70]" />
  </div>
);

export default TypingIndicator;
