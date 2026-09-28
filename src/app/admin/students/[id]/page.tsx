import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type StudentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTerm(term: string) {
  switch (term) {
    case "FIRST":
      return "First Term";
    case "SECOND":
      return "Second Term";
    case "THIRD":
      return "Third Term";
    default:
      return term;
  }
}

function formatNumber(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}

export default async function StudentProfilePage({
  params,
}: StudentPageProps) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          class: true,
          session: true,
          results: {
            orderBy: {
              subject: {
                name: "asc",
              },
            },
            include: {
              subject: true,
            },
          },
          TermSummary: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const latestEnrollment = student.enrollments[0];
  const latestResults = latestEnrollment?.results ?? [];
  const latestSummary = latestEnrollment?.TermSummary;

  const totalResults = student.enrollments.reduce(
    (total, enrollment) => total + enrollment.results.length,
    0,
  );

  const average =
    latestSummary?.average !== null &&
    latestSummary?.average !== undefined
      ? Number(latestSummary.average)
      : null;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-gray-100 px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-950">
                Rising Foundation Academy
              </h1>
              <p className="text-xs text-gray-500">School Management</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {[
              ["Dashboard", "/admin"],
              ["Students", "/admin/students"],
              ["Teachers", "/admin/teachers"],
              ["Classes", "/admin/classes"],
              ["Subjects", "/admin/subjects"],
              ["Results", "/admin/results"],
              ["Academic Sessions", "/admin/sessions"],
              ["Assignments", "/admin/assignments"],
            ].map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  name === "Students"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {name}
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">
                CURRENT SESSION
              </p>

              <p className="mt-1 text-sm font-semibold">2025/2026</p>

              <p className="mt-1 text-xs text-gray-500">First Term</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-10">
            <div>
              <p className="text-sm text-gray-500">School Management</p>
              <h2 className="text-lg font-semibold">Student Profile</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                AD
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <Link
                  href="/admin/students"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  ← Back to Students
                </Link>

                <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Student Management
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                      {fullName}
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                      {student.admissionNo}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      student.isActive
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {student.isActive ? "Active Student" : "Inactive Student"}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
                  <div className="mb-5">
                    <h2 className="font-semibold">Personal Information</h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Basic information registered for this student.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Full Name
                      </p>

                      <p className="mt-1 text-sm font-medium">{fullName}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Admission Number
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {student.admissionNo}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Gender
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {student.gender === "MALE" ? "Male" : "Female"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Date of Birth
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(student.dateOfBirth)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="font-semibold">Current Placement</h2>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Class
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {latestEnrollment?.class.name ?? "Not enrolled"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Academic Session
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {latestEnrollment?.session.name ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Term
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {latestEnrollment
                          ? formatTerm(latestEnrollment.term)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Enrollments</p>

                  <p className="mt-2 text-2xl font-bold">
                    {student.enrollments.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Results Recorded</p>

                  <p className="mt-2 text-2xl font-bold">{totalResults}</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Current Average</p>

                  <p className="mt-2 text-2xl font-bold">
                    {average !== null ? `${average.toFixed(2)}%` : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Current Position</p>

                  <p className="mt-2 text-2xl font-bold">
                    {latestSummary?.position
                      ? `${latestSummary.position}${
                          latestSummary.positionOutOf
                            ? ` / ${latestSummary.positionOutOf}`
                            : ""
                        }`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="font-semibold">Current Term Results</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Results recorded for the student&apos;s latest enrollment.
                  </p>
                </div>

                {latestResults.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="font-medium text-gray-700">
                      No results recorded yet.
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Results will appear here once they are entered.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Subject
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            CA 1
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            CA 2
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Exam
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Total
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Grade
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Remark
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {latestResults.map((result) => (
                          <tr
                            key={result.id}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-6 py-4 font-medium">
                              {result.subject.name}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatNumber(result.ca1Score)}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatNumber(result.ca2Score)}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatNumber(result.examScore)}
                            </td>

                            <td className="px-6 py-4 font-semibold">
                              {formatNumber(result.totalScore)}
                            </td>

                            <td className="px-6 py-4">
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                                {result.grade ?? "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {result.remark ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="font-semibold">Attendance</h2>

                  {latestEnrollment ? (
                    <div className="mt-5 grid grid-cols-3 gap-4">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Opened</p>

                        <p className="mt-1 text-xl font-bold">
                          {latestEnrollment.attendanceOpened ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Present</p>

                        <p className="mt-1 text-xl font-bold">
                          {latestEnrollment.attendancePresent ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Absent</p>

                        <p className="mt-1 text-xl font-bold">
                          {latestEnrollment.attendanceAbsent ?? "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      No attendance record available.
                    </p>
                  )}

                  {latestEnrollment?.attendancePercentage !== null &&
                    latestEnrollment?.attendancePercentage !== undefined && (
                      <p className="mt-4 text-sm text-gray-500">
                        Attendance percentage:{" "}
                        <span className="font-semibold text-gray-900">
                          {formatNumber(
                            latestEnrollment.attendancePercentage,
                          )}
                          %
                        </span>
                      </p>
                    )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="font-semibold">Term Summary</h2>

                  {latestSummary ? (
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Overall Total
                        </span>

                        <span className="text-sm font-semibold">
                          {formatNumber(latestSummary.overallTotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Average
                        </span>

                        <span className="text-sm font-semibold">
                          {formatNumber(latestSummary.average)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Performance Rate
                        </span>

                        <span className="text-sm font-semibold">
                          {formatNumber(latestSummary.performanceRate)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Class Scoring Average
                        </span>

                        <span className="text-sm font-semibold">
                          {formatNumber(
                            latestSummary.classScoringAverage,
                          )}
                          %
                        </span>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Teacher Comment
                        </p>

                        <p className="mt-2 text-sm text-gray-700">
                          {latestSummary.teacherComment ??
                            "No comment recorded."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      No term summary available yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="font-semibold">Enrollment History</h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Academic classes and terms assigned to this student.
                  </p>
                </div>

                {student.enrollments.length === 0 ? (
                  <div className="p-8 text-sm text-gray-500">
                    No enrollment history available.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Session
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Term
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Class
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Attendance
                          </th>

                          <th className="px-6 py-4 font-semibold text-gray-600">
                            Results
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {student.enrollments.map((enrollment) => (
                          <tr
                            key={enrollment.id}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-6 py-4 font-medium">
                              {enrollment.session.name}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatTerm(enrollment.term)}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {enrollment.class.name}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {enrollment.attendancePercentage !== null
                                ? `${formatNumber(
                                    enrollment.attendancePercentage,
                                  )}%`
                                : "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {enrollment.results.length}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}