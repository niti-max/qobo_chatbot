import SourceBadge from "./SourceBadge.jsx";

const ChatMessage = ({ role, text, type, source, sourceUrl }) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
          isUser ? "bg-slate-900 text-white" : "bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>

        {!isUser && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SourceBadge type={type} />
            {type === "predefined" && sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-700 underline"
              >
                Source: {source}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
