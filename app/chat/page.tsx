"use client";

import { useRef, useEffect } from "react";
import InputToolbar from "../input-toolbar";
import { useChat } from "../lib/use-chat";

export default function NewChat() {
  const chat = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  return (
    <div className="relative flex flex-col h-full bg-page text-text-primary">
      <button
        onClick={() => {
          chat.setMessages([]);
          chat.setError(null);
        }}
        disabled={chat.messages.length === 0}
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
          {chat.messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <p className="text-text-muted text-lg">
                Send a message to start chatting
              </p>
            </div>
          )}

          {chat.messages.map((msg, i) => (
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

          {chat.loading && (
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

          {chat.error && (
            <div className="flex justify-center">
              <div className="bg-error-bg border border-error-border rounded-xl px-4 py-3 text-error-text text-sm max-w-lg">
                {chat.error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <InputToolbar
        input={chat.input}
        setInput={chat.setInput}
        model={chat.model}
        setModel={chat.setModel}
        mode={chat.mode}
        setMode={chat.setMode}
        onSubmit={chat.sendMessage}
        loading={chat.loading}
        modelLocked={chat.modelLocked}
      />
    </div>
  );
}
