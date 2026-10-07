"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import InputToolbar from "../input-toolbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  respondedModel?: string;
  warning?: string;
}

export default function NewChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledPending = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

        const chatMessages = allMessages.map((m) => ({
          role: m.role,
          content: m.content,
          model,
          respondedModel: m.respondedModel,
          warning: m.warning,
        }));

        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: chatMessages }),
        });

        setLoading(false);
        if (createRes.ok) {
          const chat = await createRes.json();
          window.dispatchEvent(new Event("chats-updated"));
          router.push(`/chat/${chat.id}`);
        } else {
          setMessages(allMessages);
        }
      } catch {
        setError("Failed to connect to the server");
      } finally {
        setLoading(false);
      }
    },
    [model, router]
  );

  useEffect(() => {
    if (handledPending.current) return;
    try {
      const saved = sessionStorage.getItem("cc-chat");
      if (saved) {
        sessionStorage.removeItem("cc-chat");
        handledPending.current = true;
        const pending = JSON.parse(saved);
        if (pending.model && MODELS.some((m: { id: string }) => m.id === pending.model)) {
          setModel(pending.model);
        }
        if (pending.q) {
          sendMessage(pending.q, []);
        }
      }
    } catch {}
  }, [sendMessage]);

  return (
    <div className="relative flex flex-col h-full bg-page text-text-primary">
      <button
        onClick={() => {
          setMessages([]);
          setError(null);
        }}
        disabled={messages.length === 0}
        className="absolute top-3 right-4 z-10 bg-btn hover:bg-btn-hover disabled:opacity-40 disabled:hover:bg-btn text-btn-text rounded-xl px-5 h-10 text-sm font-medium transition-colors"
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
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <p className="text-text-muted text-lg">
                Send a message to start chatting
              </p>
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
                    : "bg-bubble-ai text-bubble-ai-text"
                }`}
              >
                {msg.role === "assistant" && msg.respondedModel && (
                  <span
                    className={`block text-xs mb-1 ${msg.warning ? "text-warning" : "text-text-muted"}`}
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
              <div className="bg-bubble-ai rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-dots rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-dots rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-dots rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-error-bg border border-error-border rounded-xl px-4 py-3 text-error-text text-sm max-w-lg">
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
        modelLocked={messages.length > 0}
      />
    </div>
  );
}
