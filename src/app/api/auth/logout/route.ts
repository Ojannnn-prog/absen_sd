import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: "session", value: "", ...sessionCookieOptions, maxAge: 0 });
  return res;
}
