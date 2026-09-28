import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteStudentButton from "./DeleteStudentButton";

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

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      enrollments: {
        include: {
          class: true,
          session: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.isActive,
  ).length;
  const inactiveStudents = totalStudents - activeStudents;

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
                const active = item.href === "/admin/students";

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
            <div className="flex min-h-[76px] items-center justify-between px-6 py-4 lg:px-8">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">
                  Administration
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  Students
                </h1>
              </div>

              <Link
                href="/admin/students/new"
                className="school-button rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm"
              >
                + Add Student
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-primary">
                Student Management
              </h2>
              <p className="mt-1 text-sm text-muted">
                Manage student records and enrollment information.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["Total Students", totalStudents],
                ["Active Students", activeStudents],
                ["Inactive Students", inactiveStudents],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-school bg-surface p-6 shadow-sm"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-primary">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-school bg-surface shadow-sm">
              <div className="border-b border-school px-6 py-5">
                <h3 className="text-base font-bold text-primary">
                  Student Directory
                </h3>
                <p className="mt-1 text-sm text-muted">
                  View and manage registered students.
                </p>
              </div>

              {students.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-muted">
                    No students have been added yet.
                  </p>

                  <Link
                    href="/admin/students/new"
                    className="school-button mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    Add First Student
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-school">
                      <tr className="border-b border-school">
                        {[
                          "Admission No.",
                          "Student",
                          "Gender",
                          "Class",
                          "Status",
                          "Action",
                        ].map((heading, index) => (
                          <th
                            key={heading}
                            className={`px-6 py-3 text-xs font-bold uppercase tracking-[0.08em] text-muted ${
                              index === 5 ? "text-right" : "text-left"
                            }`}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="bg-surface">
                      {students.map((student) => {
                        const enrollment = student.enrollments[0];

                        const studentName = [
                          student.firstName,
                          student.middleName,
                          student.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <tr
                            key={student.id}
                            className="border-b border-school transition hover:bg-school"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-primary">
                              {student.admissionNo}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-school text-xs font-semibold text-muted">
                                  {student.photoData ? (
                                    <img
                                      src={student.photoData}
                                      alt={studentName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    `${student.firstName
                                      .charAt(0)
                                      .toUpperCase()}${student.lastName
                                      .charAt(0)
                                      .toUpperCase()}`
                                  )}
                                </div>

                                <p className="text-sm font-semibold text-primary">
                                  {studentName}
                                </p>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                              {student.gender === "MALE" ? "Male" : "Female"}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                              {enrollment ? (
                                <>
                                  {enrollment.class.name}
                                  {enrollment.class.arm
                                    ? ` ${enrollment.class.arm}`
                                    : ""}
                                </>
                              ) : (
                                <span className="text-muted">
                                  Not enrolled
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              {student.isActive ? (
                                <span className="inline-flex rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-school px-2.5 py-1 text-xs font-semibold text-muted">
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  href={`/admin/students/${student.id}`}
                                  className="text-sm font-semibold text-secondary hover:text-primary"
                                >
                                  View
                                </Link>

                                <Link
                                  href={`/admin/students/${student.id}/edit`}
                                  className="text-sm font-semibold text-secondary hover:text-primary"
                                >
                                  Edit
                                </Link>

                                {!enrollment && (
                                  <Link
                                    href="/admin/enrollments/new"
                                    className="text-sm font-semibold text-secondary hover:text-primary"
                                  >
                                    Enroll
                                  </Link>
                                )}

                                <DeleteStudentButton
                                  studentId={student.id}
                                  studentName={studentName}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}