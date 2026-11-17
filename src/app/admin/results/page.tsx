import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ResultStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

type StudentResultGroup = {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  admissionNo: string;
  className: string;
  arm: string | null;
  stream: string | null;
  term: string;
  subjectCount: number;
  teachers: string[];
  statuses: ResultStatus[];
};

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
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
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
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.6-3.4 2.4-5 5.5-5s4.9 1.6 5.5 5" />
          <path d="M15 5.5a3 3 0 0 1 0 5.8" />
          <path d="M17 15c2.2.4 3.5 2 4 5" />
        </svg>
      );

    case "teachers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.6-3.4 2.4-5 5.5-5s4.9 1.6 5.5 5" />
          <path d="M14 5h6" />
          <path d="M17 2v6" />
        </svg>
      );

    case "classes":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5l7-3 7 3v16" />
          <path d="M9 8h1" />
          <path d="M14 8h1" />
          <path d="M9 12h1" />
          <path d="M14 12h1" />
          <path d="M9 16h1" />
          <path d="M14 16h1" />
        </svg>
      );

    case "subjects":
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
          <path d="M4 4.5v17" />
          <path d="M8 6h8" />
          <path d="M8 10h8" />
        </svg>
      );

    case "enrollment":
      return (
        <svg {...common}>
          <path d="M4 5h16v14H4z" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M7 11h4" />
          <path d="M7 15h6" />
          <path d="M16 11h1" />
          <path d="M16 15h1" />
        </svg>
      );

    case "results":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
          <path d="M10.5 10.5 20 20" />
          <path d="m14 14 2-2" />
          <path d="m17 17 2-2" />
          <path d="M6 11 3 14l7 7 3-3" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common}>
          <path d="M5 3h14v18H5z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
          <path d="m8 19 1.5-1.5L11 19l3-3" />
        </svg>
      );

    default:
      return null;
  }
}

const navigation: {
  label: string;
  href: string;
  icon: IconName;
}[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Students", href: "/admin/students", icon: "students" },
  { label: "Teachers", href: "/admin/teachers", icon: "teachers" },
  { label: "Classes", href: "/admin/classes", icon: "classes" },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects" },
  {
    label: "Enrollment",
    href: "/admin/enrollments/new",
    icon: "enrollment",
  },
  { label: "Results", href: "/admin/results", icon: "results" },
  {
    label: "Result PINs",
    href: "/admin/result-pins",
    icon: "pin",
  },
  {
    label: "Assignments",
    href: "/admin/assignments",
    icon: "assignments",
  },
];

function getOverallStatus(
  statuses: ResultStatus[],
): ResultStatus | "IN_REVIEW" {
  if (statuses.length === 0) {
    return "IN_REVIEW";
  }

  if (statuses.every((status) => status === "PUBLISHED")) {
    return "PUBLISHED";
  }

  if (statuses.every((status) => status === "APPROVED")) {
    return "APPROVED";
  }

  if (statuses.every((status) => status === "SUBMITTED")) {
    return "SUBMITTED";
  }

  if (statuses.every((status) => status === "REJECTED")) {
    return "REJECTED";
  }

  return "IN_REVIEW";
}

function termLabel(term: string) {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  return "Third Term";
}

function statusLabel(
  status: ResultStatus | "IN_REVIEW",
) {
  if (status === "SUBMITTED") return "SUBMITTED";
  if (status === "APPROVED") return "APPROVED";
  if (status === "PUBLISHED") return "PUBLISHED";
  if (status === "REJECTED") return "REJECTED";
  return "IN REVIEW";
}

function statusClasses(
  status: ResultStatus | "IN_REVIEW",
) {
  if (status === "SUBMITTED") {
    return "bg-yellow-100 text-yellow-800";
  }

  if (status === "APPROVED") {
    return "bg-green-100 text-green-800";
  }

  if (status === "PUBLISHED") {
    return "bg-[#EFE3D0] text-[#4A2C20]";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-800";
  }

  return "bg-[#EFE3D0] text-[#4A2C20]";
}

type AdminResultsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function AdminResultsPage({
  searchParams,
}: AdminResultsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;
  const searchTerm = (params.search ?? "").trim();

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  if (!currentSession) {
    return (
      <main className="min-h-screen bg-[#EFE3D0]">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-[#C8A878] bg-[#FFFCF7] lg:flex lg:flex-col">
            <div className="border-b border-[#C8A878] px-6 py-5">
              <p className="text-sm font-bold tracking-wide text-[#2B211C]">
                RISING FOUNDATION
              </p>
              <p className="text-xs font-medium tracking-[0.2em] text-[#7A5038]">
                ACADEMY
              </p>
            </div>

            <div className="px-4 py-5">
              <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-[#7A5038]">
                Main Menu
              </p>

              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      item.href === "/admin/results"
                        ? "bg-[#4A2C20] text-white"
                        : "text-[#7A5038] hover:bg-[#EFE3D0] hover:text-[#2B211C]"
                    }`}
                  >
                    <Icon name={item.icon} size={19} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-auto border-t border-[#C8A878] p-4">
              <div className="flex items-center gap-3 rounded-lg bg-[#F7F1E7] px-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A2C20] text-xs font-bold text-white">
                  A
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2B211C]">
                    Administrator
                  </p>
                  <p className="text-xs text-[#7A5038]">
                    System Admin
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-4xl rounded-2xl border border-[#C8A878] bg-[#FFFCF7] p-8 shadow-sm">
              <p className="text-sm font-semibold text-[#7A5038]">
                Administration / Result Review
              </p>

              <h1 className="mt-2 text-2xl font-bold text-[#2B211C]">
                Result Review
              </h1>

              <p className="mt-2 text-[#7A5038]">
                No current academic session is configured.
              </p>
            </div>
          </main>
        </div>
      </main>
    );
  }

  const workflowResults = await prisma.result.findMany({
    where: {
      sessionId: currentSession.id,
      status: {
        in: [
          "SUBMITTED",
          "APPROVED",
          "PUBLISHED",
          "REJECTED",
        ],
      },
    },
    include: {
      student: true,
      class: true,
      subject: true,
      teacher: true,
      enrollment: true,
    },
    orderBy: [
      {
        class: {
          name: "asc",
        },
      },
      {
        student: {
          lastName: "asc",
        },
      },
      {
        student: {
          firstName: "asc",
        },
      },
      {
        subject: {
          name: "asc",
        },
      },
    ],
  });

  const studentMap = new Map<
    string,
    StudentResultGroup
  >();

  for (const result of workflowResults) {
    const existing = studentMap.get(result.enrollmentId);

    const teacherName = result.teacher
      ? `${result.teacher.firstName} ${result.teacher.lastName}`
      : null;

    if (existing) {
      existing.subjectCount += 1;

      if (
        teacherName &&
        !existing.teachers.includes(teacherName)
      ) {
        existing.teachers.push(teacherName);
      }

      existing.statuses.push(
        result.status as ResultStatus,
      );

      continue;
    }

    studentMap.set(result.enrollmentId, {
      enrollmentId: result.enrollmentId,
      studentId: result.student.id,
      firstName: result.student.firstName,
      middleName: result.student.middleName,
      lastName: result.student.lastName,
      admissionNo: result.student.admissionNo,
      className: result.class.name,
      arm: result.class.arm,
      stream: result.class.stream,
      term: result.term,
      subjectCount: 1,
      teachers: teacherName
        ? [teacherName]
        : [],
      statuses: [
        result.status as ResultStatus,
      ],
    });
  }

  const studentResults = Array.from(
    studentMap.values(),
  ).map((student) => ({
    ...student,
    overallStatus: getOverallStatus(
      student.statuses,
    ),
  }));

  const filteredResults = searchTerm
    ? studentResults.filter((student) => {
        const fullName = [
          student.firstName,
          student.middleName,
          student.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        const classDisplay = [
          student.className,
          student.arm,
          student.stream,
        ]
          .filter(Boolean)
          .join(" ");

        const search = searchTerm.toLowerCase();

        return (
          fullName.toLowerCase().includes(search) ||
          student.admissionNo
            .toLowerCase()
            .includes(search) ||
          classDisplay.toLowerCase().includes(search)
        );
      })
    : studentResults;

  const submittedCount = studentResults.filter(
    (student) =>
      student.overallStatus === "SUBMITTED",
  ).length;

  const rejectedCount = studentResults.filter(
    (student) =>
      student.overallStatus === "REJECTED",
  ).length;

  const approvedCount = studentResults.filter(
    (student) =>
      student.overallStatus === "APPROVED",
  ).length;

  const publishedCount = studentResults.filter(
    (student) =>
      student.overallStatus === "PUBLISHED",
  ).length;

  return (
    <main className="min-h-screen bg-[#EFE3D0]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#C8A878] bg-[#FFFCF7] lg:flex lg:flex-col">
          <div className="border-b border-[#C8A878] px-6 py-5">
            <p className="text-sm font-bold tracking-wide text-[#2B211C]">
              RISING FOUNDATION
            </p>

            <p className="text-xs font-medium tracking-[0.2em] text-[#7A5038]">
              ACADEMY
            </p>
          </div>

          <div className="px-4 py-5">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-[#7A5038]">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const active =
                  item.href === "/admin/results";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#4A2C20] text-white shadow-sm"
                        : "text-[#7A5038] hover:bg-[#EFE3D0] hover:text-[#2B211C]"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      size={19}
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#C8A878] p-4">
            <div className="flex items-center gap-3 rounded-lg bg-[#F7F1E7] px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A2C20] text-xs font-bold text-white">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2B211C]">
                  Administrator
                </p>

                <p className="text-xs text-[#7A5038]">
                  System Admin
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-7 flex flex-col gap-4 border-b border-[#C8A878] pb-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7A5038]">
                  Administration / Results
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-[#2B211C] sm:text-3xl">
                  Result Review
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm text-[#7A5038]">
                  Review, approve, reject and publish student
                  results submitted by teachers.
                </p>
              </div>

              <Link
                href="/admin"
                className="inline-flex w-fit items-center rounded-lg border border-[#C8A878] bg-[#FFFCF7] px-4 py-2.5 text-sm font-semibold text-[#4A2C20] shadow-sm transition hover:bg-[#F7F1E7]"
              >
                â† Dashboard
              </Link>
            </div>

            {/* Current Session */}
            <section className="mb-5 rounded-xl border border-[#C8A878] bg-[#FFFCF7] p-5 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A5038]">
                    Current Academic Session
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#2B211C]">
                    {currentSession.name}
                  </h2>

                  <p className="mt-1 text-sm text-[#7A5038]">
                    Results currently in the administrative workflow
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-yellow-100 bg-yellow-50 px-5 py-3 text-center">
                    <p className="text-xs font-medium text-yellow-700">
                      Submitted
                    </p>

                    <p className="mt-1 text-2xl font-bold text-yellow-900">
                      {submittedCount}
                    </p>
                  </div>

                  <div className="rounded-lg border border-red-100 bg-red-50 px-5 py-3 text-center">
                    <p className="text-xs font-medium text-red-700">
                      Rejected
                    </p>

                    <p className="mt-1 text-2xl font-bold text-red-900">
                      {rejectedCount}
                    </p>
                  </div>

                  <div className="rounded-lg border border-green-100 bg-green-50 px-5 py-3 text-center">
                    <p className="text-xs font-medium text-green-700">
                      Approved
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-900">
                      {approvedCount}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#C8A878] bg-[#F7F1E7] px-5 py-3 text-center">
                    <p className="text-xs font-medium text-[#7A5038]">
                      Published
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#4A2C20]">
                      {publishedCount}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Search */}
            <section className="mb-5 rounded-xl border border-[#C8A878] bg-[#FFFCF7] p-4 shadow-sm">
              <form
                method="GET"
                className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchTerm}
                    placeholder="Search by student name, admission number or class..."
                    className="w-full rounded-lg border border-[#C8A878] bg-[#FFFCF7] px-4 py-3 text-sm text-[#2B211C] outline-none transition placeholder:text-[#7A5038] focus:border-[#C8A878] focus:ring-2 focus:ring-[#C8A878]"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-[#4A2C20] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4A2C20]"
                >
                  Search
                </button>

                {searchTerm && (
                  <Link
                    href="/admin/results"
                    className="inline-flex items-center justify-center rounded-lg border border-[#C8A878] bg-[#FFFCF7] px-6 py-3 text-sm font-semibold text-[#4A2C20] transition hover:bg-[#F7F1E7]"
                  >
                    Clear
                  </Link>
                )}
              </form>

              {searchTerm && (
                <p className="mt-3 text-sm text-[#7A5038]">
                  Showing{" "}
                  <span className="font-semibold text-[#4A2C20]">
                    {filteredResults.length}
                  </span>{" "}
                  result
                  {filteredResults.length === 1
                    ? ""
                    : "s"} matching{" "}
                  <span className="font-semibold text-[#4A2C20]">
                    "{searchTerm}"
                  </span>
                  .
                </p>
              )}
            </section>

            {/* Workflow Information */}
            <section className="mb-5 rounded-xl border border-[#C8A878] bg-[#FFFCF7] px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[#7A5038]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  Submitted â€” awaiting review
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Rejected â€” teacher can correct and resubmit
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Approved â€” ready for publication
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F7F1E7]0" />
                  Published â€” available to students
                </div>
              </div>
            </section>

            {/* Student Results */}
            <section className="overflow-hidden rounded-xl border border-[#C8A878] bg-[#FFFCF7] shadow-sm">
              <div className="border-b border-[#C8A878] px-5 py-5">
                <h2 className="text-lg font-bold text-[#2B211C]">
                  Student Results
                </h2>

                <p className="mt-1 text-sm text-[#7A5038]">
                  Each student appears once. Open a student to
                  review their complete report sheet and manage
                  the result workflow.
                </p>
              </div>

              {filteredResults.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFE3D0] text-xl">
                    ðŸ”
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-[#2B211C]">
                    No students found
                  </h3>

                  <p className="mx-auto mt-2 max-w-lg text-sm text-[#7A5038]">
                    {searchTerm
                      ? `No student result matches "${searchTerm}". Try another name, admission number or class.`
                      : "There are currently no results in the review workflow."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="border-b border-[#C8A878] bg-[#F7F1E7]">
                      <tr>
                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Student
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Admission No.
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Class
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Term
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Subjects
                        </th>

                        <th className="px-5 py-4 font-semibold text-[#4A2C20]">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right font-semibold text-[#4A2C20]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#C8A878]">
                      {filteredResults.map((student) => {
                        const fullName = [
                          student.firstName,
                          student.middleName,
                          student.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        const classDisplay = [
                          student.className,
                          student.arm,
                          student.stream,
                        ]
                          .filter(Boolean)
                          .join(" â€” ");

                        const status =
                          student.overallStatus;

                        return (
                          <tr
                            key={student.enrollmentId}
                            className="bg-[#FFFCF7] transition hover:bg-[#F7F1E7]"
                          >
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4A2C20] text-sm font-bold text-white">
                                  {student.firstName
                                    .charAt(0)
                                    .toUpperCase()}
                                  {student.lastName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="font-semibold text-[#2B211C]">
                                    {fullName}
                                  </p>

                                  <p className="mt-1 text-xs text-[#7A5038]">
                                    Student Result
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 font-medium text-[#4A2C20]">
                              {student.admissionNo}
                            </td>

                            <td className="px-5 py-5">
                              <p className="font-semibold text-[#4A2C20]">
                                {classDisplay}
                              </p>
                            </td>

                            <td className="px-5 py-5 text-[#4A2C20]">
                              {termLabel(student.term)}
                            </td>

                            <td className="px-5 py-5">
                              <span className="font-semibold text-[#2B211C]">
                                {student.subjectCount}
                              </span>

                              <span className="ml-1 text-[#7A5038]">
                                {student.subjectCount === 1
                                  ? "subject"
                                  : "subjects"}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                                  status,
                                )}`}
                              >
                                {statusLabel(status)}
                              </span>
                            </td>

                            <td className="px-5 py-5 text-right">
                              <Link
                                href={`/admin/results/${student.enrollmentId}`}
                                className="inline-flex items-center rounded-lg bg-[#4A2C20] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A2C20]"
                              >
                                View Result â†’
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Information */}
            {filteredResults.length > 0 && (
              <div className="mt-5 rounded-xl border border-[#C8A878] bg-[#FFFCF7] p-5 shadow-sm">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFE3D0] text-sm font-bold text-[#4A2C20]">
                    i
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#2B211C]">
                      How result review works
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#7A5038]">
                      Select a student to open their complete
                      school report sheet. Submitted results can
                      be approved or rejected. Approved results
                      can be published, while rejected results can
                      be corrected by the teacher and submitted
                      again for review. Published results remain
                      visible here for administrative records.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
