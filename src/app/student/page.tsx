import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClearResultPin from "./results/ClearResultPin";

type Term = "FIRST" | "SECOND" | "THIRD";

function termLabel(term: Term | null | undefined) {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  if (term === "THIRD") return "Third Term";
  return "No term";
}

function formatAnnouncementDate(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function validTerm(value: string | undefined): value is Term {
  return value === "FIRST" || value === "SECOND" || value === "THIRD";
}

interface StudentDashboardProps {
  searchParams: Promise<{
    sessionId?: string;
    term?: string;
  }>;
}

export default async function StudentDashboard({
  searchParams,
}: StudentDashboardProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const params = await searchParams;

  const [student, currentAcademicSession, announcements] =
    await Promise.all([
      prisma.student.findUnique({
        where: {
          userId: session.user.id,
        },
        include: {
          enrollments: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              class: true,
              session: true,
              TermSummary: true,
            },
          },
        },
      }),

      prisma.academicSession.findFirst({
        where: {
          isCurrent: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.announcement.findMany({
        where: {
          published: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-school p-6">
        <div className="school-card w-full max-w-md p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
            Rising Foundation Academy
          </p>

          <h1 className="mt-3 text-2xl font-bold text-primary">
            Student Profile Not Found
          </h1>

          <p className="mt-3 text-sm text-muted">
            Your login account is not currently linked to a student profile.
            Please contact the school administrator.
          </p>
        </div>
      </main>
    );
  }

  const enrollments = student.enrollments;

  const availableSessions = Array.from(
    new Map(
      enrollments.map((enrollment) => [
        enrollment.sessionId,
        enrollment.session,
      ]),
    ).values(),
  );

  const requestedSessionId = params.sessionId;

  const selectedSession =
    availableSessions.find(
      (item) => item.id === requestedSessionId,
    ) ??
    (currentAcademicSession &&
    availableSessions.some((item) => item.id === currentAcademicSession.id)
      ? currentAcademicSession
      : enrollments[0]?.session ?? null);

  const sessionEnrollments = selectedSession
    ? enrollments.filter(
        (enrollment) => enrollment.sessionId === selectedSession.id,
      )
    : [];

  const availableTerms = Array.from(
    new Set(sessionEnrollments.map((enrollment) => enrollment.term as Term)),
  );

  const requestedTerm = validTerm(params.term) ? params.term : undefined;

  const selectedTerm =
    requestedTerm && availableTerms.includes(requestedTerm)
      ? requestedTerm
      : selectedSession?.id === currentAcademicSession?.id &&
          validTerm(currentAcademicSession.currentTerm) &&
          availableTerms.includes(currentAcademicSession.currentTerm)
        ? currentAcademicSession.currentTerm
        : (availableTerms[0] ?? null);

  const enrollment =
    sessionEnrollments.find(
      (item) => item.term === selectedTerm,
    ) ?? null;

  const studentName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const average = Number(enrollment?.TermSummary?.average ?? 0);
  const position = enrollment?.TermSummary?.position;
  const positionOutOf = enrollment?.TermSummary?.positionOutOf;

  const performanceRate = Number(
    enrollment?.TermSummary?.performanceRate ?? 0,
  );

  return (
    <main className="min-h-screen bg-school text-school">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="rounded-3xl bg-primary p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Rising Foundation Academy
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Welcome, {student.firstName}
              </h1>

              <p className="mt-2 text-sm text-white/75">
                Student Result Portal
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Admission Number
              </p>

              <p className="mt-1 text-lg font-bold">
                {student.admissionNo}
              </p>
            </div>
          </div>
        </header>

        <section className="school-card mt-6 p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Student
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {studentName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Class
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {enrollment?.class?.name ?? "Not assigned"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Academic Session
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {selectedSession?.name ?? "No session"}
              </p>
            </div>
          </div>
        </section>

        <section className="school-card mt-6 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Result Period
            </p>

            <h2 className="mt-2 text-xl font-bold text-primary">
              Select Academic Session and Term
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted">
              Choose the academic session and term you want to view.
            </p>
          </div>

          <form
            method="get"
            className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div>
              <label
                htmlFor="sessionId"
                className="mb-1 block text-sm font-semibold text-secondary"
              >
                Academic Session
              </label>

              <select
                id="sessionId"
                name="sessionId"
                defaultValue={selectedSession?.id ?? ""}
                className="school-input px-4 py-3 text-sm font-medium"
              >
                {availableSessions.length === 0 ? (
                  <option value="">No sessions available</option>
                ) : (
                  availableSessions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="term"
                className="mb-1 block text-sm font-semibold text-secondary"
              >
                Term
              </label>

              <select
                id="term"
                name="term"
                defaultValue={selectedTerm ?? ""}
                className="school-input px-4 py-3 text-sm font-medium"
              >
                <option value="">Select term</option>
                <option value="FIRST">First Term</option>
                <option value="SECOND">Second Term</option>
                <option value="THIRD">Third Term</option>
              </select>
            </div>

            <button
              type="submit"
              className="school-button px-6 py-3 text-sm font-semibold"
            >
              Select Result
            </button>
          </form>

          {selectedSession && selectedTerm && (
            <div className="mt-4 rounded-xl bg-school px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Selected Result Period
              </p>

              <p className="mt-1 text-sm font-bold text-primary">
                {selectedSession.name} — {termLabel(selectedTerm)}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="school-card p-6">
            <p className="text-sm font-medium text-muted">Term</p>

            <p className="mt-2 text-2xl font-bold text-primary">
              {selectedTerm ? termLabel(selectedTerm) : "—"}
            </p>
          </div>

          <div className="school-card p-6">
            <p className="text-sm font-medium text-muted">
              Student Average
            </p>

            <p className="mt-2 text-2xl font-bold text-primary">
              {enrollment ? average.toFixed(2) : "—"}
            </p>
          </div>

          <div className="school-card p-6">
            <p className="text-sm font-medium text-muted">Position</p>

            <p className="mt-2 text-2xl font-bold text-primary">
              {position
                ? `${position}${positionOutOf ? ` / ${positionOutOf}` : ""}`
                : "—"}
            </p>
          </div>

          <div className="school-card p-6">
            <p className="text-sm font-medium text-muted">
              Performance Rate
            </p>

            <p className="mt-2 text-2xl font-bold text-primary">
              {enrollment ? `${performanceRate.toFixed(2)}%` : "—"}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="school-card rounded-3xl p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Academic Results
            </p>

            <h2 className="mt-2 text-2xl font-bold text-primary">
              View Your Result
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              View your academic performance, subject scores, grades,
              positions and teacher comments for the selected session and
              term.
            </p>

            {enrollment && selectedSession && selectedTerm ? (
              <ClearResultPin
                sessionId={selectedSession.id}
                term={selectedTerm}
              />
            ) : (
              <div className="mt-6 rounded-xl bg-school p-4">
                <p className="text-sm font-medium text-primary">
                  No enrollment is available for the selected result period.
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Please select another academic session or term.
                </p>
              </div>
            )}
          </div>

          <div className="school-card rounded-3xl p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              School Announcements
            </p>

            <h2 className="mt-2 text-2xl font-bold text-primary">
              Announcements
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Important announcements from the school will appear here.
            </p>

            {announcements.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-school p-5">
                <p className="text-sm font-medium text-primary">
                  No new announcements
                </p>

                <p className="mt-1 text-xs text-muted">
                  Check back later for updates from the school.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-school bg-school p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-base font-bold text-primary">
                        {announcement.title}
                      </h3>

                      <span className="shrink-0 text-xs font-medium text-secondary">
                        {formatAnnouncementDate(announcement.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                      {announcement.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-muted">
          <p className="font-semibold text-primary">
            RISING FOUNDATION ACADEMY
          </p>

          <p className="mt-1">ACADEMY FOR EXCELLENCE</p>
        </footer>
      </div>
    </main>
  );
}