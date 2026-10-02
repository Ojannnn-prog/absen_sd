import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TemanMuClient from "./TemanMuClient";

export default async function TemanMuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <TemanMuClient role={session.role} />;
}
