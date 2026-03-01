const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-slate-200 px-4 py-3 w-fit">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
    </div>
  );
};

export default TypingIndicator;
