"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../../models";
import InputToolbar from "../../input-toolbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  respondedModel?: string;
  warning?: string;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatLoaded, setChatLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    async function loadChat() {
      try {
        const res = await fetch(`/api/chats/${id}`);
        if (!res.ok) {
          router.push("/chat");
          return;
        }
        const chat = await res.json();
        setModel(chat.model);
        setMessages(
          chat.messages.map((m: Message) => ({
            role: m.role,
            content: m.content,
            respondedModel: m.respondedModel,
            warning: m.warning,
          }))
        );
        setChatLoaded(true);
      } catch {
        router.push("/chat");
      }
    }
    loadChat();
  }, [id, router]);

  const hasScrolled = useRef(false);
  useLayoutEffect(() => {
    if (!messages.length) return;
    const behavior = hasScrolled.current ? "smooth" : "instant";
    messagesEndRef.current?.scrollIntoView({ behavior });
    hasScrolled.current = true;
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, currentMessages: Message[]) => {
      setError(null);
      const userMessage: Message = { role: "user", content: text };
      const updatedMessages = [...currentMessages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            model,
            history: currentMessages,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong");
          setLoading(false);
          return;
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          respondedModel: data.respondedModel,
          warning: data.warning,
        };
        const allMessages = [...updatedMessages, assistantMessage];
        setLoading(false);
        setMessages(allMessages);

        const newMsgs = [
          { role: "user" as const, content: text, model },
          {
            role: "assistant" as const,
            content: data.response,
            model,
            respondedModel: data.respondedModel,
            warning: data.warning,
          },
        ];

        await fetch(`/api/chats/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMsgs }),
        });

        window.dispatchEvent(new Event("chats-updated"));
      } catch {
        setError("Failed to connect to the server");
      } finally {
        setLoading(false);
      }
    },
    [model, id]
  );

  return (
    <div className="relative flex flex-col h-full bg-zinc-900 text-zinc-100">
      <button
        onClick={() => router.push("/chat")}
        className="absolute top-3 right-4 z-10 bg-white hover:bg-zinc-200 text-zinc-900 rounded-xl px-5 h-10 text-sm font-medium transition-colors"
      >
        New Chat
      </button>

      <main
        className="flex-1 overflow-y-auto px-4 py-6"
        onCopy={(e) => {
          const selection = window.getSelection()?.toString();
          if (selection) {
            e.preventDefault();
            e.clipboardData.setData("text/plain", selection.trimEnd());
          }
        }}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {!chatLoaded && (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <p className="text-zinc-500 text-lg">Loading chat...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 inline-block ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {msg.role === "assistant" && msg.respondedModel && (
                  <span
                    className={`block text-xs mb-1 ${msg.warning ? "text-yellow-400" : "text-zinc-500"}`}
                  >
                    {msg.warning || msg.respondedModel}
                  </span>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm max-w-lg">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <InputToolbar
        input={input}
        setInput={setInput}
        model={model}
        setModel={setModel}
        onSubmit={(text) => sendMessage(text, messages)}
        loading={loading}
        modelLocked={chatLoaded}
      />
    </div>
  );
}
