"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";

export interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  mode?: string;
  respondedModel?: string;
  warning?: string;
}

export function useChat(chatId?: string) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState<"book" | "open">("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatLoaded, setChatLoaded] = useState(!chatId);

  const messagesRef = useRef(messages);
  const modelRef = useRef(model);
  const modeRef = useRef(mode);
  const handledPending = useRef(false);
  messagesRef.current = messages;
  modelRef.current = model;
  modeRef.current = mode;

  useEffect(() => {
    if (!chatId) return;
    async function loadChat() {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
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
            mode: m.mode,
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
  }, [chatId, router]);

  const sendMessage = useCallback(async (text: string) => {
    const currentMessages = messagesRef.current;
    const currentModel = modelRef.current;
    const currentMode = modeRef.current;

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
          model: currentModel,
          mode: currentMode,
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

      if (chatId) {
        setMessages(allMessages);
        const newMsgs = [
          { role: "user" as const, content: text, model: currentModel, mode: currentMode },
          {
            role: "assistant" as const,
            content: data.response,
            model: currentModel,
            mode: currentMode,
            respondedModel: data.respondedModel,
            warning: data.warning,
          },
        ];
        await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMsgs }),
        });
        window.dispatchEvent(new Event("chats-updated"));
      } else {
        const chatMessages = allMessages.map((m) => ({
          role: m.role,
          content: m.content,
          model: currentModel,
          mode: currentMode,
          respondedModel: m.respondedModel,
          warning: m.warning,
        }));
        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: currentModel, messages: chatMessages }),
        });
        if (createRes.ok) {
          const chat = await createRes.json();
          window.dispatchEvent(new Event("chats-updated"));
          router.push(`/chat/${chat.id}`);
        } else {
          setMessages(allMessages);
        }
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, [chatId, router]);

  useEffect(() => {
    if (chatId || handledPending.current) return;
    try {
      const saved = sessionStorage.getItem("cc-chat");
      if (saved) {
        sessionStorage.removeItem("cc-chat");
        handledPending.current = true;
        const pending = JSON.parse(saved);
        if (pending.model && MODELS.some((m: { id: string }) => m.id === pending.model)) {
          setModel(pending.model);
          modelRef.current = pending.model;
        }
        if (pending.mode === "book" || pending.mode === "open") {
          setMode(pending.mode);
          modeRef.current = pending.mode;
        }
        if (pending.q) {
          sendMessage(pending.q);
        }
      }
    } catch {}
  }, [chatId, sendMessage]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    model,
    setModel,
    mode,
    setMode,
    loading,
    error,
    setError,
    chatLoaded,
    modelLocked: chatId ? chatLoaded : messages.length > 0,
    sendMessage,
  };
}
