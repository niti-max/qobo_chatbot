const SourceBadge = ({ type }) => {
  if (type === "predefined" || type === "web-sourced") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#1f8a70]/25 bg-[#1f8a70]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1f8a70]">
        <span className="h-1 w-1 rounded-full bg-[#1f8a70]" />
        Verified
      </span>
    );
  }
  if (type === "out-of-scope") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        <span className="h-1 w-1 rounded-full bg-amber-400" />
        Out of Scope
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
      <span className="h-1 w-1 rounded-full bg-blue-400" />
      AI Generated
    </span>
  );
};

export default SourceBadge;
