import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const terms = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

type IconName =
  | "dashboard"
  | "students"
  | "teachers"
  | "classes"
  | "subjects"
  | "enrollment"
  | "results"
  | "pin"
  | "assignments";

function Icon({
  name,
  active = false,
}: {
  name: IconName;
  active?: boolean;
}) {
  const common = {
    className: `h-5 w-5 shrink-0 ${
      active ? "text-white" : "text-gray-500"
    }`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "students":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "teachers":
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V8l7-5 7 5v13" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
        </svg>
      );

    case "subjects":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );

    case "enrollment":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
      );

    case "results":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M21 10H3" />
          <path d="M7 6h10l1 4H6l1-4Z" />
          <path d="M8 14h8" />
          <path d="M10 18h4" />
          <path d="M12 10v10" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
          <path d="M8 17h3" />
        </svg>
      );
  }
}

const navigation: {
  name: string;
  href: string;
  icon: IconName;
}[] = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  { name: "Students", href: "/admin/students", icon: "students" },
  { name: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { name: "Classes", href: "/admin/classes", icon: "classes" },
  { name: "Subjects", href: "/admin/subjects", icon: "subjects" },
  {
    name: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment",
  },
  { name: "Results", href: "/admin/results", icon: "results" },
  {
    name: "Result PINs",
    href: "/admin/result-pins",
    icon: "pin",
  },
  {
    name: "Assignments",
    href: "/admin/assignments",
    icon: "assignments",
  },
];

async function enrollStudent(formData: FormData) {
  "use server";

  const studentId = String(formData.get("studentId") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const term = String(formData.get("term") ?? "").trim();

  if (!studentId || !classId || !sessionId || !term) {
    redirect("/admin/enrollments/new?error=missing");
  }

  if (!["FIRST", "SECOND", "THIRD"].includes(term)) {
    redirect("/admin/enrollments/new?error=term");
  }

  const [student, classItem, session] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
    }),
    prisma.class.findUnique({
      where: { id: classId },
    }),
    prisma.academicSession.findUnique({
      where: { id: sessionId },
    }),
  ]);

  if (!student || !student.isActive) {
    redirect("/admin/enrollments/new?error=student");
  }

  if (!classItem || !classItem.isActive) {
    redirect("/admin/enrollments/new?error=class");
  }

  if (!session) {
    redirect("/admin/enrollments/new?error=session");
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_sessionId_term: {
        studentId,
        sessionId,
        term: term as "FIRST" | "SECOND" | "THIRD",
      },
    },
  });

  if (existingEnrollment) {
    redirect("/admin/enrollments/new?error=duplicate");
  }

  await prisma.enrollment.create({
    data: {
      studentId,
      classId,
      sessionId,
      term: term as "FIRST" | "SECOND" | "THIRD",
    },
  });

  redirect("/admin/students?enrolled=success");
}

export default async function NewEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const [students, classes, sessions] = await Promise.all([
    prisma.student.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    }),

    prisma.class.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          section: "asc",
        },
        {
          level: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.academicSession.findMany({
      orderBy: {
        startDate: "desc",
      },
    }),
  ]);

  const errorMessages: Record<string, string> = {
    missing: "Please select a student, class, session and term.",
    term: "The selected term is not valid.",
    student:
      "The selected student could not be found or is inactive.",
    class:
      "The selected class could not be found or is inactive.",
    session:
      "The selected academic session could not be found.",
    duplicate:
      "This student is already enrolled in that class session and term.",
  };

  const errorMessage = params.error
    ? errorMessages[params.error]
    : undefined;

  const currentSession =
    sessions.find((session) => session.isCurrent)?.name ??
    "No current session";

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-gray-100 px-6">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-950">
                RISING FOUNDATION
              </h1>
              <p className="text-xs font-medium tracking-wide text-gray-500">
                ACADEMY
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {navigation.map((item) => {
              const active = item.name === "Enrollment";

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  <Icon name={item.icon} active={active} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-[10px] font-bold tracking-wider text-gray-500">
                CURRENT SESSION
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {currentSession}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Enrollment Management
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Student Management
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-950">
                Enrollment
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                AD
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  Admin
                </p>
                <p className="text-xs text-gray-500">
                  Administrator
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8">
                <Link
                  href="/admin/students"
                  className="inline-flex items-center text-sm font-semibold text-gray-500 transition hover:text-gray-900"
                >
                  ← Back to Students
                </Link>

                <p className="mt-6 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Student Management
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                  Enroll Student
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Place a student into a class for an academic
                  session and term.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              {students.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Icon name="students" />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-gray-950">
                    No students available
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Create a student first before enrolling one.
                  </p>

                  <Link
                    href="/admin/students/new"
                    className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    + Add Student
                  </Link>
                </div>
              ) : classes.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Icon name="classes" />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-gray-950">
                    No classes available
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Create a class first before enrolling a
                    student.
                  </p>

                  <Link
                    href="/admin/classes"
                    className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Go to Classes
                  </Link>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Icon name="results" />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-gray-950">
                    No academic session available
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Create an academic session first.
                  </p>

                  <Link
                    href="/admin/sessions"
                    className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Go to Academic Sessions
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-5 sm:px-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                        <Icon
                          name="enrollment"
                          active
                        />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-gray-950">
                          Enrollment Details
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-500">
                          Select the student, class, session and
                          term.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <form
                      action={enrollStudent}
                      className="space-y-6"
                    >
                      <div>
                        <label
                          htmlFor="studentId"
                          className="mb-2 block text-sm font-bold text-gray-800"
                        >
                          Student
                        </label>

                        <select
                          id="studentId"
                          name="studentId"
                          required
                          defaultValue=""
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="" disabled>
                            Select student
                          </option>

                          {students.map((student) => (
                            <option
                              key={student.id}
                              value={student.id}
                            >
                              {student.admissionNo} —{" "}
                              {student.firstName}{" "}
                              {student.middleName
                                ? `${student.middleName} `
                                : ""}
                              {student.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="classId"
                          className="mb-2 block text-sm font-bold text-gray-800"
                        >
                          Class
                        </label>

                        <select
                          id="classId"
                          name="classId"
                          required
                          defaultValue=""
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="" disabled>
                            Select class
                          </option>

                          {classes.map((classItem) => {
                            const classDetails = [
                              classItem.name,
                              classItem.arm,
                              classItem.stream,
                            ]
                              .filter(Boolean)
                              .join(" — ");

                            return (
                              <option
                                key={classItem.id}
                                value={classItem.id}
                              >
                                {classDetails}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="sessionId"
                          className="mb-2 block text-sm font-bold text-gray-800"
                        >
                          Academic Session
                        </label>

                        <select
                          id="sessionId"
                          name="sessionId"
                          required
                          defaultValue=""
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="" disabled>
                            Select academic session
                          </option>

                          {sessions.map((session) => (
                            <option
                              key={session.id}
                              value={session.id}
                            >
                              {session.name}
                              {session.isCurrent
                                ? " — Current"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="term"
                          className="mb-2 block text-sm font-bold text-gray-800"
                        >
                          Term
                        </label>

                        <select
                          id="term"
                          name="term"
                          required
                          defaultValue=""
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="" disabled>
                            Select term
                          </option>

                          {terms.map((term) => (
                            <option
                              key={term.value}
                              value={term.value}
                            >
                              {term.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                        <Link
                          href="/admin/students"
                          className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </Link>

                        <button
                          type="submit"
                          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                        >
                          Enroll Student
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}