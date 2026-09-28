import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    enrollmentId: string;
  }>;
};

type ResultStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

async function updateResultStatus(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "PRINCIPAL"
  ) {
    redirect("/");
  }

  const enrollmentId = String(
    formData.get("enrollmentId") ?? "",
  );

  const action = String(formData.get("action") ?? "");

  if (!enrollmentId) {
    redirect("/admin/results");
  }

  if (!["APPROVE", "REJECT", "PUBLISH"].includes(action)) {
    redirect(`/admin/results/${enrollmentId}`);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id: enrollmentId,
    },
    include: {
      student: true,
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
    },
  });

  if (!enrollment) {
    redirect("/admin/results");
  }

  if (enrollment.results.length === 0) {
    redirect(`/admin/results/${enrollmentId}`);
  }

  const statuses = enrollment.results.map(
    (result) => result.status as ResultStatus,
  );

  /*
   * APPROVE
   *
   * Every subject result must be SUBMITTED.
   */
  if (action === "APPROVE") {
    const canApprove =
      statuses.length > 0 &&
      statuses.every((status) => status === "SUBMITTED");

    if (!canApprove) {
      redirect(`/admin/results/${enrollmentId}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.result.updateMany({
        where: {
          enrollmentId,
        },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          publishedAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          action: "APPROVE_RESULT",
          entity: "Enrollment",
          entityId: enrollmentId,
          details: {
            studentId: enrollment.studentId,
            sessionId: enrollment.sessionId,
            term: enrollment.term,
            resultCount: enrollment.results.length,
          },
        },
      });
    });
  }

  /*
   * REJECT / RETURN
   *
   * Submitted or approved results can be returned to the
   * teacher for correction.
   *
   * The teacher can then edit the rejected result and
   * submit it again.
   */
  if (action === "REJECT") {
    const canReject =
      statuses.length > 0 &&
      statuses.every(
        (status) =>
          status === "SUBMITTED" ||
          status === "APPROVED",
      );

    if (!canReject) {
      redirect(`/admin/results/${enrollmentId}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.result.updateMany({
        where: {
          enrollmentId,
        },
        data: {
          status: "REJECTED",
          approvedAt: null,
          publishedAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          action: "REJECT_RESULT",
          entity: "Enrollment",
          entityId: enrollmentId,
          details: {
            studentId: enrollment.studentId,
            sessionId: enrollment.sessionId,
            term: enrollment.term,
            resultCount: enrollment.results.length,
          },
        },
      });
    });
  }

  /*
   * PUBLISH
   *
   * Every subject result must already be APPROVED.
   */
  if (action === "PUBLISH") {
    const canPublish =
      statuses.length > 0 &&
      statuses.every((status) => status === "APPROVED");

    if (!canPublish) {
      redirect(`/admin/results/${enrollmentId}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.result.updateMany({
        where: {
          enrollmentId,
        },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          action: "PUBLISH_RESULT",
          entity: "Enrollment",
          entityId: enrollmentId,
          details: {
            studentId: enrollment.studentId,
            sessionId: enrollment.sessionId,
            term: enrollment.term,
            resultCount: enrollment.results.length,
          },
        },
      });
    });
  }

  revalidatePath("/admin/results");
  revalidatePath(`/admin/results/${enrollmentId}`);

  redirect(`/admin/results/${enrollmentId}`);
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

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatScore(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "APPROVED":
      return "Approved";
    case "PUBLISHED":
      return "Published";
    case "REJECTED":
      return "Returned for Correction";
    case "IN_REVIEW":
      return "In Review";
    default:
      return status;
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-gray-900 text-white";

    case "APPROVED":
      return "bg-green-100 text-green-800";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "SUBMITTED":
      return "bg-yellow-100 text-yellow-800";

    case "IN_REVIEW":
      return "bg-gray-200 text-gray-800";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getOverallStatus(
  statuses: ResultStatus[],
) {
  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "PUBLISHED")
  ) {
    return "PUBLISHED";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "APPROVED")
  ) {
    return "APPROVED";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "SUBMITTED")
  ) {
    return "SUBMITTED";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "REJECTED")
  ) {
    return "REJECTED";
  }

  if (
    statuses.some((status) => status === "SUBMITTED") ||
    statuses.some((status) => status === "APPROVED")
  ) {
    return "IN_REVIEW";
  }

  if (statuses.some((status) => status === "REJECTED")) {
    return "REJECTED";
  }

  return "DRAFT";
}

export default async function AdminStudentResultPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "PRINCIPAL"
  ) {
    redirect("/");
  }

  const { enrollmentId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id: enrollmentId,
    },
    include: {
      student: true,
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
          teacher: true,
        },
      },
      TermSummary: {
        include: {
          AffectiveRatingRecord: {
            orderBy: {
              item: "asc",
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    redirect("/admin/results");
  }

  if (enrollment.results.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
        <div className="mx-auto max-w-5xl p-6 lg:p-10">
          <Link
            href="/admin/results"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Results
          </Link>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              No Result Found
            </h1>

            <p className="mt-2 text-gray-500">
              This student does not have any result entries for
              this enrollment yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const student = enrollment.student;
  const schoolClass = enrollment.class;
  const summary = enrollment.TermSummary;

  const totalScores = enrollment.results
    .map((result) => Number(result.totalScore))
    .filter((value) => Number.isFinite(value));

  const overallTotal =
    totalScores.length > 0
      ? totalScores.reduce(
          (sum, value) => sum + value,
          0,
        )
      : null;

  const studentAverage =
    totalScores.length > 0
      ? totalScores.reduce(
          (sum, value) => sum + value,
          0,
        ) / totalScores.length
      : null;

  const performanceRate =
    summary?.performanceRate !== null &&
    summary?.performanceRate !== undefined
      ? Number(summary.performanceRate)
      : studentAverage;

  const currentStatuses = enrollment.results.map(
    (result) => result.status as ResultStatus,
  );

  const allPublished =
    currentStatuses.length > 0 &&
    currentStatuses.every(
      (status) => status === "PUBLISHED",
    );

  const allApproved =
    currentStatuses.length > 0 &&
    currentStatuses.every(
      (status) => status === "APPROVED",
    );

  const allSubmitted =
    currentStatuses.length > 0 &&
    currentStatuses.every(
      (status) => status === "SUBMITTED",
    );

  const hasSubmitted = currentStatuses.some(
    (status) => status === "SUBMITTED",
  );

  const hasApproved = currentStatuses.some(
    (status) => status === "APPROVED",
  );

  const hasRejected = currentStatuses.some(
    (status) => status === "REJECTED",
  );

  const canReject =
    !allPublished &&
    currentStatuses.length > 0 &&
    currentStatuses.every(
      (status) =>
        status === "SUBMITTED" ||
        status === "APPROVED",
    );

  const overallStatus =
    getOverallStatus(currentStatuses);

  const classAverage =
    summary?.classScoringAverage !== null &&
    summary?.classScoringAverage !== undefined
      ? Number(summary.classScoringAverage)
      : null;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
          <div>
            <Link
              href="/admin/results"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to Results
            </Link>

            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Student Result Review
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review the complete result before approving or
              publishing it.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
            <span className="text-gray-500">
              Reviewing as:
            </span>{" "}
            <span className="font-semibold">
              {session.user.role === "PRINCIPAL"
                ? "Principal"
                : "Administrator"}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm print:border-0 print:shadow-none">
          <section className="border-b-2 border-gray-900 px-6 py-8 text-center sm:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-900 text-2xl font-bold">
                RF
              </div>

              <h2 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
                Rising Foundation Academy
              </h2>

              <p className="mt-2 text-sm font-medium text-gray-600">
                School Address • Phone • Email
              </p>

              <div className="mt-6 inline-block border-2 border-gray-900 px-6 py-2">
                <h3 className="text-lg font-bold uppercase tracking-widest">
                  Student Report Sheet
                </h3>
              </div>

              <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-semibold">
                    Academic Session:
                  </span>{" "}
                  {enrollment.session.name}
                </div>

                <div>
                  <span className="font-semibold">
                    Term:
                  </span>{" "}
                  {formatTerm(enrollment.term)}
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-300 px-6 py-6 sm:px-10">
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField
                  label="Student Name"
                  value={`${student.firstName} ${
                    student.middleName
                      ? `${student.middleName} `
                      : ""
                  }${student.lastName}`}
                />

                <InfoField
                  label="Admission Number"
                  value={student.admissionNo}
                />

                <InfoField
                  label="Class"
                  value={schoolClass.name}
                />

                <InfoField
                  label="Arm / Stream"
                  value={
                    [
                      schoolClass.arm,
                      schoolClass.stream,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "—"
                  }
                />

                <InfoField
                  label="Gender"
                  value={
                    student.gender === "MALE"
                      ? "Male"
                      : student.gender === "FEMALE"
                        ? "Female"
                        : "—"
                  }
                />

                <InfoField
                  label="Date of Birth"
                  value={formatDate(
                    student.dateOfBirth,
                  )}
                />
              </div>

              <div className="flex justify-start md:justify-end">
                <div className="flex h-32 w-28 items-center justify-center border-2 border-gray-300 bg-gray-50 text-center text-xs text-gray-400">
                  Student
                  <br />
                  Photograph
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-300 bg-gray-50 px-6 py-4 sm:px-10">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Result Status
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  This status applies to the complete student
                  result.
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusClasses(
                  overallStatus,
                )}`}
              >
                {statusLabel(overallStatus)}
              </span>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-10">
            <div className="mb-4">
              <h3 className="text-lg font-bold">
                Academic Performance
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Subject-by-subject performance for this term.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-3 text-left font-bold">
                      Subject
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      CA 1
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      CA 2
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      CA Total
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      Exam
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      Total
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">
                      Grade
                    </th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-bold">
                      Remark
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {enrollment.results.map((result) => (
                    <tr key={result.id}>
                      <td className="border border-gray-300 px-3 py-3 font-medium">
                        <div>{result.subject.name}</div>

                        <div className="text-xs text-gray-400">
                          {result.subject.code}
                        </div>
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center">
                        {formatScore(result.ca1Score)}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center">
                        {formatScore(result.ca2Score)}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center">
                        {formatScore(result.caTotal)}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center">
                        {formatScore(result.examScore)}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center font-bold">
                        {formatScore(result.totalScore)}
                      </td>

                      <td className="border border-gray-300 px-3 py-3 text-center font-semibold">
                        {result.grade ?? "—"}
                      </td>

                      <td className="border border-gray-300 px-3 py-3">
                        {result.remark ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t border-gray-300 px-6 py-8 sm:px-10">
            <h3 className="mb-5 text-lg font-bold">
              Performance Summary
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="Overall Total"
                value={
                  overallTotal !== null
                    ? overallTotal.toFixed(1)
                    : "—"
                }
              />

              <SummaryCard
                label="Student Average"
                value={
                  studentAverage !== null
                    ? studentAverage.toFixed(1)
                    : "—"
                }
              />

              <SummaryCard
                label="Position"
                value={
                  summary?.position
                    ? `${summary.position}${
                        summary.positionOutOf
                          ? ` / ${summary.positionOutOf}`
                          : ""
                      }`
                    : "—"
                }
              />

              <SummaryCard
                label="Performance Rate"
                value={
                  performanceRate !== null
                    ? `${performanceRate.toFixed(1)}%`
                    : "—"
                }
              />

              <SummaryCard
                label="Class Scoring Average"
                value={
                  classAverage !== null
                    ? classAverage.toFixed(1)
                    : "—"
                }
              />

              <SummaryCard
                label="Subjects"
                value={String(
                  enrollment.results.length,
                )}
              />
            </div>
          </section>

          <section className="border-t border-gray-300 px-6 py-8 sm:px-10">
            <h3 className="mb-5 text-lg font-bold">
              Attendance
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Days School Opened"
                value={
                  enrollment.attendanceOpened !== null &&
                  enrollment.attendanceOpened !== undefined
                    ? String(
                        enrollment.attendanceOpened,
                      )
                    : "—"
                }
              />

              <SummaryCard
                label="Days Present"
                value={
                  enrollment.attendancePresent !== null &&
                  enrollment.attendancePresent !== undefined
                    ? String(
                        enrollment.attendancePresent,
                      )
                    : "—"
                }
              />

              <SummaryCard
                label="Days Absent"
                value={
                  enrollment.attendanceAbsent !== null &&
                  enrollment.attendanceAbsent !== undefined
                    ? String(
                        enrollment.attendanceAbsent,
                      )
                    : "—"
                }
              />

              <SummaryCard
                label="Attendance Percentage"
                value={
                  enrollment.attendancePercentage !== null &&
                  enrollment.attendancePercentage !== undefined
                    ? `${Number(
                        enrollment.attendancePercentage,
                      ).toFixed(1)}%`
                    : "—"
                }
              />
            </div>
          </section>

          <section className="border-t border-gray-300 px-6 py-8 sm:px-10">
            <h3 className="mb-5 text-lg font-bold">
              Affective & Behavioural Assessment
            </h3>

            {summary?.AffectiveRatingRecord &&
            summary.AffectiveRatingRecord.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.AffectiveRatingRecord.map(
                  (rating) => (
                    <div
                      key={rating.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <span className="text-sm font-medium">
                        {rating.item}
                      </span>

                      <span className="font-bold">
                        {rating.rating}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                No affective or behavioural assessment has
                been entered yet.
              </div>
            )}
          </section>

          <section className="border-t border-gray-300 px-6 py-8 sm:px-10">
            <h3 className="mb-5 text-lg font-bold">
              Comments
            </h3>

            <div className="grid gap-5 lg:grid-cols-2">
              <CommentBox
                label="Class Teacher's Comment"
                value={summary?.teacherComment}
              />

              <CommentBox
                label="Principal / Head Teacher's Comment"
                value={summary?.headTeacherComment}
              />
            </div>

            <div className="mt-5 max-w-md">
              <InfoField
                label="Next Term Begins"
                value={formatDate(
                  summary?.nextTermDate,
                )}
              />
            </div>
          </section>

          <section className="border-t border-gray-300 px-6 py-8 sm:px-10">
            <h3 className="mb-6 text-lg font-bold">
              Approval & Publication
            </h3>

            <div className="grid gap-6 md:grid-cols-3">
              <SignatureBox
                label="Class Teacher"
                signed={Boolean(
                  summary?.teacherSignedAt,
                )}
                date={summary?.teacherSignedAt}
              />

              <SignatureBox
                label="Principal / Head Teacher"
                signed={Boolean(
                  summary?.headTeacherSignedAt,
                )}
                date={summary?.headTeacherSignedAt}
              />

              <SignatureBox
                label="Published Result"
                signed={allPublished}
                date={
                  enrollment.results.find(
                    (result) => result.publishedAt,
                  )?.publishedAt
                }
              />
            </div>
          </section>

          <section className="border-t-2 border-gray-900 bg-gray-50 px-6 py-6 sm:px-10 print:hidden">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h3 className="font-bold">
                  {session.user.role === "PRINCIPAL"
                    ? "Principal Result Controls"
                    : "Admin Result Controls"}
                </h3>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Review the complete result before approving
                  or publishing it. A returned result can be
                  corrected by the teacher and submitted again.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {allSubmitted && !allPublished && (
                  <form action={updateResultStatus}>
                    <input
                      type="hidden"
                      name="enrollmentId"
                      value={enrollmentId}
                    />

                    <input
                      type="hidden"
                      name="action"
                      value="APPROVE"
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                    >
                      Approve Result
                    </button>
                  </form>
                )}

                {canReject && (
                  <form action={updateResultStatus}>
                    <input
                      type="hidden"
                      name="enrollmentId"
                      value={enrollmentId}
                    />

                    <input
                      type="hidden"
                      name="action"
                      value="REJECT"
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Return for Correction
                    </button>
                  </form>
                )}

                {allApproved && !allPublished && (
                  <form action={updateResultStatus}>
                    <input
                      type="hidden"
                      name="enrollmentId"
                      value={enrollmentId}
                    />

                    <input
                      type="hidden"
                      name="action"
                      value="PUBLISH"
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-gray-900 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
                    >
                      Publish Result
                    </button>
                  </form>
                )}

                {allPublished && (
                  <div className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white">
                    Result Published
                  </div>
                )}

                {!allPublished &&
                  !allApproved &&
                  !allSubmitted &&
                  !canReject &&
                  hasRejected && (
                    <div className="rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
                      Awaiting Teacher Correction
                    </div>
                  )}

                {!allPublished &&
                  !allApproved &&
                  !allSubmitted &&
                  !hasRejected &&
                  (hasSubmitted || hasApproved) && (
                    <div className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">
                      Result In Review
                    </div>
                  )}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 print:hidden">
          Rising Foundation Academy • Official Student Report
          Sheet
        </div>
      </div>
    </main>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function CommentBox({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">
        {label}
      </p>

      <div className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
        {value || "No comment entered yet."}
      </div>
    </div>
  );
}

function SignatureBox({
  label,
  signed,
  date,
}: {
  label: string;
  signed: boolean;
  date?: Date | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold">
        {label}
      </p>

      <div className="mt-10 border-t border-gray-300 pt-2">
        <p className="text-xs text-gray-500">
          {signed
            ? `Signed • ${formatDate(date)}`
            : "Not signed"}
        </p>
      </div>
    </div>
  );
}