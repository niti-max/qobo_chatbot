import ChatMessage from "./ChatMessage.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

const ChatMessages = ({ messages, isTyping }) => {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          text={message.text}
          type={message.type}
          source={message.source}
          sourceUrl={message.sourceUrl}
        />
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
