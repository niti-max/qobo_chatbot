import { useEffect, useRef } from "react";
import SourceBadge from "./SourceBadge.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

// ─── Inline renderer: **bold** and bare URLs ───────────────────────────────
const renderInline = (line, key) => {
  const parts = line.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g);
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part))
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        if (/^https?:\/\/\S+$/.test(part))
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
              className="break-all text-[#1f8a70] underline underline-offset-2 hover:text-[#26b090]">
              {part}
            </a>
          );
        return part;
      })}
    </span>
  );
};

// ─── Block renderer: bullets, spacers, paragraphs ─────────────────────────
const renderText = (text) => {
  const lines = text.split("\n");
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[•\-]\s/.test(line)) {
      const bullets = [];
      while (i < lines.length && /^[•\-]\s/.test(lines[i])) {
        bullets.push(lines[i].replace(/^[•\-]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="mt-1.5 space-y-1.5 pl-2">
          {bullets.map((b, bi) => (
            <li key={bi} className="flex items-start gap-2">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#1f8a70]" />
              <span>{renderInline(b, bi)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") { nodes.push(<div key={`sp-${i}`} className="h-2" />); i++; continue; }
    nodes.push(<p key={`p-${i}`} className="leading-relaxed">{renderInline(line, i)}</p>);
    i++;
  }
  return nodes;
};

// ─── Avatars ───────────────────────────────────────────────────────────────
const BotAvatar = () => (
  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f8a70] to-[#125d50] shadow shadow-[#1f8a70]/40">
    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  </div>
);

const UserAvatar = () => (
  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
    <svg className="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </div>
);

// ─── Single message bubble ─────────────────────────────────────────────────
const ChatMessage = ({ role, text, type, source, sourceUrl }) => {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {isUser ? <UserAvatar /> : <BotAvatar />}
      <div className={`flex max-w-[78%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "rounded-br-sm bg-[#1f8a70] text-white shadow-lg shadow-[#1f8a70]/20"
            : "rounded-bl-sm border border-white/6 bg-white/5 text-white/85 shadow-sm backdrop-blur-sm"
        }`}>
          {isUser ? <p className="leading-relaxed">{text}</p> : <div>{renderText(text)}</div>}
        </div>
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 pl-1">
            <SourceBadge type={type} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Message list with auto-scroll ────────────────────────────────────────
const ChatMessages = ({ messages, isTyping }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          role={m.role}
          text={m.text}
          type={m.type}
          source={m.source}
          sourceUrl={m.sourceUrl}
        />
      ))}
      {isTyping && (
        <div className="flex items-end gap-2.5">
          <BotAvatar />
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
    </div>
  );
};

export default ChatMessages;
