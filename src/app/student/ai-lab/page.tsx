import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AiLabClient from "./AiLabClient";

export default async function StudentAiLabPage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  return <AiLabClient studentName={session.username} />;
}
