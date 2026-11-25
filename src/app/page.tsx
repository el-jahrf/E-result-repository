import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "./LandingPage";

export default async function Home() {
  const session = await auth();

  // Visitors see the public landing page.
  if (!session?.user) {
    return <LandingPage />;
  }

  // Existing authenticated users retain their dashboard redirects.
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