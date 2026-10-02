"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { AlertTriangle, Bot, GraduationCap, Loader2, Menu, MessageSquare, Plus, Send, Sparkles, Trash2, UserRound } from "lucide-react";
import toast from "react-hot-toast";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
};

const greeting: Message = {
  role: "assistant",
  content: "Halo! Aku TemanMu 👋 Aku bisa membantu menjelaskan pelajaran, membuat contoh soal, atau menemani kamu memahami cara kerja AI. Mau belajar apa hari ini?",
};

export default function TemanMuClient({ role }: { role: string }) {
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const response = await fetch("/api/temanmu", { cache: "no-store" });
        const data = await response.json() as { conversations?: ConversationSummary[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Histori belum dapat dibuka.");
        if (!active) return;

        const savedConversations = data.conversations || [];
        setConversations(savedConversations);
        if (savedConversations[0]) {
          const detailResponse = await fetch(`/api/temanmu?conversationId=${encodeURIComponent(savedConversations[0].id)}`, { cache: "no-store" });
          const detailData = await detailResponse.json() as { conversation?: { id: string; messages?: Message[] }; error?: string };
          if (!detailResponse.ok) throw new Error(detailData.error || "Chat belum dapat dibuka.");
          if (active && detailData.conversation) {
            setConversationId(detailData.conversation.id);
            setMessages(detailData.conversation.messages?.length ? detailData.conversation.messages : [greeting]);
          }
        } else if (active) {
          const newResponse = await fetch("/api/temanmu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "new" }),
          });
          const newData = await newResponse.json() as { conversation?: ConversationSummary; error?: string };
          if (!newResponse.ok || !newData.conversation) throw new Error(newData.error || "Chat baru belum dapat dibuat.");
          setConversationId(newData.conversation.id);
          setConversations([newData.conversation]);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Histori TemanMu belum dapat dibuka.");
      } finally {
        if (active) setIsLoadingHistory(false);
      }
    };

    void loadHistory();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!conversationToDelete) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setConversationToDelete(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [conversationToDelete]);

  const loadConversation = async (id: string) => {
    if (isSending || id === conversationId) {
      setShowHistory(false);
      return;
    }

    try {
      const response = await fetch(`/api/temanmu?conversationId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json() as { conversation?: { id: string; messages?: Message[] }; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Chat belum dapat dibuka.");
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages?.length ? data.conversation.messages : [greeting]);
      setShowHistory(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat belum dapat dibuka.");
    }
  };

  const createNewChat = async () => {
    if (isSending) return;
    try {
      const response = await fetch("/api/temanmu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const data = await response.json() as { conversation?: ConversationSummary; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Chat baru belum dapat dibuat.");
      setConversationId(data.conversation.id);
      setConversations(previous => [data.conversation!, ...previous]);
      setMessages([greeting]);
      setInput("");
      setShowHistory(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat baru belum dapat dibuat.");
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/temanmu?conversationId=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Histori belum dapat dihapus.");

      const remaining = conversations.filter(conversation => conversation.id !== id);
      setConversations(remaining);
      if (id === conversationId) {
        if (remaining[0]) {
          await loadConversation(remaining[0].id);
        } else {
          await createNewChat();
        }
      }
      toast.success("Histori chat dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Histori belum dapat dihapus.");
    }
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = input.trim();
    if (!content || isSending || !conversationId) return;

    const previousMessages = messages;
    setMessages(previous => [...previous, { role: "user", content }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/temanmu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", conversationId, content }),
      });
      const data = await response.json() as { conversationId?: string; message?: string; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error || "TemanMu belum dapat menjawab.");
      setMessages(previous => [...previous, { role: "assistant", content: data.message! }]);
      setConversations(previous => previous.map(conversation => conversation.id === conversationId ? { ...conversation, title: conversation.title === "Chat baru" ? content.slice(0, 60) : conversation.title, updatedAt: new Date().toISOString() } : conversation));
    } catch (error) {
      setMessages(previousMessages);
      toast.error(error instanceof Error ? error.message : "TemanMu sedang mengalami gangguan.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-6xl flex-col gap-4">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"><Bot className="h-8 w-8" /></div><div><div className="flex items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">TemanMu</h1><Sparkles className="h-5 w-5 text-yellow-200" /></div><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Pendamping belajar berbasis AI untuk membantu menjelaskan materi dengan bahasa yang mudah dipahami.</p></div></div><div className="flex gap-2"><button onClick={() => setShowHistory(value => !value)} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-black backdrop-blur-sm md:hidden"><Menu className="h-4 w-4" /> Histori</button><button onClick={() => void createNewChat()} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-indigo-700"><Plus className="h-4 w-4" /> Chat baru</button></div></div>
        <div className="mt-5 flex items-center gap-2 text-xs font-bold text-indigo-100"><GraduationCap className="h-4 w-4" /> Mode teks · Masuk sebagai {role}</div>
      </section>

      <div className="grid min-h-[32rem] flex-1 gap-4 md:grid-cols-[16rem_1fr]">
        <aside className={`${showHistory ? "block" : "hidden"} rounded-[2rem] border border-gray-100 bg-white p-3 shadow-sm md:block`}><div className="mb-2 flex items-center justify-between px-2"><h2 className="text-sm font-black text-gray-800">Histori chat</h2><button onClick={() => void createNewChat()} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" aria-label="Buat chat baru"><Plus className="h-4 w-4" /></button></div>{isLoadingHistory ? <div className="p-3 text-xs text-gray-400">Memuat histori...</div> : conversations.length === 0 ? <div className="p-3 text-xs leading-5 text-gray-400">Belum ada histori chat.</div> : <div className="space-y-1">{conversations.map(conversation => <div key={conversation.id} className={`group flex items-center gap-1 rounded-xl ${conversation.id === conversationId ? "bg-indigo-50" : "hover:bg-gray-50"}`}><button onClick={() => void loadConversation(conversation.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"><MessageSquare className="h-4 w-4 shrink-0 text-indigo-500" /><span className="truncate text-xs font-bold text-gray-700">{conversation.title}</span></button><button onClick={() => setConversationToDelete(conversation)} className="mr-1 rounded-lg p-2 text-gray-300 opacity-100 hover:bg-rose-50 hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100" aria-label={`Hapus ${conversation.title}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</aside>

        <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm"><div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-7">{messages.map((message, index) => <div key={`${message.id || message.role}-${index}`} className={`flex items-end gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${message.role === "user" ? "order-2 bg-indigo-100 text-indigo-700" : "bg-violet-100 text-violet-700"}`}>{message.role === "user" ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div><div className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${message.role === "user" ? "order-1 rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md bg-gray-100 text-gray-800"}`}>{message.content}</div></div>)}{isSending && <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Bot className="h-4 w-4" /></div><div className="rounded-3xl rounded-bl-md bg-gray-100 px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-violet-600" /></div></div>}</div><form onSubmit={sendMessage} className="border-t border-gray-100 bg-gray-50/80 p-3 sm:p-5"><div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"><textarea value={input} onChange={event => setInput(event.target.value.slice(0, 4000))} onKeyDown={handleKeyDown} rows={2} placeholder="Tulis pertanyaanmu di sini..." className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400" disabled={isSending || isLoadingHistory} /><button type="submit" disabled={!input.trim() || isSending || isLoadingHistory || !conversationId} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400" aria-label="Kirim pesan"><Send className="h-5 w-5" /></button></div><p className="mt-2 px-2 text-[11px] text-gray-400">Tekan Enter untuk mengirim · Shift + Enter untuk baris baru</p></form></section>
      </div>
      </div>
      {conversationToDelete && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setConversationToDelete(null)}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" aria-describedby="delete-chat-description" onMouseDown={event => event.stopPropagation()}><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><AlertTriangle className="h-6 w-6" /></div><div><h2 id="delete-chat-title" className="text-lg font-black text-slate-900">Hapus histori chat?</h2><p id="delete-chat-description" className="mt-1 text-sm leading-6 text-slate-500">Percakapan <span className="font-bold text-slate-700">“{conversationToDelete.title}”</span> akan dihapus dan tidak dapat dipulihkan.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConversationToDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Batal</button><button type="button" onClick={() => { const target = conversationToDelete; setConversationToDelete(null); void deleteConversation(target.id); }} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700">Hapus histori</button></div></div></div>}
    </>
  );
}
