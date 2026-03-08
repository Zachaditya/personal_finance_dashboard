"use client";

import { useEffect, useRef, useState } from "react";
import { postAdvisorChat } from "../../lib/advisor-api";
import type { ChatMessage as ChatMessageType, FinancialContext } from "../../lib/types";
import { ChatMessage } from "./ChatMessage";

const STARTER_PROMPTS = [
  "How is my debt-to-income ratio?",
  "Am I saving enough for retirement?",
  "Should I pay off debt or invest first?",
  "How can I improve my credit score?",
];

type Props = {
  context: FinancialContext;
};

export function AdvisorChat({ context }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessageType = { role: "user", content };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await postAdvisorChat({
        message: content,
        history: messages.slice(-20),
        context,
      });
      setMessages([...newHistory, { role: "assistant", content: res.reply }]);
    } catch {
      setError("Failed to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white flex flex-col h-[600px] shadow-sm">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                <span className="text-gold-400 text-xl">◈</span>
              </div>
              <p className="text-sm font-medium text-ink-1">AI Financial Advisor</p>
              <p className="text-xs text-ink-3 mt-1">
                Ask me anything about your finances. I have context about your profile.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-[#e5e7eb] bg-navy-800 hover:bg-navy-700 px-3 py-1.5 text-xs text-ink-2 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0">
              <span className="text-gold-400 text-xs">◈</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#e5e7eb] p-4 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your finances… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[#e5e7eb] bg-navy-800 px-4 py-3 text-sm text-ink-1 placeholder-ink-4 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/30 transition-colors"
        />
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="rounded-xl bg-gold-400 hover:bg-gold-300 disabled:bg-navy-800 disabled:text-ink-4 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
