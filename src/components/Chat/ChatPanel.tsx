import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import type { AnalysisResult, ChatMessage } from "../../types";
import { answerFollowUp } from "../../services/gemini";

interface Props {
  analysis: AnalysisResult | null;
}

const SUGGESTIONS = [
  "Why is 3 PM risky?",
  "Why is morning better?",
  "Is hiking still reasonable?",
  "What weather factor is the biggest problem?"
];

export function ChatPanel({ analysis }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const disabled = !analysis;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I have the full Risk Engine result and environmental data. Ask me anything about why conditions are safe or risky — I'll stick to the numbers already computed.",
          timestamp: new Date().toISOString(),
          isFallback: false
        }
      ]);
    }
    if (!analysis) setMessages([]);
  }, [analysis?.risk?.dataTimestamp]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !analysis || loading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString()
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { answer, provider } = await answerFollowUp(content, analysis);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer,
          timestamp: new Date().toISOString(),
          isFallback: provider === "fallback"
        }
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `I couldn't reach the AI service right now. ${e?.message ?? "Please try again."}`,
          timestamp: new Date().toISOString(),
          isFallback: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col min-h-[520px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-nebula-400" /> Ask AI
        </h3>
        <span
          className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
            disabled
              ? "bg-white/5 text-gray-500 border border-white/10"
              : "bg-risk-low/15 text-risk-low border border-risk-low/30"
          }`}
        >
          {disabled ? "Run analysis first" : "Ready"}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto space-y-3 pr-1 mb-4 min-h-[280px]"
      >
        {messages.length === 0 && !disabled && (
          <div className="text-sm text-gray-500 text-center py-12">
            Ask a question about the results above.
          </div>
        )}
        {messages.length === 0 && disabled && (
          <div className="text-sm text-gray-500 text-center py-12 flex flex-col items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-starlight-400" />
            Complete an analysis before asking follow-up questions.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                m.role === "user" ? "bg-nebula-500/20 order-2" : "bg-starlight-500/15 order-1"
              }`}
            >
              {m.role === "user" ? (
                <User className="w-4 h-4 text-nebula-400" />
              ) : (
                <Bot className="w-4 h-4 text-starlight-400" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-br from-nebula-500 to-indigo-500 text-white rounded-tr-md order-1"
                  : "bg-white/5 border border-white/10 text-gray-100 rounded-tl-md order-2"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.isFallback && (
                <div className="mt-2 text-[10px] uppercase tracking-widest text-starlight-400/80 font-bold">
                  ⚠ Rule-based fallback · Gemini unavailable
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-starlight-500/15">
              <Loader2 className="w-4 h-4 text-starlight-400 animate-spin" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.filter((_, i) => i < 4).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-nebula-500/50 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={disabled || loading}
          placeholder={disabled ? "Analyze first to enable chat" : "Ask about the risk results..."}
          className="input-field"
        />
        <button
          className="btn-primary px-4"
          onClick={() => send()}
          disabled={disabled || loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
