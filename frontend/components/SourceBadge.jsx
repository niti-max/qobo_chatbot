const SourceBadge = ({ type }) => {
  if (type === "predefined") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        ✅ Verified Qobo Answer
      </span>
    );
  }

  if (type === "out-of-scope") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        ⚠️ Out of Scope
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
      🤖 AI Generated
    </span>
  );
};

export default SourceBadge;
