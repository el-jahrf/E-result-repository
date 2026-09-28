import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PrincipalDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PRINCIPAL") {
    redirect("/");
  }

  const currentAcademicSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    select: {
      id: true,
      name: true,
    },
  });

  const [
    totalStudents,
    activeStudents,
    activeTeachers,
    totalClasses,
    publishedResults,
  ] = await Promise.all([
    prisma.student.count(),

    prisma.student.count({
      where: {
        isActive: true,
      },
    }),

    prisma.teacher.count({
      where: {
        isActive: true,
      },
    }),

    prisma.class.count(),

    prisma.result.count({
      where: {
        status: "PUBLISHED",
      },
    }),
  ]);

  const sessionName =
    currentAcademicSession?.name ?? "No Current Session";

  const termSummaries = currentAcademicSession
    ? await prisma.termSummary.findMany({
        where: {
          Enrollment: {
            sessionId: currentAcademicSession.id,
          },
        },
        select: {
          average: true,
          performanceRate: true,
          classScoringAverage: true,
        },
      })
    : [];

  const averageValues = termSummaries
    .map((item) => Number(item.average ?? 0))
    .filter((value) => Number.isFinite(value));

  const performanceValues = termSummaries
    .map((item) => Number(item.performanceRate ?? 0))
    .filter((value) => Number.isFinite(value));

  const classAverageValues = termSummaries
    .map((item) => Number(item.classScoringAverage ?? 0))
    .filter((value) => Number.isFinite(value));

  const studentAverage =
    averageValues.length > 0
      ? averageValues.reduce((sum, value) => sum + value, 0) /
        averageValues.length
      : 0;

  const performanceRate =
    performanceValues.length > 0
      ? performanceValues.reduce((sum, value) => sum + value, 0) /
        performanceValues.length
      : 0;

  const classScoringAverage =
    classAverageValues.length > 0
      ? classAverageValues.reduce((sum, value) => sum + value, 0) /
        classAverageValues.length
      : 0;

  return (
    <main className="min-h-screen bg-[#f7f1e7] text-[#2b211c]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 rounded-3xl bg-[#4a2c20] p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a878]">
                Rising Foundation Academy
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Principal Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Academic oversight, result monitoring and school performance
                overview.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a878]">
                Current Academic Session
              </p>

              <p className="mt-1 text-lg font-bold">
                {sessionName}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Students
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {totalStudents}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Students
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {activeStudents}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Teachers
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {activeTeachers}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Classes
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {totalClasses}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Student Average
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {studentAverage.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Current session
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Performance Rate
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {performanceRate.toFixed(2)}%
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Current session
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Class Scoring Average
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4a2c20]">
              {classScoringAverage.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Current session
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#e5d8c8] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#7a5038]">
                Academic Oversight
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#4a2c20]">
                Results Monitoring
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Monitor submitted and published student results for the
                current academic session.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f1e7] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Published Results
              </p>

              <p className="mt-1 text-2xl font-bold text-[#4a2c20]">
                {publishedResults}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/admin/results"
              className="rounded-xl bg-[#4a2c20] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7a5038]"
            >
              Review Results
            </a>

            <a
              href="/"
              className="rounded-xl border border-[#d9c9b7] bg-white px-5 py-3 text-sm font-semibold text-[#4a2c20] transition hover:bg-[#f7f1e7]"
            >
              Dashboard Gateway
            </a>
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p className="font-semibold text-[#4a2c20]">
            RISING FOUNDATION ACADEMY
          </p>

          <p className="mt-1">
            ACADEMY FOR EXCELLENCE
          </p>
        </footer>
      </div>
    </main>
  );
}