import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResultEntryForm from "./ResultEntryForm";

type TeacherResultsPageProps = {
  searchParams: Promise<{
    assignmentId?: string;
  }>;
};

export default async function TeacherResultsPage({
  searchParams,
}: TeacherResultsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const teacherId = session.user.teacherId;

  if (!teacherId) {
    return (
      <main className="min-h-screen bg-school p-8">
        <div className="school-card mx-auto max-w-2xl p-8">
          <h1 className="text-xl font-bold text-danger">
            Teacher profile not found
          </h1>

          <p className="mt-2 text-muted">
            Your account is marked as a teacher, but no teacher profile is
            linked to it.
          </p>

          <Link
            href="/teacher"
            className="school-button mt-6 inline-block px-4 py-2 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { assignmentId } = await searchParams;

  if (!assignmentId) {
    redirect("/teacher");
  }

  const currentSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
  });

  if (!currentSession) {
    return (
      <main className="min-h-screen bg-school p-8">
        <div className="school-card mx-auto max-w-2xl p-8">
          <h1 className="text-xl font-bold text-primary">
            No current academic session
          </h1>

          <p className="mt-2 text-muted">
            An active academic session needs to be configured before results
            can be entered.
          </p>
        </div>
      </main>
    );
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      id: assignmentId,
      teacherId,
      sessionId: currentSession.id,
    },
    include: {
      class: true,
      subject: true,
    },
  });

  if (!assignment) {
    return (
      <main className="min-h-screen bg-school p-8">
        <div className="school-card mx-auto max-w-2xl p-8">
          <h1 className="text-xl font-bold text-danger">
            Assignment not found
          </h1>

          <p className="mt-2 text-muted">
            This assignment does not exist, is not part of the current
            academic session, or is not assigned to you.
          </p>

          <Link
            href="/teacher"
            className="school-button mt-6 inline-block px-4 py-2 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: assignment.classId,
      sessionId: assignment.sessionId,
      term: assignment.term,
    },
    include: {
      student: true,
    },
    orderBy: {
      student: {
        lastName: "asc",
      },
    },
  });

  const existingResults = await prisma.result.findMany({
    where: {
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      sessionId: assignment.sessionId,
      term: assignment.term,
    },
    select: {
      studentId: true,
      ca1Score: true,
      ca2Score: true,
      caTotal: true,
      examScore: true,
      totalScore: true,
      grade: true,
      remark: true,
      teacherRemark: true,
      status: true,
    },
  });

  const resultMap = new Map(
    existingResults.map((result) => [result.studentId, result]),
  );

  const students = enrollments.map((enrollment) => {
    const result = resultMap.get(enrollment.studentId);

    return {
      studentId: enrollment.studentId,
      admissionNo: enrollment.student.admissionNo,
      name: `${enrollment.student.firstName}${
        enrollment.student.middleName
          ? ` ${enrollment.student.middleName}`
          : ""
      } ${enrollment.student.lastName}`,
      ca1: result?.ca1Score?.toString() ?? "",
      ca2: result?.ca2Score?.toString() ?? "",
      exam: result?.examScore?.toString() ?? "",
      teacherRemark: result?.teacherRemark ?? "",
      status: result?.status ?? "NOT_ENTERED",
    };
  });

  const termLabel =
    assignment.term === "FIRST"
      ? "First Term"
      : assignment.term === "SECOND"
        ? "Second Term"
        : "Third Term";

  return (
    <main className="min-h-screen bg-school">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <Link
                href="/teacher"
                className="text-secondary transition hover:text-primary"
              >
                Teacher Dashboard
              </Link>

              <span>/</span>

              <span>Result Entry</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Result Entry
            </h1>

            <p className="mt-1 text-secondary">
              Enter student scores and teacher remarks for the assigned
              subject.
            </p>
          </div>

          <Link
            href="/teacher"
            className="inline-flex w-fit items-center rounded-lg border border-school bg-surface px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-school"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Assignment */}
        <section className="school-card mb-6 overflow-hidden">
          <div className="border-b border-school px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Assigned Result
                </p>

                <h2 className="mt-1 text-2xl font-bold text-primary">
                  {assignment.subject.name}
                </h2>

                <p className="mt-1 text-sm text-secondary">
                  {assignment.subject.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-school px-4 py-3">
                  <p className="text-xs font-medium text-muted">
                    Class
                  </p>

                  <p className="mt-1 text-sm font-bold text-primary">
                    {assignment.class.name}
                  </p>
                </div>

                <div className="rounded-lg bg-school px-4 py-3">
                  <p className="text-xs font-medium text-muted">
                    Term
                  </p>

                  <p className="mt-1 text-sm font-bold text-primary">
                    {termLabel}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg bg-school px-4 py-3 md:col-span-1">
                  <p className="text-xs font-medium text-muted">
                    Academic Session
                  </p>

                  <p className="mt-1 text-sm font-bold text-primary">
                    {currentSession.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Marking Scheme */}
          <div className="border-b border-school px-6 py-5">
            <div className="mb-3">
              <p className="text-sm font-semibold text-primary">
                Marking Scheme
              </p>

              <p className="mt-1 text-xs text-muted">
                CA contributes 40 marks and examination contributes 60 marks.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:max-w-xl">
              <div className="rounded-lg border border-school bg-surface px-4 py-3">
                <p className="text-xs text-muted">
                  CA 1
                </p>

                <p className="mt-1 text-lg font-bold text-primary">
                  20
                </p>
              </div>

              <div className="rounded-lg border border-school bg-surface px-4 py-3">
                <p className="text-xs text-muted">
                  CA 2
                </p>

                <p className="mt-1 text-lg font-bold text-primary">
                  20
                </p>
              </div>

              <div className="rounded-lg border border-school bg-surface px-4 py-3">
                <p className="text-xs text-muted">
                  Examination
                </p>

                <p className="mt-1 text-lg font-bold text-primary">
                  60
                </p>
              </div>
            </div>
          </div>

          {/* Student Results */}
          {enrollments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <h3 className="text-lg font-bold text-primary">
                No students enrolled
              </h3>

              <p className="mt-2 text-sm text-muted">
                There are currently no students enrolled in this class for
                this term.
              </p>
            </div>
          ) : (
            <ResultEntryForm
              assignmentId={assignment.id}
              students={students}
            />
          )}
        </section>
      </div>
    </main>
  );
}