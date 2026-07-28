import { redirect } from "next/navigation";
import { getTeacherDashboardData } from "./actions";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboardPage() {
  const data = await getTeacherDashboardData();

  if (!data) {
    redirect("/login");
  }

  return (
    <TeacherDashboardClient
      teacher={data.teacher}
      students={data.students}
      stats={data.stats}
      announcements={data.announcements}
    />
  );
}
