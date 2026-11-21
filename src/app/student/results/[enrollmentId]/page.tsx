import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function termLabel(term: string) {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  if (term === "THIRD") return "Third Term";
  return term;
}

function text(input: unknown): string {
  if (input === null || input === undefined || input === "") return "—";

  if (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return String(input);
  }

  if (input instanceof Date) return input.toLocaleDateString();

  return String(input);
}

function numberText(input: unknown, digits = 2): string {
  if (input === null || input === undefined || input === "") return "—";

  const value = Number(input);

  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function dateText(input: unknown): string {
  if (!input) return "—";

  const date = new Date(String(input));

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function gradeFor(total: number): string {
  if (total >= 75) return "A";
  if (total >= 65) return "B";
  if (total >= 55) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

function gradeClass(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "C":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "D":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "E":
      return "bg-red-100 text-red-700 border-red-200";
    case "F":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function nextResumptionDate(
  term: string,
  academicSession: Record<string, unknown>,
) {
  switch (term) {
    case "FIRST":
      return academicSession.secondTermResumptionDate ?? null;

    case "SECOND":
      return academicSession.thirdTermResumptionDate ?? null;

    case "THIRD":
      return academicSession.firstTermResumptionDate ?? null;

    default:
      return null;
  }
}

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/student");
  }

  const { enrollmentId } = await params;

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
  });

  if (!student) redirect("/student");

  const cookieStore = await cookies();
  const resultPinId = cookieStore.get("result_pin_access")?.value;

  if (!resultPinId) redirect("/student/results");

  const verifiedPin = await prisma.resultPin.findFirst({
    where: {
      id: resultPinId,
      studentId: student.id,
      isActive: true,
    },
    select: {
      id: true,
      studentId: true,
      sessionId: true,
      term: true,
      maxUses: true,
      usedCount: true,
    },
  });

  if (!verifiedPin || verifiedPin.usedCount > verifiedPin.maxUses) {
    redirect("/student/results");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      studentId: student.id,
      sessionId: verifiedPin.sessionId,
      term: verifiedPin.term,
    },
    include: {
      student: true,
      class: true,
      session: true,
      TermSummary: {
        include: {
          AffectiveRatingRecord: {
            orderBy: { item: "asc" },
          },
        },
      },
    },
  });

  if (!enrollment) redirect("/student/results");

  const allResults = await prisma.result.findMany({
    where: {
      enrollmentId: enrollment.id,
      studentId: student.id,
      sessionId: verifiedPin.sessionId,
      term: verifiedPin.term,
    },
    include: {
      subject: true,
      teacher: true,
    },
    orderBy: {
      subject: { name: "asc" },
    },
  });

  const results = allResults.filter(
    (result) => result.status === "PUBLISHED",
  );

  if (results.length === 0) redirect("/student/results");

  const allResultsPublished =
    allResults.length > 0 &&
    allResults.every((result) => result.status === "PUBLISHED");

  const studentName = [
    enrollment.student.firstName,
    enrollment.student.middleName,
    enrollment.student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const classRecord = enrollment.class as unknown as {
    name?: unknown;
    arm?: unknown;
    stream?: unknown;
  };

  const className = [
    text(classRecord.name),
    classRecord.arm ? text(classRecord.arm) : "",
  ]
    .filter(Boolean)
    .join(" ");

  const streamName = classRecord.stream
    ? text(classRecord.stream)
    : "—";

  const summary = enrollment.TermSummary;
  const summaryRecord = Array.isArray(summary) ? summary[0] : summary;

  const summaryData =
    summaryRecord as unknown as Record<string, unknown> | null;

  const classTeacherSignature =
    summaryData?.classTeacherSignatureData ?? null;

  const resultRows = results.map((result) => {
    const raw = result as unknown as Record<string, unknown>;

    const ca = Number(
      raw.caTotal ?? raw.caScore ?? raw.ca ?? raw.ca1Score ?? 0,
    );

    const exam = Number(raw.examScore ?? raw.exam ?? 0);

    const rawTotal = Number(
      raw.totalScore ?? raw.total ?? ca + exam,
    );

    const total = Number.isFinite(rawTotal)
      ? rawTotal
      : ca + exam;

    const grade =
      typeof raw.grade === "string"
        ? raw.grade
        : gradeFor(total);

    const teacher = raw.teacher as
      | Record<string, unknown>
      | null
      | undefined;

    const signature =
      raw.teacherSignatureSnapshotUrl ??
      raw.teacherSignature ??
      teacher?.signatureData ??
      teacher?.signatureUrl ??
      classTeacherSignature ??
      null;

    return {
      result,
      ca,
      exam,
      total,
      grade,
      position: raw.position ?? raw.subjectPosition ?? null,
      remark: raw.teacherRemark ?? raw.remark ?? null,
      signature,
    };
  });

  const totalScore = resultRows.reduce(
    (sum, row) => sum + row.total,
    0,
  );

  const studentAverage =
    resultRows.length > 0
      ? totalScore / resultRows.length
      : 0;

  const summaryAverage =
    summaryData?.average ??
    summaryData?.studentAverage ??
    summaryData?.averageScore ??
    null;

  const performanceRate =
    summaryData?.performanceRate ??
    summaryData?.performance ??
    null;

  const position =
    summaryData?.position ??
    summaryData?.overallPosition ??
    null;

  const positionOutOf =
    summaryData?.positionOutOf ??
    summaryData?.totalStudents ??
    null;

  const attendanceOpened = enrollment.attendanceOpened;
  const attendancePresent = enrollment.attendancePresent;
  const attendanceAbsent = enrollment.attendanceAbsent;
  const attendanceLate = null;

  const affectiveRatings =
    summaryData &&
    Array.isArray(summaryData.AffectiveRatingRecord)
      ? (summaryData.AffectiveRatingRecord as Array<
          Record<string, unknown>
        >)
      : [];

  const studentRecord =
    enrollment.student as unknown as Record<string, unknown>;

  const studentPhoto = text(
    studentRecord.photoData ?? studentRecord.photoUrl,
  );

  const academicSessionRecord =
    enrollment.session as unknown as Record<string, unknown>;

  const nextTermDate = nextResumptionDate(
    text(enrollment.term),
    academicSessionRecord,
  );

  const classTeacherComment =
    summaryData?.classTeacherComment ??
    summaryData?.teacherComment ??
    null;

  const principalComment =
    summaryData?.headTeacherComment ??
    summaryData?.principalRemark ??
    summaryData?.generalRemark ??
    null;

  // The principal's signature is saved in TermSummary
  // when the principal approves the result.
  const principalSignature =
    summaryData?.headTeacherSignatureData ??
    summaryData?.principalSignatureData ??
    summaryData?.principalSignatureUrl ??
    summaryData?.principalSignature ??
    null;

  const classAverage = summaryData?.classScoringAverage ?? null;

  // Use the publication timestamp saved on a published result.
  // updatedAt is only a fallback if the record has no publishedAt.
  const publishedDates = results
    .map((result) => {
      const raw = result as unknown as Record<string, unknown>;

      return raw.publishedAt ?? raw.updatedAt ?? null;
    })
    .filter(Boolean)
    .map((value) => new Date(String(value)))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const publicationDate =
    publishedDates.length > 0
      ? publishedDates[0]
      : null;

  const publicationDateLabel = publicationDate
    ? dateText(publicationDate)
    : "DATE NOT RECORDED";

  return (
    <>
      <div className="result-page min-h-screen bg-slate-100 text-slate-900">
        <div className="result-page-inner mx-auto py-6">
          <div className="result-sheet overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            {/* HEADER */}
            <div className="bg-slate-900 px-6 py-7 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/school-logo.png"
                      alt="Rising Foundation Academy Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-2xl font-black tracking-wide">
                      RISING FOUNDATION ACADEMY
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-300">
                      Student Academic Report
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider">
                    {text(enrollment.session.name)}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider">
                    {termLabel(text(enrollment.term))}
                  </span>
                  <span className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold uppercase tracking-wider">
                    Published
                  </span>
                </div>
              </div>
            </div>

            {/* STUDENT INFORMATION */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="grid grid-cols-[1fr_125px] gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-7 w-1 rounded-full bg-slate-900" />
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                      Student Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Student Name", studentName],
                      ["Admission Number", enrollment.student.admissionNo],
                      ["Class", className],
                      ["Stream / Arm", streamName],
                      ["Academic Session", enrollment.session.name],
                      ["Term", termLabel(text(enrollment.term))],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {text(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="h-36 w-28 overflow-hidden rounded-xl border-4 border-white bg-slate-200 shadow-md">
                    {studentPhoto !== "—" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={studentPhoto}
                        alt={text(studentName)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                        PASSPORT
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PERFORMANCE SUMMARY */}
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-7 w-1 rounded-full bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Performance Summary
                </h2>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  [
                    "Student Average",
                    numberText(summaryAverage ?? studentAverage),
                  ],
                  ["Class Average", numberText(classAverage)],
                  [
                    "Performance Rate",
                    `${numberText(performanceRate ?? studentAverage)}%`,
                  ],
                  [
                    "Overall Position",
                    position
                      ? `${text(position)}${
                          positionOutOf
                            ? ` / ${text(positionOutOf)}`
                            : ""
                        }`
                      : "—",
                  ],
                  ["Subjects", String(results.length)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE */}
            <div className="px-6 pb-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-1 rounded-full bg-slate-900" />
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                    Academic Performance
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {String(results.length)} Subjects
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full table-fixed border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      {[
                        "#",
                        "Subject",
                        "CA",
                        "Exam",
                        "Total",
                        "Grade",
                        "Position",
                        "Teacher Remark",
                        "Subject Master Sign",
                      ].map((heading, index) => (
                        <th
                          key={heading}
                          className={`border-r border-white/10 px-1.5 py-2 text-center text-[8px] font-bold uppercase tracking-wide last:border-r-0 ${
                            index === 1 || index === 7
                              ? "text-left"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {resultRows.map((row, index) => {
                      const signature = text(row.signature);

                      return (
                        <tr
                          key={String(row.result.id)}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="border-t border-slate-200 px-1.5 py-2 text-center font-bold text-slate-500">
                            {index + 1}
                          </td>

                          <td className="border-t border-slate-200 px-1.5 py-2 font-bold text-slate-800">
                            {text(row.result.subject.name)}
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center font-semibold">
                            {numberText(row.ca)}
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center font-semibold">
                            {numberText(row.exam)}
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center font-black text-slate-900">
                            {numberText(row.total)}
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center">
                            <span
                              className={`inline-flex items-center justify-center rounded border px-1.5 py-1 text-[9px] font-black ${gradeClass(
                                text(row.grade),
                              )}`}
                            >
                              {text(row.grade)}
                            </span>
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center font-semibold">
                            {text(row.position)}
                          </td>

                          <td className="border-t border-slate-200 px-1.5 py-2 text-slate-600">
                            {text(row.remark)}
                          </td>

                          <td className="border-t border-slate-200 px-1 py-2 text-center">
                            {signature !== "—" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={signature}
                                alt="Teacher signature"
                                className="mx-auto h-7 max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLASS TEACHER COMMENT */}
            <div className="border-y border-slate-200 bg-slate-50 px-6 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-7 w-1 rounded-full bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Class Teacher's Comment
                </h2>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="min-h-8 text-xs leading-6 text-slate-700">
                  {text(classTeacherComment)}
                </p>

                {text(classTeacherSignature) !== "—" && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={text(classTeacherSignature)}
                      alt="Class teacher signature"
                      className="h-9 max-w-36 object-contain"
                    />
                    <p className="mt-1 text-[9px] text-slate-400">
                      Class Teacher's Signature
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ATTENDANCE */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-7 w-1 rounded-full bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Attendance Record
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  ["School Opened", attendanceOpened],
                  ["Present", attendancePresent],
                  ["Absent", attendanceAbsent],
                  ["Late", attendanceLate],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      {text(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AFFECTIVE ASSESSMENT */}
            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-7 w-1 rounded-full bg-slate-900" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Affective Assessment
                </h2>
              </div>

              {affectiveRatings.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {affectiveRatings.map((item, index) => (
                    <div
                      key={String(item.id ?? index)}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <p className="text-xs font-bold text-slate-700">
                        {text(item.item ?? item.name ?? "Assessment")}
                      </p>
                      <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                        {text(item.rating ?? item.value ?? item.score)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-400">
                  No affective assessment recorded.
                </div>
              )}
            </div>

            {/* PRINCIPAL COMMENT AND RESUMPTION DATE */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Principal / Head Teacher's Remark
                </p>
                <p className="mt-2 min-h-12 text-xs leading-6 text-slate-700">
                  {text(principalComment)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  NEXT TERM RESUMES
                </p>
                <p className="mt-2 text-xl font-black text-slate-900">
                  {dateText(nextTermDate)}
                </p>
              </div>
            </div>

            {/* SIGNATURES AND APPROVAL SEAL */}
            <div className="px-6 py-5">
              <div className="mb-5 flex justify-center">
                {allResultsPublished && (
                  <div
                    className="flex h-28 w-28 items-center justify-center bg-emerald-700 text-white shadow-lg"
                    style={{
                      clipPath:
                        "polygon(50% 0%,57% 5%,65% 2%,70% 10%,79% 9%,82% 18%,91% 21%,90% 30%,98% 37%,94% 45%,100% 53%,94% 61%,98% 69%,90% 76%,91% 85%,82% 88%,79% 97%,70% 95%,65% 100%,57% 95%,50% 100%,43% 95%,35% 100%,30% 95%,21% 97%,18% 88%,9% 85%,10% 76%,2% 69%,6% 61%,0% 53%,6% 45%,2% 37%,10% 30%,9% 21%,18% 18%,21% 9%,30% 10%,35% 2%,43% 5%)",
                    }}
                  >
                    <div className="flex h-[82%] w-[82%] flex-col items-center justify-center rounded-full border-2 border-dashed border-white/80 text-center">
                      <div className="text-3xl font-black leading-none">
                        ✓
                      </div>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest">
                        Officially
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        Approved
                      </p>
                      <p className="mt-1 text-[6px] font-bold uppercase tracking-widest">
                        Rising Foundation Academy
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-10">
                {/* PRINCIPAL SIGNATURE */}
                <div>
                  <div className="mb-6 flex h-10 items-end justify-center">
                    {text(principalSignature) !== "—" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={text(principalSignature)}
                        alt="Principal signature"
                        className="h-9 max-w-36 object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="border-t border-slate-400 pt-2 text-center">
                    <p className="text-xs font-black text-slate-800">
                      Principal / Head of School
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">
                      Signature
                    </p>
                  </div>
                </div>

                {/* OFFICIAL SCHOOL STAMP */}
                <div className="flex flex-col items-center justify-center">
                  <div className="school-stamp">
                    <svg
                      viewBox="0 0 200 200"
                      className="school-stamp-svg"
                      role="img"
                      aria-label={`Rising Foundation Academy official stamp, published ${publicationDateLabel}`}
                    >
                      <defs>
                        <path
                          id="school-stamp-top-curve"
                          d="M 32,100 A 68,68 0 0,1 168,100"
                        />
                        <path
                          id="school-stamp-bottom-curve"
                          d="M 168,105 A 68,68 0 0,1 32,105"
                        />
                      </defs>

                      <circle
                        cx="100"
                        cy="100"
                        r="94"
                        fill="white"
                        stroke="#1e3a5f"
                        strokeWidth="4"
                      />

                      <circle
                        cx="100"
                        cy="100"
                        r="82"
                        fill="none"
                        stroke="#1e3a5f"
                        strokeWidth="1.8"
                      />

                      <text className="stamp-curved-text">
                        <textPath
                          href="#school-stamp-top-curve"
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          RISING FOUNDATION ACADEMY
                        </textPath>
                      </text>

                      <text className="stamp-bottom-text">
                        <textPath
                          href="#school-stamp-bottom-curve"
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          OFFICIAL SCHOOL STAMP
                        </textPath>
                      </text>

                      <circle
                        cx="100"
                        cy="100"
                        r="48"
                        fill="none"
                        stroke="#1e3a5f"
                        strokeWidth="2"
                      />

                      <text
                        x="100"
                        y="85"
                        textAnchor="middle"
                        className="stamp-centre-heading"
                      >
                        RESULT
                      </text>

                      <text
                        x="100"
                        y="105"
                        textAnchor="middle"
                        className="stamp-centre-heading"
                      >
                        PUBLISHED
                      </text>

                      <text
                        x="100"
                        y="124"
                        textAnchor="middle"
                        className="stamp-date"
                      >
                        {publicationDate
                          ? publicationDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "DATE N/A"}
                      </text>
                    </svg>
                  </div>

                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                    Official School Stamp
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 bg-slate-900 px-6 py-4 text-center text-[9px] text-slate-400">
              <p className="font-semibold text-slate-300">
                RISING FOUNDATION ACADEMY
              </p>
              <p className="mt-1">
                Official Student Academic Report •{" "}
                {text(enrollment.session.name)} •{" "}
                {termLabel(text(enrollment.term))}
              </p>
            </div>
          </div>

          {/* BACK LINK ONLY - NO PRINT BUTTON */}
          <div className="mt-5 flex justify-start screen-only">
            <Link
              href="/student/results"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back to Results
            </Link>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
            }

            .result-page-inner {
              width: 210mm;
              max-width: 100%;
              margin-left: auto;
              margin-right: auto;
            }

            .result-sheet {
              width: 210mm;
              min-height: 297mm;
              background: white;
            }

            .school-stamp {
              width: 112px;
              height: 112px;
              flex-shrink: 0;
            }

            .school-stamp-svg {
              width: 100%;
              height: 100%;
              display: block;
            }

            .stamp-curved-text,
            .stamp-bottom-text {
              fill: #1e3a5f;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 1px;
            }

            .stamp-centre-heading {
              fill: #1e3a5f;
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 1px;
            }

            .stamp-date {
              fill: #1e3a5f;
              font-size: 9px;
              font-weight: 800;
            }

            /*
             * Keep the desktop arrangement on smaller screens.
             * The complete A4-width sheet scales down instead of
             * changing its columns or rearranging its sections.
             */
            @media screen and (max-width: 800px) {
              .result-page-inner {
                width: 210mm;
                max-width: none;
                margin: 0;
                zoom: calc(100vw / 793.7px);
              }

              .result-page {
                overflow-x: hidden;
              }

              .result-sheet {
                width: 210mm;
                min-height: 297mm;
                border-radius: 0;
              }

              .screen-only {
                display: none;
              }
            }

            @media screen and (min-width: 801px) {
              .result-page-inner {
                padding-top: 20px;
                padding-bottom: 20px;
              }
            }

            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }

              html,
              body {
                width: 210mm;
                min-height: 297mm;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }

              .result-page {
                min-height: 0 !important;
                background: white !important;
              }

              .result-page-inner {
                width: 210mm !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .result-sheet {
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }

              .screen-only {
                display: none !important;
              }

              table {
                page-break-inside: auto;
              }

              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }

              img {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          `,
        }}
      />
    </>
  );
}