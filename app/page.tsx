"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  respondedModel?: string;
  warning?: string;
}

const INPUT_BASE_HEIGHT = 48;
const AUTH_ENABLED = false;

const MODELS = [
  { id: "moonshotai/Kimi-K3", name: "Kimi K3" },
  { id: "Qwen/Qwen3.8-2.4T-A95B", name: "Qwen 3.8 2.4T" },
  { id: "zai-org/GLM-5.3", name: "GLM-5.3" },
  { id: "zai-org/GLM-5.3-Flash", name: "GLM-5.3 Flash" },
  { id: "deepseek-ai/DeepSeek-V4.1-Flash", name: "DeepSeek V4.1 Flash" },
];

export default function Home() {
  const [authenticated, setAuthenticated] = useState(!AUTH_ENABLED);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(AUTH_ENABLED);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    try {
      const saved = sessionStorage.getItem("cc-auth");
      if (saved === "true") setAuthenticated(true);
    } catch {}
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading && authenticated) {
      inputRef.current?.focus();
    }
  }, [loading, authenticated]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAuthenticated(true);
        try {
          sessionStorage.setItem("cc-auth", "true");
        } catch {}
      } else {
        setAuthError("Incorrect password");
      }
    } catch {
      setAuthError("Failed to connect");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = `${INPUT_BASE_HEIGHT}px`;
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          model,
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: data.response,
            respondedModel: data.respondedModel,
            warning: data.warning,
          },
        ]);
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900" />;
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-zinc-100">
        <form onSubmit={handleAuth} className="flex flex-col items-center gap-4 w-80">
          <h1 className="text-2xl font-semibold">Common Cents</h1>
          <p className="text-zinc-400 text-sm">Enter password to continue</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 h-12 text-zinc-100 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={!password}
            className="w-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-900 rounded-xl h-12 font-medium transition-colors"
          >
            Enter
          </button>
          <p className={`text-red-400 text-sm h-5 ${authError ? "visible" : "invisible"}`}>
            {authError || " "}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h1 className="text-lg font-semibold">Common Cents</h1>
        <button
          onClick={() => { setMessages([]); setError(null); }}
          disabled={messages.length === 0}
          className="bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-900 rounded-xl px-5 h-10 text-sm font-medium transition-colors"
        >
          New Chat
        </button>
      </header>

      {/* Messages */}
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
              <p className="text-zinc-500 text-lg">
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
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {msg.role === "assistant" && msg.respondedModel && (
                  <span className={`block text-xs mb-1 ${msg.warning ? "text-yellow-400" : "text-zinc-500"}`}>
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

      {/* Input */}
      <footer className="border-t border-zinc-700 px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex gap-3 items-end"
        >
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-zinc-800 border border-zinc-600 rounded-xl px-3 h-12 text-sm text-zinc-200 focus:outline-none focus:border-zinc-400"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = INPUT_BASE_HEIGHT + "px";
              el.style.height = Math.min(el.scrollHeight, 240) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={loading}
            style={{ height: INPUT_BASE_HEIGHT }}
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-zinc-100 resize-none focus:outline-none focus:border-zinc-400 disabled:opacity-50 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-900 rounded-xl px-5 h-12 font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
