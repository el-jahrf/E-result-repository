import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PinVerificationForm from "./PinVerificationForm";

type Term = "FIRST" | "SECOND" | "THIRD";

const VALID_TERMS: Term[] = ["FIRST", "SECOND", "THIRD"];

function termLabel(term: string) {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  if (term === "THIRD") return "Third Term";
  return term;
}

function formatNumber(value: unknown, digits = 2) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(digits);
}

function getParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function StudentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sessionId?: string | string[];
    term?: string | string[];
  }>;
}) {
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

  const requestedSessionId = getParam(params.sessionId);
  const requestedTerm = getParam(params.term);

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-school p-6">
        <div className="school-card w-full max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-primary">
            Student Profile Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Your account is not currently linked to a student profile.
            Please contact the school administrator.
          </p>

          <Link
            href="/student"
            className="school-button mt-6 inline-flex px-5 py-3 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      currentTerm: true,
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      session: true,
      class: true,
      TermSummary: true,
    },
    orderBy: [
      {
        session: {
          startDate: "desc",
        },
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const sessionMap = new Map<
    string,
    (typeof enrollments)[number]["session"]
  >();

  for (const enrollment of enrollments) {
    if (!sessionMap.has(enrollment.sessionId)) {
      sessionMap.set(enrollment.sessionId, enrollment.session);
    }
  }

  const availableSessions = Array.from(sessionMap.values());

  let selectedSessionId: string | null = null;

  if (
    requestedSessionId &&
    availableSessions.some(
      (availableSession) => availableSession.id === requestedSessionId,
    )
  ) {
    selectedSessionId = requestedSessionId;
  } else if (
    currentSession &&
    availableSessions.some(
      (availableSession) => availableSession.id === currentSession.id,
    )
  ) {
    selectedSessionId = currentSession.id;
  } else {
    selectedSessionId = availableSessions[0]?.id ?? null;
  }

  const selectedSession =
    availableSessions.find(
      (availableSession) => availableSession.id === selectedSessionId,
    ) ?? null;

  const selectedSessionEnrollments = enrollments.filter(
    (enrollment) => enrollment.sessionId === selectedSessionId,
  );

  const availableTerms = VALID_TERMS.filter((term) =>
    selectedSessionEnrollments.some(
      (enrollment) => enrollment.term === term,
    ),
  );

  let selectedTerm: Term | null = null;

  const requestedTermIsValid =
    requestedTerm &&
    VALID_TERMS.includes(requestedTerm as Term) &&
    availableTerms.includes(requestedTerm as Term);

  if (requestedTermIsValid) {
    selectedTerm = requestedTerm as Term;
  } else if (
    selectedSession &&
    currentSession?.id === selectedSession.id &&
    availableTerms.includes(currentSession.currentTerm as Term)
  ) {
    selectedTerm = currentSession.currentTerm as Term;
  } else {
    selectedTerm = availableTerms[0] ?? null;
  }

  const selectedEnrollment =
    selectedSessionId && selectedTerm
      ? enrollments.find(
          (enrollment) =>
            enrollment.sessionId === selectedSessionId &&
            enrollment.term === selectedTerm,
        )
      : null;

  const cookieStore = await cookies();
  const resultPinId = cookieStore.get("result_pin_access")?.value;

  let verifiedPin = null;

  if (resultPinId) {
    verifiedPin = await prisma.resultPin.findFirst({
      where: {
        id: resultPinId,
        studentId: student.id,
        isActive: true,
      },
      select: {
        id: true,
        sessionId: true,
        term: true,
        usedCount: true,
        maxUses: true,
      },
    });
  }

  const pinMatchesSelection =
    Boolean(verifiedPin) &&
    verifiedPin?.sessionId === selectedSessionId &&
    verifiedPin?.term === selectedTerm &&
    verifiedPin.usedCount <= verifiedPin.maxUses;

  if (selectedEnrollment && pinMatchesSelection) {
    const publishedResults = await prisma.result.findMany({
      where: {
        studentId: student.id,
        enrollmentId: selectedEnrollment.id,
        sessionId: selectedEnrollment.sessionId,
        term: selectedEnrollment.term,
        status: "PUBLISHED",
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
        enrollment: {
          include: {
            session: true,
            TermSummary: true,
          },
        },
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    if (publishedResults.length === 0) {
      return (
        <main className="min-h-screen bg-school text-school">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                  Rising Foundation Academy
                </p>

                <h1 className="mt-2 text-3xl font-bold text-primary">
                  My Results
                </h1>

                <p className="mt-1 text-sm text-muted">
                  Published academic results will appear here.
                </p>
              </div>

              <Link
                href="/student"
                className="inline-flex w-fit rounded-lg border border-school bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-school"
              >
                ← Back to Dashboard
              </Link>
            </div>

            <section className="school-card mb-6 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Selected Result Period
              </p>

              <h2 className="mt-1 text-xl font-bold text-primary">
                {selectedSession?.name ?? "—"}
              </h2>

              <p className="mt-1 text-sm text-muted">
                {selectedTerm ? termLabel(selectedTerm) : "—"}
              </p>
            </section>

            <section className="school-card p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-school text-2xl">
                📄
              </div>

              <h2 className="mt-5 text-xl font-bold text-primary">
                No Published Result Yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Your result for the selected session and term has not been
                published yet. Once the school completes its review and
                publishes your result, it will appear here.
              </p>

              <Link
                href="/student"
                className="school-button mt-6 inline-flex px-5 py-3 text-sm font-semibold"
              >
                Back to Dashboard
              </Link>
            </section>
          </div>
        </main>
      );
    }

    const enrollmentMap = new Map<
      string,
      (typeof publishedResults)[number][]
    >();

    for (const result of publishedResults) {
      const existing = enrollmentMap.get(result.enrollmentId) ?? [];

      existing.push(result);
      enrollmentMap.set(result.enrollmentId, existing);
    }

    const reportGroups = Array.from(enrollmentMap.entries()).map(
      ([enrollmentId, results]) => {
        const first = results[0];

        return {
          enrollmentId,
          results,
          enrollment: first.enrollment,
          class: first.class,
          session: first.enrollment.session,
          term: first.enrollment.term,
        };
      },
    );

    return (
      <main className="min-h-screen bg-school text-school">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                Rising Foundation Academy
              </p>

              <h1 className="mt-2 text-3xl font-bold text-primary">
                My Results
              </h1>

              <p className="mt-1 text-sm text-muted">
                Your published school results.
              </p>
            </div>

            <Link
              href="/student"
              className="inline-flex w-fit rounded-lg border border-school bg-surface px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-school"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <section className="school-card mb-6 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Selected Result Period
                </p>

                <h2 className="mt-1 text-xl font-bold text-primary">
                  {selectedSession?.name ?? "—"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {selectedTerm ? termLabel(selectedTerm) : "—"}
                </p>
              </div>

              <form
                method="GET"
                action="/student/results"
                className="grid gap-3 sm:grid-cols-3"
              >
                <select
                  name="sessionId"
                  defaultValue={selectedSessionId ?? ""}
                  className="school-input px-4 py-2.5 text-sm font-medium"
                >
                  {availableSessions.map((academicSession) => (
                    <option
                      key={academicSession.id}
                      value={academicSession.id}
                    >
                      {academicSession.name}
                    </option>
                  ))}
                </select>

                <select
                  name="term"
                  defaultValue={selectedTerm ?? ""}
                  className="school-input px-4 py-2.5 text-sm font-medium"
                >
                  {VALID_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {termLabel(term)}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="school-button px-4 py-2.5 text-sm font-semibold"
                >
                  Change Period
                </button>
              </form>
            </div>
          </section>

          <section className="school-card">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-lg font-bold text-primary">
                Published Results
              </h2>

              <p className="mt-1 text-sm text-muted">
                Select a result to open your official school result sheet.
              </p>
            </div>

            <div className="divide-y divide-school">
              {reportGroups.map((group) => {
                const summary = group.enrollment.TermSummary;

                const average = Number(summary?.average ?? 0);
                const position = summary?.position;
                const positionOutOf = summary?.positionOutOf;

                const performanceRate = Number(
                  summary?.performanceRate ?? 0,
                );

                const classDisplay = [
                  group.class.name,
                  group.class.arm,
                  group.class.stream,
                ]
                  .filter(Boolean)
                  .join(" — ");

                return (
                  <div
                    key={group.enrollmentId}
                    className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {termLabel(group.term)}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-primary">
                        {group.session.name}
                      </h3>

                      <p className="mt-2 text-sm text-secondary">
                        {classDisplay}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs">
                        <span className="rounded-full bg-school px-3 py-1.5 font-semibold text-secondary">
                          {group.results.length}{" "}
                          {group.results.length === 1
                            ? "Subject"
                            : "Subjects"}
                        </span>

                        <span className="rounded-full bg-school px-3 py-1.5 font-semibold text-secondary">
                          Average: {formatNumber(average)}
                        </span>

                        {position && (
                          <span className="rounded-full bg-school px-3 py-1.5 font-semibold text-secondary">
                            Position: {position}
                            {positionOutOf
                              ? ` / ${positionOutOf}`
                              : ""}
                          </span>
                        )}

                        <span className="rounded-full bg-success px-3 py-1.5 font-semibold text-white">
                          Published
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-muted">
                        Performance Rate:{" "}
                        {formatNumber(performanceRate)}%
                      </p>
                    </div>

                    <Link
                      href={`/student/results/${group.enrollmentId}`}
                      className="school-button inline-flex w-fit shrink-0 px-5 py-3 text-sm font-semibold"
                    >
                      View Result →
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-muted">
            RISING FOUNDATION ACADEMY
          </footer>
        </div>
      </main>
    );
  }

  if (!selectedEnrollment) {
    return (
      <main className="min-h-screen bg-school text-school">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                Rising Foundation Academy
              </p>

              <h1 className="mt-2 text-3xl font-bold text-primary">
                My Results
              </h1>

              <p className="mt-1 text-sm text-muted">
                Select an academic session and term to view your result.
              </p>
            </div>

            <Link
              href="/student"
              className="inline-flex w-fit rounded-lg border border-school bg-surface px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-school"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <section className="school-card p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-school text-2xl">
              📄
            </div>

            <h2 className="mt-5 text-xl font-bold text-primary">
              No Enrollment Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              You do not have an enrollment for the selected academic session
              and term.
            </p>

            <Link
              href="/student"
              className="school-button mt-6 inline-flex px-5 py-3 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-school text-school">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-10">
        <div className="school-card w-full rounded-3xl p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-school bg-surface p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/school-logo.png.png"
                alt="Rising Foundation Academy"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              Rising Foundation Academy
            </p>

            <h1 className="mt-3 text-3xl font-bold text-primary">
              Result Verification
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
              Enter the Result PIN provided by the school to access your
              published academic result.
            </p>
          </div>

          <section className="mt-8 rounded-2xl border border-school bg-school p-6">
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">
                Select Result Period
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted">
                Choose the academic session and term for the result you want
                to view.
              </p>
            </div>

            <form
              method="GET"
              action="/student/results"
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="sessionId"
                  className="block text-sm font-semibold text-secondary"
                >
                  Academic Session
                </label>

                <select
                  id="sessionId"
                  name="sessionId"
                  defaultValue={selectedSessionId ?? ""}
                  className="school-input mt-2 px-4 py-3 text-sm font-medium"
                >
                  {availableSessions.map((academicSession) => (
                    <option
                      key={academicSession.id}
                      value={academicSession.id}
                    >
                      {academicSession.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="block text-sm font-semibold text-secondary"
                >
                  Term
                </label>

                <select
                  id="term"
                  name="term"
                  defaultValue={selectedTerm ?? ""}
                  className="school-input mt-2 px-4 py-3 text-sm font-medium"
                >
                  {VALID_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {termLabel(term)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-school bg-surface px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-school"
                >
                  Load Selected Result Period
                </button>
              </div>
            </form>
          </section>

          <div className="mt-6 rounded-2xl border border-school bg-surface p-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Student
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {[student.firstName, student.middleName, student.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </p>

              <p className="mt-1 text-sm text-muted">
                Admission No: {student.admissionNo}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-school px-3 py-1.5 text-xs font-semibold text-secondary">
                  {selectedSession?.name ?? "—"}
                </span>

                <span className="rounded-full bg-school px-3 py-1.5 text-xs font-semibold text-secondary">
                  {selectedTerm ? termLabel(selectedTerm) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-school bg-surface p-6">
            <p className="text-center text-sm font-semibold text-secondary">
              Enter Your Result PIN
            </p>

            <p className="mt-2 text-center text-xs leading-5 text-muted">
              Enter the 15-digit PIN printed on your school result
              verification card.
            </p>

            {selectedSessionId && selectedTerm && (
              <PinVerificationForm
                sessionId={selectedSessionId}
                term={selectedTerm}
              />
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/student"
              className="inline-flex rounded-lg border border-school bg-surface px-5 py-3 text-sm font-semibold text-secondary hover:bg-school"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}