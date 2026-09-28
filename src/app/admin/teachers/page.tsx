import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeacherPasswordReset from "./TeacherPasswordReset";
import TeacherSignatureUpload from "./TeacherSignatureUpload";

async function deleteTeacher(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const teacherId = String(formData.get("teacherId") ?? "").trim();

  if (!teacherId) {
    redirect("/admin/teachers?error=Teacher+ID+is+required");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
      staffNo: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!teacher) {
    redirect("/admin/teachers?error=Teacher+not+found");
  }

  if (teacher.userId === session.user.id) {
    redirect(
      "/admin/teachers?error=You+cannot+delete+the+currently+logged-in+administrator",
    );
  }

  const teacherName =
    `${teacher.firstName} ${teacher.lastName}`.trim();

  const [
    assignmentCount,
    classMasterAssignmentCount,
    resultCount,
  ] = await Promise.all([
    prisma.teacherAssignment.count({
      where: { teacherId: teacher.id },
    }),
    prisma.classMasterAssignment.count({
      where: { teacherId: teacher.id },
    }),
    prisma.result.count({
      where: { enteredById: teacher.id },
    }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.result.updateMany({
      where: { enteredById: teacher.id },
      data: { enteredById: null },
    });

    await tx.teacherAssignment.deleteMany({
      where: { teacherId: teacher.id },
    });

    await tx.classMasterAssignment.deleteMany({
      where: { teacherId: teacher.id },
    });

    await tx.teacher.delete({
      where: { id: teacher.id },
    });

    await tx.user.delete({
      where: { id: teacher.userId },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE_TEACHER",
      entity: "Teacher",
      entityId: teacher.id,
      details: {
        teacherId: teacher.id,
        staffNo: teacher.staffNo,
        teacherName,
        email: teacher.user.email,
        removedSubjectAssignments: assignmentCount,
        removedClassMasterAssignments:
          classMasterAssignmentCount,
        preservedResults: resultCount,
      },
    },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/assignments");
  revalidatePath("/teacher");

  redirect(
    `/admin/teachers?success=${encodeURIComponent(
      `${teacherName} has been deleted successfully.`,
    )}`,
  );
}

function Icon({
  name,
}: {
  name:
    | "dashboard"
    | "students"
    | "teachers"
    | "classes"
    | "subjects"
    | "enrollment"
    | "results"
    | "pin"
    | "assignments";
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "students") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "teachers") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 6h8" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    );
  }

  if (name === "classes") {
    return (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-5h6v5" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  if (name === "subjects") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 6h8" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    );
  }

  if (name === "enrollment") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    );
  }

  if (name === "results") {
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...common}>
        <path d="M12 17v5" />
        <path d="M5 3h14" />
        <path d="M7 3v6l-2 4h14l-2-4V3" />
        <path d="M8 13h8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" as const },
  { label: "Students", href: "/admin/students", icon: "students" as const },
  { label: "Teachers", href: "/admin/teachers", icon: "teachers" as const },
  { label: "Classes", href: "/admin/classes", icon: "classes" as const },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects" as const },
  {
    label: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment" as const,
  },
  { label: "Results", href: "/admin/results", icon: "results" as const },
  { label: "Result PINs", href: "/admin/result-pins", icon: "pin" as const },
  {
    label: "Assignments",
    href: "/admin/assignments",
    icon: "assignments" as const,
  },
];

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;

  const teachers = await prisma.teacher.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
        },
      },
      assignments: {
        include: {
          class: true,
          subject: true,
        },
      },
      classMasterAssignments: {
        include: {
          class: true,
          session: true,
        },
      },
    },
  });

  const activeTeachers = teachers.filter(
    (teacher) => teacher.isActive && teacher.user.isActive,
  );

  return (
    <main className="min-h-screen bg-school text-school">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-school bg-surface lg:flex lg:flex-col">
          <div className="flex h-[76px] items-center border-b border-school px-6">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-primary">
                RISING FOUNDATION
              </p>
              <p className="mt-0.5 text-[11px] font-medium tracking-[0.18em] text-muted">
                ACADEMY
              </p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Main Menu
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const active = item.href === "/admin/teachers";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-secondary hover:bg-school hover:text-primary"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-secondary group-hover:text-primary"
                      }`}
                    >
                      <Icon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-school p-4">
            <div className="flex items-center gap-3 rounded-lg bg-school px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  Administrator
                </p>
                <p className="text-xs text-muted">System Admin</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-school bg-surface">
            <div className="flex min-h-[76px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">
                  Administration
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  Teachers
                </h1>

                <p className="mt-1 text-sm text-muted">
                  Manage teacher accounts and subject assignments.
                </p>
              </div>

              <Link
                href="/admin/teachers/new"
                className="school-button shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm"
              >
                + Add Teacher
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            {params.success && (
              <div className="mb-6 rounded-xl border border-success bg-school px-4 py-3 text-sm font-medium text-success">
                {params.success}
              </div>
            )}

            {params.error && (
              <div className="mb-6 rounded-xl border border-danger bg-school px-4 py-3 text-sm font-medium text-danger">
                {params.error}
              </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-school bg-surface p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Total Teachers
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-primary">
                  {teachers.length}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Registered teacher accounts
                </p>
              </div>

              <div className="rounded-2xl border border-school bg-surface p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Active Teachers
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-primary">
                  {activeTeachers.length}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Currently active accounts
                </p>
              </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-school bg-surface shadow-sm">
              <div className="border-b border-school px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-school text-secondary">
                    <Icon name="teachers" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-primary">
                      Teacher Accounts
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      View teachers and their current class/subject
                      assignments.
                    </p>
                  </div>
                </div>
              </div>

              {teachers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-school text-secondary">
                    <Icon name="teachers" />
                  </div>

                  <h3 className="font-semibold text-primary">
                    No teachers yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                    Add your first teacher account to start assigning classes
                    and subjects.
                  </p>

                  <Link
                    href="/admin/teachers/new"
                    className="school-button mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold"
                  >
                    Add Teacher
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-school">
                      <tr className="border-b border-school">
                        {[
                          "Teacher",
                          "Staff No.",
                          "Email",
                          "Assignments",
                          "Signature",
                          "Password",
                          "Status",
                          "Action",
                        ].map((heading, index) => (
                          <th
                            key={heading}
                            className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${
                              index === 7 ? "text-right" : "text-left"
                            }`}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {teachers.map((teacher) => {
                        const isActive =
                          teacher.isActive && teacher.user.isActive;

                        const totalAssignments =
                          teacher.assignments.length +
                          teacher.classMasterAssignments.length;

                        return (
                          <tr
                            key={teacher.id}
                            className="border-b border-school transition hover:bg-school"
                          >
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="font-semibold text-primary">
                                {teacher.firstName} {teacher.lastName}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                              {teacher.staffNo}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                              {teacher.user.email}
                            </td>

                            <td className="px-6 py-4 text-sm text-secondary">
                              {totalAssignments === 0 ? (
                                <span className="text-muted">
                                  No assignments
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  {teacher.classMasterAssignments
                                    .slice(0, 2)
                                    .map((assignment) => (
                                      <div
                                        key={assignment.id}
                                        className="text-secondary"
                                      >
                                        {assignment.class.name} —{" "}
                                        {assignment.class.section ===
                                        "NURSERY"
                                          ? "Class Teacher"
                                          : "Form Master"}
                                      </div>
                                    ))}

                                  {teacher.assignments
                                    .slice(0, 2)
                                    .map((assignment) => (
                                      <div
                                        key={assignment.id}
                                        className="text-secondary"
                                      >
                                        {assignment.subject.name} —{" "}
                                        {assignment.class.name}
                                      </div>
                                    ))}

                                  {totalAssignments > 4 && (
                                    <div className="text-xs text-muted">
                                      +{totalAssignments - 4} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <TeacherSignatureUpload
                                teacherId={teacher.id}
                                teacherName={`${teacher.firstName} ${teacher.lastName}`}
                                signatureData={teacher.signatureData}
                              />
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              {isActive ? (
                                <TeacherPasswordReset
                                  teacherId={teacher.id}
                                  teacherName={`${teacher.firstName} ${teacher.lastName}`}
                                  teacherEmail={teacher.user.email}
                                />
                              ) : (
                                <span className="text-xs text-muted">
                                  Account inactive
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-success text-white"
                                    : "bg-school text-muted"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <form action={deleteTeacher}>
                                <input
                                  type="hidden"
                                  name="teacherId"
                                  value={teacher.id}
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger transition hover:bg-school"
                                >
                                  Delete
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}