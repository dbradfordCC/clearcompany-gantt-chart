import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import GanttHome from "@/components/gantt-home";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <GanttHome />;
}
