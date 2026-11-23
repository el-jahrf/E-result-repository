import Link from "next/link";
import Image from "next/image";
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

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

  const params = await searchParams;
  const requestedSessionId = getParam(params.sessionId);
  const requestedTerm = getParam(params.term);

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        include: {
          session: true,
          class: true,
          TermSummary: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) {
    redirect("/login");
  }

  const currentSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
  });

  const availableSessions = Array.from(
    new Map(
      student.enrollments.map((enrollment) => [
        enrollment.sessionId,
        enrollment.session,
      ]),
    ).values(),
  );

  const selectedSession =
    availableSessions.find(
      (item) => item.id === requestedSessionId,
    ) ??
    availableSessions.find((item) => item.isCurrent) ??
    availableSessions.find(
      (item) => item.id === currentSession?.id,
    ) ??
    availableSessions[0];

  // Get available terms directly from the Enrollment records.
  const availableTerms: Term[] = selectedSession
    ? Array.from(
        new Set(
          student.enrollments
            .filter(
              (enrollment) =>
                enrollment.sessionId === selectedSession.id,
            )
            .map((enrollment) => enrollment.term as Term)
            .filter((term) => VALID_TERMS.includes(term)),
        ),
      )
    : [];

  const selectedTerm: Term =
    requestedTerm && VALID_TERMS.includes(requestedTerm as Term)
      ? (requestedTerm as Term)
      : availableTerms[0] ?? "FIRST";

  // Match the actual enrollment by session and its own term field.
  const selectedEnrollment = student.enrollments.find(
    (enrollment) =>
      enrollment.sessionId === selectedSession?.id &&
      enrollment.term === selectedTerm,
  );

  const cookieStore = await cookies();
  const pinCookie = cookieStore.get("result_pin_access")?.value;

  let pinMatchesSelection = false;

  if (pinCookie && selectedEnrollment && selectedSession) {
    const activePin = await prisma.resultPin.findFirst({
      where: {
        id: pinCookie,
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

    pinMatchesSelection =
      !!activePin &&
      activePin.sessionId === selectedSession.id &&
      activePin.term === selectedTerm &&
      activePin.usedCount <= activePin.maxUses;
  }

  let hasPublishedResults = false;

  if (
    selectedEnrollment &&
    selectedSession &&
    pinMatchesSelection
  ) {
    const publishedResults = await prisma.result.findMany({
      where: {
        enrollmentId: selectedEnrollment.id,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    hasPublishedResults = publishedResults.length > 0;
  }

  if (!selectedEnrollment) {
    return (
      <main className="min-h-screen bg-school px-4 py-10 text-school">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C8A878] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#4A2C20]">
            No Enrollment Found
          </h1>

          <p className="mt-3 text-sm text-[#7A5038]">
            No enrollment was found for the selected academic session
            and term.
          </p>

          <Link
            href="/student"
            className="mt-6 inline-flex rounded-xl bg-[#4A2C20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7A5038]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (pinMatchesSelection && !hasPublishedResults) {
    return (
      <main className="min-h-screen bg-school px-4 py-10 text-school">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C8A878] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#4A2C20]">
            No Published Result Yet
          </h1>

          <p className="mt-3 text-sm text-[#7A5038]">
            Your result for {termLabel(selectedTerm)} (
            {selectedSession?.name}) has not been published yet.
          </p>

          <Link
            href="/student"
            className="mt-6 inline-flex rounded-xl bg-[#4A2C20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7A5038]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (pinMatchesSelection && hasPublishedResults) {
    return (
      <main className="min-h-screen bg-school px-4 py-10 text-school">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C8A878] bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#C8A878] bg-[#4A2C20] p-2">
              <Image
                src="/school-logo.png"
                alt="Rising Foundation Academy logo"
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-5 inline-flex rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold text-green-800">
              PIN VERIFIED
            </div>

            <h1 className="mt-4 text-2xl font-bold text-[#4A2C20]">
              Result Ready
            </h1>

            <p className="mt-2 text-sm text-[#7A5038]">
              Your result is available. Click below to view your
              result sheet.
            </p>
          </div>

          <div className="mt-7 rounded-xl border border-[#E5D5BD] bg-[#F7F1E7] p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#7A5038]">Student Name</span>
                <span className="text-right font-semibold text-[#2B211C]">
                  {student.firstName} {student.lastName}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#7A5038]">Admission Number</span>
                <span className="text-right font-semibold text-[#2B211C]">
                  {student.admissionNo}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#7A5038]">Class</span>
                <span className="text-right font-semibold text-[#2B211C]">
                  {selectedEnrollment.class.name}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#7A5038]">Academic Session</span>
                <span className="text-right font-semibold text-[#2B211C]">
                  {selectedSession?.name}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#7A5038]">Term</span>
                <span className="text-right font-semibold text-[#2B211C]">
                  {termLabel(selectedTerm)}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/student/results/${selectedEnrollment.id}`}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#4A2C20] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#7A5038]"
          >
            View Result
          </Link>

          <Link
            href="/student"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#C8A878] px-5 py-3 text-sm font-semibold text-[#4A2C20] hover:bg-[#F7F1E7]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-school px-4 py-10 text-school">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#C8A878] bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#C8A878] bg-[#4A2C20] p-2">
            <Image
              src="/school-logo.png"
              alt="Rising Foundation Academy logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#4A2C20]">
            Verify Result PIN
          </h1>

          <p className="mt-2 text-sm text-[#7A5038]">
            Enter your result PIN to access your published result.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-[#E5D5BD] bg-[#F7F1E7] p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#7A5038]">Student Name</span>
              <span className="text-right font-semibold text-[#2B211C]">
                {student.firstName} {student.lastName}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-[#7A5038]">Admission Number</span>
              <span className="text-right font-semibold text-[#2B211C]">
                {student.admissionNo}
              </span>
            </div>
          </div>
        </div>

        <form method="GET" className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="sessionId"
              className="mb-2 block text-sm font-semibold text-[#4A2C20]"
            >
              Academic Session
            </label>

            <select
              id="sessionId"
              name="sessionId"
              defaultValue={selectedSession?.id ?? ""}
              className="w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm text-[#2B211C] outline-none focus:border-[#4A2C20]"
            >
              {availableSessions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="term"
              className="mb-2 block text-sm font-semibold text-[#4A2C20]"
            >
              Term
            </label>

            <select
              id="term"
              name="term"
              defaultValue={selectedTerm}
              className="w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-sm text-[#2B211C] outline-none focus:border-[#4A2C20]"
            >
              {VALID_TERMS.map((term) => (
                <option key={term} value={term}>
                  {termLabel(term)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#4A2C20] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7A5038]"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 border-t border-[#E5D5BD] pt-6">
          <h2 className="text-lg font-bold text-[#4A2C20]">
            Enter Result PIN
          </h2>

          <PinVerificationForm
            sessionId={selectedSession?.id ?? ""}
            term={selectedTerm}
          />
        </div>

        <Link
          href="/student"
          className="mt-5 flex w-full items-center justify-center rounded-xl border border-[#C8A878] px-5 py-3 text-sm font-semibold text-[#4A2C20] hover:bg-[#F7F1E7]"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}