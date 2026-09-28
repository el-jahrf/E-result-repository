import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");

    case "PRINCIPAL":
      redirect("/principal");

    case "TEACHER":
      redirect("/teacher");

    case "STUDENT":
      redirect("/student");

    default:
      redirect("/login");
  }
}