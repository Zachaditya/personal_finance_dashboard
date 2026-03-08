import type { ChatMessage as ChatMessageType } from "../../lib/types";

type Props = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5`}>
      {!isUser && (
        <div className="mt-0.5 shrink-0 h-7 w-7 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
          <span className="text-gold-400 text-xs leading-none">◈</span>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-gold-400/10 text-ink-1 ring-1 ring-gold-400/15 rounded-tr-sm"
            : "bg-navy-800 text-ink-2 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
