import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ term?: string }>;
};

const TERMS = ["FIRST", "SECOND", "THIRD"] as const;

const AFFECTIVE_ITEMS = [
  "Attentiveness",
  "Neatness",
  "Cooperation",
  "Respect",
  "Leadership",
] as const;

function formatTerm(term: string) {
  return term.charAt(0) + term.slice(1).toLowerCase() + " Term";
}

function getClassLabel(classItem: {
  name: string;
  arm: string | null;
  stream: string | null;
}) {
  const parts = [classItem.name];

  if (classItem.arm) {
    parts.push(classItem.arm);
  }

  if (classItem.stream && classItem.stream !== classItem.arm) {
    parts.push(classItem.stream);
  }

  return parts.join(" ");
}

export default async function TeacherClassPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
    },
  });

  if (!teacher || !teacher.isActive) {
    redirect("/login");
  }

  if (!teacher.user.profileCompleted) {
    redirect("/teacher/setup");
  }

  const { classId } = await params;
  const { term: requestedTerm } = await searchParams;

  const term = TERMS.includes(requestedTerm as (typeof TERMS)[number])
    ? (requestedTerm as (typeof TERMS)[number])
    : "FIRST";

  const academicSession = await prisma.academicSession.findFirst({
    where: {
      isCurrent: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  if (!academicSession) {
    return (
      <main className="min-h-screen bg-school p-6">
        <div className="mx-auto max-w-6xl">
          <div className="school-card p-8 text-center">
            <h1 className="text-xl font-semibold text-primary">
              No Current Academic Session
            </h1>

            <p className="mt-2 text-sm text-muted">
              There is currently no active academic session.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const classRecord = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      classSubjects: {
        include: {
          subject: true,
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!classRecord || !classRecord.isActive) {
    redirect("/teacher");
  }

  const [subjectAssignments, classMasterAssignment] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.id,
        classId,
        sessionId: academicSession.id,
        term,
      },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    }),

    prisma.classMasterAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        sessionId: academicSession.id,
      },
    }),
  ]);

  const isLowerSchool =
    classRecord.section === "NURSERY" ||
    classRecord.section === "PRIMARY";

  const isJssOrSs =
    classRecord.section === "JSS" ||
    classRecord.section === "SS";

  const canAccessAsClassTeacher =
    isLowerSchool && Boolean(classMasterAssignment);

  const canAccessAsFormMaster =
    isJssOrSs && Boolean(classMasterAssignment);

  const canAccessAsSubjectTeacher =
    isJssOrSs && subjectAssignments.length > 0;

  if (
    !canAccessAsClassTeacher &&
    !canAccessAsFormMaster &&
    !canAccessAsSubjectTeacher
  ) {
    redirect("/teacher");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      sessionId: academicSession.id,
      term,
    },
    include: {
      student: true,

      results: {
        select: {
          id: true,
          subjectId: true,
          status: true,
          totalScore: true,
          grade: true,
        },
      },

      TermSummary: {
        select: {
          average: true,
          performanceRate: true,
          position: true,
          classTeacherComment: true,
          punctualityRating: true,
          AffectiveRatingRecord: {
            select: {
              item: true,
              rating: true,
            },
          },
        },
      },
    },

    orderBy: [
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
    ],
  });

  const classTeacherSubjects = classRecord.classSubjects.map(
    (classSubject) => classSubject.subject.name,
  );

  const expectedSubjectCount = classRecord.classSubjects.length;

  const students = enrollments.map((enrollment) => {
    const submittedResults = enrollment.results.filter(
      (result) =>
        result.status === "SUBMITTED" ||
        result.status === "APPROVED" ||
        result.status === "PUBLISHED",
    );

    const publishedResults = enrollment.results.filter(
      (result) => result.status === "PUBLISHED",
    );

    const resultCount = enrollment.results.length;

    const academicResultStatus =
      expectedSubjectCount === 0
        ? "Not Started"
        : resultCount === 0
          ? "Not Started"
          : resultCount >= expectedSubjectCount
            ? "Complete"
            : "In Progress";

    const recordedAffectiveItems =
      enrollment.TermSummary?.AffectiveRatingRecord.filter(
        (record) =>
          AFFECTIVE_ITEMS.includes(
            record.item as (typeof AFFECTIVE_ITEMS)[number],
          ) && record.rating > 0,
      ).length ?? 0;

    const hasAttendance =
      enrollment.attendanceOpened !== null &&
      enrollment.attendancePresent !== null &&
      enrollment.attendanceAbsent !== null;

    const hasPunctuality =
      enrollment.TermSummary?.punctualityRating !== null &&
      enrollment.TermSummary?.punctualityRating !== undefined;

    const hasAllAffectiveRatings =
      recordedAffectiveItems === AFFECTIVE_ITEMS.length;

    const hasFormMasterData =
      hasAttendance ||
      hasPunctuality ||
      hasAllAffectiveRatings ||
      Boolean(enrollment.TermSummary?.classTeacherComment?.trim());

    const formMasterComplete =
      hasAttendance &&
      hasPunctuality &&
      hasAllAffectiveRatings;

    const formMasterStatus =
      !hasFormMasterData
        ? "Not Started"
        : formMasterComplete
          ? "Completed"
          : "In Progress";

    return {
      id: enrollment.student.id,
      enrollmentId: enrollment.id,
      admissionNo: enrollment.student.admissionNo,

      name: [
        enrollment.student.firstName,
        enrollment.student.middleName,
        enrollment.student.lastName,
      ]
        .filter(Boolean)
        .join(" "),

      resultCount,
      submittedCount: submittedResults.length,
      publishedCount: publishedResults.length,

      academicResultStatus,
      formMasterStatus,

      average: enrollment.TermSummary?.average
        ? Number(enrollment.TermSummary.average)
        : null,

      performanceRate: enrollment.TermSummary?.performanceRate
        ? Number(enrollment.TermSummary.performanceRate)
        : null,

      position: enrollment.TermSummary?.position ?? null,
    };
  });

  const completedStudents = students.filter((student) => {
    if (isLowerSchool) {
      return (
        student.resultCount >= expectedSubjectCount &&
        expectedSubjectCount > 0
      );
    }

    return student.resultCount >= expectedSubjectCount;
  }).length;

  let statusLabel = "Subject Teacher";

  if (canAccessAsClassTeacher) {
    statusLabel = "Class Teacher";
  } else if (canAccessAsFormMaster && !canAccessAsSubjectTeacher) {
    statusLabel = "Form Master";
  } else if (
    canAccessAsFormMaster &&
    canAccessAsSubjectTeacher
  ) {
    statusLabel = "Subject Teacher + Form Master";
  }

  return (
    <main className="min-h-screen bg-school">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/teacher"
              className="mb-3 inline-flex items-center text-sm font-medium text-secondary transition hover:text-primary"
            >
              ← Back to Teacher Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-primary">
              {getClassLabel(classRecord)}
            </h1>

            <p className="mt-1 text-sm text-muted">
              {academicSession.name} · {formatTerm(term)} · {statusLabel}
            </p>
          </div>

          {/* Term Selector */}
          <div className="flex flex-wrap gap-2">
            {TERMS.map((termOption) => (
              <Link
                key={termOption}
                href={`/teacher/class/${classId}?term=${termOption}`}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  term === termOption
                    ? "border-primary bg-primary text-white"
                    : "border-school bg-surface text-secondary hover:bg-school"
                }`}
              >
                {formatTerm(termOption)}
              </Link>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="school-card p-5">
            <p className="text-sm text-muted">Students</p>

            <p className="mt-1 text-2xl font-bold text-primary">
              {students.length}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">Subjects</p>

            <p className="mt-1 text-2xl font-bold text-primary">
              {expectedSubjectCount}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">
              Students With Complete Results
            </p>

            <p className="mt-1 text-2xl font-bold text-primary">
              {completedStudents}
            </p>
          </div>

          <div className="school-card p-5">
            <p className="text-sm text-muted">Your Role</p>

            <p className="mt-1 text-lg font-bold text-primary">
              {statusLabel}
            </p>
          </div>
        </div>

        {/* Lower School Class Teacher Section */}
        {isLowerSchool && canAccessAsClassTeacher && (
          <section className="school-card mb-6">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-lg font-semibold text-primary">
                Class Subjects
              </h2>

              <p className="mt-1 text-sm text-muted">
                As the Class Teacher, you can enter the complete result
                for each student across all subjects.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {classTeacherSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-school px-3 py-1 text-xs font-medium text-secondary"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* JSS / SS Subject Assignments */}
        {isJssOrSs && subjectAssignments.length > 0 && (
          <section className="school-card mb-6">
            <div className="border-b border-school px-6 py-5">
              <h2 className="text-lg font-semibold text-primary">
                Your Subject Assignments
              </h2>

              <p className="mt-1 text-sm text-muted">
                You can enter results only for the subjects assigned to
                you.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 px-6 py-5">
              {subjectAssignments.map((assignment) => (
                <span
                  key={assignment.id}
                  className="rounded-lg border border-school bg-school px-3 py-2 text-sm font-medium text-secondary"
                >
                  {assignment.subject.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Students */}
        <section className="school-card overflow-hidden">
          <div className="border-b border-school px-6 py-5">
            <h2 className="text-lg font-semibold text-primary">
              Students
            </h2>

            <p className="mt-1 text-sm text-muted">
              {canAccessAsFormMaster
                ? "Monitor academic result completion and complete each student's Form Master assessment."
                : "Select a student to continue with result entry or class duties."}
            </p>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-primary">
                No students enrolled
              </p>

              <p className="mt-1 text-sm text-muted">
                There are no students enrolled in this class for{" "}
                {formatTerm(term).toLowerCase()}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-school">
              {students.map((student, index) => {
                const academicStatusClass =
                  student.academicResultStatus === "Complete"
                    ? "bg-success text-white"
                    : student.academicResultStatus === "In Progress"
                      ? "bg-warning text-white"
                      : "bg-school text-muted";

                const formMasterStatusClass =
                  student.formMasterStatus === "Completed"
                    ? "bg-success text-white"
                    : student.formMasterStatus === "In Progress"
                      ? "bg-warning text-white"
                      : "bg-school text-muted";

                return (
                  <div
                    key={student.enrollmentId}
                    className="flex flex-col gap-5 px-6 py-5 transition hover:bg-school lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-semibold text-primary">
                          {student.name}
                        </h3>

                        <p className="mt-1 text-sm text-muted">
                          Admission No: {student.admissionNo}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                          Academic Results
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${academicStatusClass}`}
                          >
                            {student.academicResultStatus}
                          </span>

                          <span className="text-sm text-muted">
                            {student.resultCount} / {expectedSubjectCount}{" "}
                            subjects
                          </span>
                        </div>
                      </div>

                      {canAccessAsFormMaster && (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Form Master
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${formMasterStatusClass}`}
                          >
                            {student.formMasterStatus}
                          </span>
                        </div>
                      )}

                      {isLowerSchool &&
                      canAccessAsClassTeacher ? (
                        <Link
                          href={`/teacher/class/${classId}/student/${student.id}?term=${term}`}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary"
                        >
                          Open Result
                        </Link>
                      ) : canAccessAsFormMaster ? (
                        <Link
                          href={`/teacher/class/${classId}/student/${student.id}?term=${term}`}
                          className="rounded-lg border border-school bg-surface px-4 py-2 text-sm font-medium text-secondary transition hover:bg-school"
                        >
                          Open Student
                        </Link>
                      ) : (
                        <span className="rounded-lg bg-school px-4 py-2 text-sm font-medium text-muted">
                          Assigned Subject
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}