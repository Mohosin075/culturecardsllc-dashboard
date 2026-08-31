"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, MessageSquare, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { SellerVerificationRequest } from "@/app/store/slices/sellerVerificationSlice";
import { api } from "@/app/lib/api";
import { useAlert } from "@/app/context/AlertContext";

interface VerificationChatModalProps {
  request: SellerVerificationRequest | null;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isMe: boolean;
}

const PRESET_MESSAGES = [
  "Please provide a higher resolution scan of your ID Card.",
  "Your business license appears expired. Please submit a renewed certificate.",
  "Could you please clarify your primary product category?",
  "All documents have been verified. Your application is being approved.",
];

export default function VerificationChatModal({ request, onClose }: VerificationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize or fetch chat room for the verification applicant
  useEffect(() => {
    if (!request) return;

    let isMounted = true;

    const initChat = async () => {
      try {
        setLoading(true);
        // Attempt to create / fetch room with applicant ID
        let roomRes: any = null;
        try {
          roomRes = await api.chat.createRoom(request.id);
        } catch {
          // Room might already exist or running in mock mode
        }

        const roomChatId = roomRes?._id || roomRes?.id || roomRes?.data?._id || roomRes?.data?.id || `verification_chat_${request.id}`;
        if (isMounted) setChatId(roomChatId);

        // Fetch messages for this chat room
        try {
          const res = await api.messages.getByChatId(roomChatId);
          const rawMsgs = Array.isArray(res) ? res : res?.messages || res?.data || [];
          
          if (isMounted) {
            if (rawMsgs.length > 0) {
              setMessages(
                rawMsgs.map((m: any) => ({
                  id: m._id || m.id || Math.random().toString(),
                  senderId: m.senderId || m.sender?._id || m.sender || "",
                  senderName: m.senderName || m.sender?.name || (m.senderId === request.id ? request.name : "Moderator (You)"),
                  text: m.text || m.message || "",
                  time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
                  isMe: m.senderId !== request.id,
                }))
              );
            } else {
              // Initial greeting for empty chat
              setMessages([
                {
                  id: "system_init",
                  senderId: "system",
                  senderName: "System",
                  text: `Verification inquiry channel opened with ${request.name}. You can discuss document clarity or ask for supplementary files here.`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  isMe: false,
                },
              ]);
            }
          }
        } catch {
          if (isMounted) {
            // Fallback for offline / demo mode
            setMessages([
              {
                id: "system_init",
                senderId: "system",
                senderName: "System",
                text: `Verification inquiry channel opened with ${request.name}. You can discuss document clarity or ask for supplementary files here.`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isMe: false,
              },
            ]);
          }
        }
      } catch (err: any) {
        console.error("Failed to initialize chat:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    // Polling for new messages every 6 seconds
    const interval = setInterval(async () => {
      if (!chatId) return;
      try {
        const res = await api.messages.getByChatId(chatId);
        const rawMsgs = Array.isArray(res) ? res : res?.messages || res?.data || [];
        if (rawMsgs.length > 0 && isMounted) {
          setMessages(
            rawMsgs.map((m: any) => ({
              id: m._id || m.id || Math.random().toString(),
              senderId: m.senderId || m.sender?._id || m.sender || "",
              senderName: m.senderName || m.sender?.name || (m.senderId === request.id ? request.name : "Moderator (You)"),
              text: m.text || m.message || "",
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
              isMe: m.senderId !== request.id,
            }))
          );
        }
      } catch {
        // Silently ignore polling network failures
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [request, chatId]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !request) return;

    setInputText("");
    const tempId = `temp_${Date.now()}`;
    const newMsgObj: ChatMessage = {
      id: tempId,
      senderId: "me",
      senderName: "Moderator (You)",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    // Instant optimistic render
    setMessages((prev) => [...prev, newMsgObj]);

    try {
      setSending(true);
      const activeId = chatId || `verification_chat_${request.id}`;
      await api.messages.send(activeId, text);
    } catch (err: any) {
      console.warn("Message sent locally (API fallback):", err?.message);
    } finally {
      setSending(false);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-[#155DFC]/10 border border-[#155DFC]/20 flex items-center justify-center text-[#155DFC] font-bold text-sm">
                {request.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111111]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{request.name}</h3>
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-yellow-500/20">
                  {request.status}
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                {request.email} • Category: <span className="text-blue-400 font-medium">{request.category}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Quick Chips */}
        <div className="p-3 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1 shrink-0 px-1">
            <Sparkles size={12} className="text-[#155DFC]" />
            Quick:
          </span>
          {PRESET_MESSAGES.map((msg, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(msg)}
              className="text-[11px] bg-zinc-900/80 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-300 hover:text-white px-3 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {msg.length > 32 ? msg.slice(0, 32) + "..." : msg}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-zinc-500">
              <Loader2 className="animate-spin text-[#155DFC]" size={28} />
              <span className="text-xs">Connecting to applicant channel...</span>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.senderId === "system") {
                return (
                  <div key={msg.id} className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl text-center text-xs text-zinc-400 space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                      <ShieldCheck size={14} />
                      Verification Channel
                    </div>
                    <p className="text-zinc-400">{msg.text}</p>
                    <span className="text-[9px] text-zinc-600 font-mono block">{msg.time}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className={`text-[10px] font-bold ${msg.isMe ? "text-blue-400" : "text-zinc-400"}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">{msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                      msg.isMe
                        ? "bg-[#155DFC] text-white rounded-br-none shadow-lg shadow-[#155DFC]/20"
                        : "bg-[#181a20] border border-white/10 text-zinc-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-black/40 border-t border-white/5 flex gap-3 items-center shrink-0"
        >
          <input
            type="text"
            placeholder={`Message ${request.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-4 py-2.5 bg-[#155DFC] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-[#155DFC]/20 cursor-pointer"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
