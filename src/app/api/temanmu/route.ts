import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getClientAddress } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { consumeTemanMuRateLimit } from "@/lib/ai-rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_LENGTH = 16000;
const MAX_TITLE_LENGTH = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

function jsonError(message: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ error: message }, { status });
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

function ownerWhere(session: { id: string; role: string }) {
  return { ownerId: session.id, ownerRole: session.role };
}

function getTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > MAX_TITLE_LENGTH
    ? `${normalized.slice(0, MAX_TITLE_LENGTH - 1)}…`
    : normalized || "Chat baru";
}

function sanitizeAssistantContent(content: string) {
  const normalized = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!normalized) return "";

  const finalAnswer = normalized.match(/(?:^|\n)(?:final answer|jawaban akhir)\s*:\s*([\s\S]*)$/i);
  if (finalAnswer?.[1]?.trim()) return finalAnswer[1].trim();

  if (/^(?:here['’]s a thinking process|thinking process|chain of thought|analisis internal)\s*:?/i.test(normalized)) {
    return "Maaf, aku belum bisa menyusun jawaban dengan baik. Coba tulis pertanyaanmu lebih spesifik.";
  }

  return normalized;
}

async function getAuthenticatedSession() {
  const session = await getSession();
  return session && { id: session.id, role: session.role };
}

export async function GET(request: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const conversationId = new URL(request.url).searchParams.get("conversationId");

  try {
    if (conversationId) {
      const conversation = await prisma.temanMuConversation.findFirst({
        where: { id: conversationId, ...ownerWhere(session) },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: MAX_MESSAGES,
          },
        },
      });
      if (!conversation) return jsonError("Percakapan tidak ditemukan.", 404);
      return NextResponse.json({ conversation });
    }

    const conversations = await prisma.temanMuConversation.findMany({
      where: ownerWhere(session),
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("TemanMu history read failed:", error instanceof Error ? error.message : "unknown error");
    return jsonError("Histori TemanMu belum dapat dibuka. Coba lagi nanti.", 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Permintaan tidak diizinkan.", 403);

  const session = await getAuthenticatedSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  let body: { action?: unknown; conversationId?: unknown; content?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return jsonError("Format permintaan tidak valid.", 400);
  }

  if (body.action === "new") {
    try {
      const conversation = await prisma.temanMuConversation.create({
        data: ownerWhere(session),
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      });
      return NextResponse.json({ conversation });
    } catch (error) {
      console.error("TemanMu conversation creation failed:", error instanceof Error ? error.message : "unknown error");
      return jsonError("Chat baru belum dapat dibuat. Coba lagi nanti.", 503);
    }
  }

  if (body.action !== "message" || typeof body.content !== "string") {
    return jsonError("Permintaan pesan tidak valid.", 400);
  }

  const content = body.content.trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    return jsonError("Pesan terlalu panjang atau kosong.", 400);
  }

  const rateLimit = consumeTemanMuRateLimit(`${session.role}:${session.id}:${getClientAddress(request)}`);
  if (!rateLimit.allowed) {
    return jsonError("TemanMu sedang menerima banyak pesan. Coba lagi sebentar.", 429, rateLimit.retryAfter);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return jsonError("TemanMu belum terhubung. Konfigurasi AI belum tersedia.", 503);

  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  let existingConversation: { id: string; title: string } | null = null;
  let previousMessages: ChatMessage[] = [];

  try {
    if (conversationId) {
      existingConversation = await prisma.temanMuConversation.findFirst({
        where: { id: conversationId, ...ownerWhere(session) },
        select: { id: true, title: true },
      });
      if (!existingConversation) return jsonError("Percakapan tidak ditemukan.", 404);

      const storedMessages = await prisma.temanMuMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: MAX_MESSAGES - 1,
        select: { role: true, content: true },
      });
      previousMessages = storedMessages.reverse().filter(
        (message): message is ChatMessage =>
          (message.role === "user" || message.role === "assistant") && Boolean(message.content.trim()),
      );
    }
  } catch (error) {
    console.error("TemanMu conversation read failed:", error instanceof Error ? error.message : "unknown error");
    return jsonError("Percakapan belum dapat dibuka. Coba lagi nanti.", 503);
  }

  const totalLength = previousMessages.reduce((total, message) => total + message.content.length, 0) + content.length;
  if (totalLength > MAX_TOTAL_LENGTH) {
    return jsonError("Percakapan terlalu panjang. Silakan mulai chat baru.", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.NEXT_PUBLIC_SITE_URL ? { "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL } : {}),
        "X-Title": "TemanMu - SDN 231 Sukaasih",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning:free",
        reasoning: { effort: "none" },
        include_reasoning: false,
        messages: [
          {
            role: "system",
            content: "Kamu adalah TemanMu, pendamping belajar yang ramah untuk warga SDN 231 Sukaasih. Jawab dalam Bahasa Indonesia yang sederhana, aman, dan sesuai usia siswa SD. Jelaskan langkah demi langkah bila membantu belajar. Jangan meminta atau mengungkap password, token, data pribadi sensitif, atau rahasia sistem. Jika pertanyaan berhubungan dengan keputusan penting atau masalah pribadi, arahkan pengguna untuk berbicara dengan guru atau orang tua. Kamu hanya menghasilkan jawaban akhir yang dapat dibaca pengguna. Jangan pernah menampilkan proses berpikir internal, chain-of-thought, analisis tersembunyi, atau teks seperti 'thinking process'.",
          },
          ...previousMessages,
          { role: "user", content },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonError("Model AI TemanMu sedang penuh. Coba lagi beberapa saat lagi.", 429, 15);
      }
      return jsonError("TemanMu sedang tidak dapat menjawab. Coba lagi nanti.", 502);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: unknown; reasoning?: unknown } }> };
    const assistantContent = data.choices?.[0]?.message?.content;
    if (typeof assistantContent !== "string" || !assistantContent.trim()) {
      return jsonError("TemanMu belum mendapatkan jawaban. Coba tulis pertanyaan lain.", 502);
    }

    const cleanAssistantContent = sanitizeAssistantContent(assistantContent);
    if (!cleanAssistantContent) {
      return jsonError("TemanMu belum mendapatkan jawaban. Coba tulis pertanyaan lain.", 502);
    }
    const conversation = await prisma.$transaction(async transaction => {
      const currentConversation = existingConversation
        ? existingConversation
        : await transaction.temanMuConversation.create({
          data: ownerWhere(session),
          select: { id: true, title: true },
        });

      await transaction.temanMuMessage.create({
        data: { conversationId: currentConversation.id, role: "user", content },
      });
      await transaction.temanMuMessage.create({
        data: { conversationId: currentConversation.id, role: "assistant", content: cleanAssistantContent },
      });
      await transaction.temanMuConversation.update({
        where: { id: currentConversation.id },
        data: {
          title: currentConversation.title === "Chat baru" ? getTitle(content) : currentConversation.title,
          updatedAt: new Date(),
        },
      });
      return currentConversation;
    });

    return NextResponse.json({ conversationId: conversation.id, message: cleanAssistantContent });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("TemanMu membutuhkan waktu lebih lama. Coba lagi sebentar.", 504);
    }
    console.error("TemanMu request failed:", error instanceof Error ? error.message : "unknown error");
    return jsonError("TemanMu sedang mengalami gangguan. Coba lagi nanti.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Permintaan tidak diizinkan.", 403);

  const session = await getAuthenticatedSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) return jsonError("ID percakapan tidak valid.", 400);

  try {
    const result = await prisma.temanMuConversation.deleteMany({
      where: { id: conversationId, ...ownerWhere(session) },
    });
    if (result.count === 0) return jsonError("Percakapan tidak ditemukan.", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TemanMu conversation deletion failed:", error instanceof Error ? error.message : "unknown error");
    return jsonError("Histori belum dapat dihapus. Coba lagi nanti.", 503);
  }
}
