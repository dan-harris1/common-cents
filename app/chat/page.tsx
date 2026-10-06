"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MODELS } from "../models";
import InputToolbar from "../input-toolbar";

interface Message {
  role: "user" | "assistant";
  content: string;
  respondedModel?: string;
  warning?: string;
}

const AUTH_ENABLED = false;

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

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    try {
      const saved = sessionStorage.getItem("cc-auth");
      if (saved === "true") setAuthenticated(true);
    } catch {}
    setAuthLoading(false);
  }, []);

  const handledPending = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = useCallback(async (text: string, currentMessages: Message[]) => {
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
  }, [model]);

  useEffect(() => {
    if (handledPending.current) return;
    try {
      const saved = sessionStorage.getItem("cc-chat");
      if (saved) {
        sessionStorage.removeItem("cc-chat");
        handledPending.current = true;
        const pending = JSON.parse(saved);
        if (pending.model && MODELS.some((m) => m.id === pending.model)) {
          setModel(pending.model);
        }
        if (pending.q) {
          sendMessage(pending.q, []);
        }
      }
    } catch {}
  }, [sendMessage]);

  if (authLoading) {
    return <div className="flex h-full items-center justify-center bg-zinc-900" />;
  }

  if (!authenticated) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-100">
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
            {authError || " "}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      <header className="flex items-center justify-end px-4 py-3 border-b border-zinc-700">
        <button
          onClick={() => { setMessages([]); setError(null); }}
          disabled={messages.length === 0}
          className="bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-zinc-900 rounded-xl px-5 h-10 text-sm font-medium transition-colors"
        >
          New Chat
        </button>
      </header>

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

      <InputToolbar
        input={input}
        setInput={setInput}
        model={model}
        setModel={setModel}
        onSubmit={(text) => sendMessage(text, messages)}
        loading={loading}
      />
    </div>
  );
}
