import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeacherSetupForm from "./TeacherSetupForm";

export default async function TeacherSetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const teacherId = session.user.teacherId;

  if (!teacherId) {
    redirect("/login");
  }

  const teacher = await prisma.teacher.findUnique({
    where: {
      id: teacherId,
    },
    include: {
      user: {
        select: {
          email: true,
          profileCompleted: true,
        },
      },
    },
  });

  if (!teacher || !teacher.isActive) {
    redirect("/login");
  }

  if (teacher.user.profileCompleted) {
    redirect("/teacher");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Rising Foundation Academy
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Complete Your Teacher Account
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Welcome to the teacher portal. Before accessing your dashboard,
            you need to create your personal password and provide your
            signature.
          </p>
        </div>

        <TeacherSetupForm
          teacher={{
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            staffNo: teacher.staffNo,
            email: teacher.user.email,
          }}
        />
      </div>
    </main>
  );
}