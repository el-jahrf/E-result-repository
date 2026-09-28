import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentPrintButton from "../StudentPrintButton";

function termLabel(term: string): string {
  if (term === "FIRST") return "First Term";
  if (term === "SECOND") return "Second Term";
  if (term === "THIRD") return "Third Term";
  return term;
}

function text(input: unknown): string {
  if (input === null || input === undefined) return "—";

  if (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return String(input);
  }

  if (input instanceof Date) {
    return input.toLocaleDateString();
  }

  return String(input);
}

function numberText(input: unknown, digits = 2): string {
  if (input === null || input === undefined || input === "") {
    return "—";
  }

  const number = Number(input);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(digits);
}

function dateText(input: unknown): string {
  if (!input) return "—";

  const date = new Date(String(input));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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
    where: {
      userId: session.user.id,
    },
  });

  if (!student) {
    redirect("/student");
  }

  const cookieStore = await cookies();
  const resultPinId = cookieStore.get("result_pin_access")?.value;

  if (!resultPinId) {
    redirect("/student/results");
  }

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

  if (!verifiedPin) {
    redirect("/student/results");
  }

  if (verifiedPin.usedCount > verifiedPin.maxUses) {
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
            orderBy: {
              item: "asc",
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    redirect("/student/results");
  }

  if (
    enrollment.sessionId !== verifiedPin.sessionId ||
    enrollment.term !== verifiedPin.term
  ) {
    redirect("/student/results");
  }

  const results = await prisma.result.findMany({
    where: {
      enrollmentId: enrollment.id,
      studentId: student.id,
      sessionId: verifiedPin.sessionId,
      term: verifiedPin.term,
      status: "PUBLISHED",
    },
    include: {
      subject: true,
      teacher: true,
    },
    orderBy: {
      subject: {
        name: "asc",
      },
    },
  });

  if (results.length === 0) {
    redirect("/student/results");
  }

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

  const resultRows = results.map((result) => {
    const raw = result as unknown as Record<string, unknown>;

    const ca = Number(
      raw.caTotal ??
        raw.caScore ??
        raw.ca ??
        raw.ca1Score ??
        0,
    );

    const exam = Number(
      raw.examScore ??
        raw.exam ??
        0,
    );

    const rawTotal = Number(
      raw.totalScore ??
        raw.total ??
        ca + exam,
    );

    const total = Number.isFinite(rawTotal)
      ? rawTotal
      : ca + exam;

    const rawGrade = raw.grade;

    const grade =
      typeof rawGrade === "string"
        ? rawGrade
        : gradeFor(total);

    const position =
      raw.position ??
      raw.subjectPosition ??
      null;

    const remark =
      raw.remark ??
      raw.teacherRemark ??
      null;

    const signature =
      raw.teacherSignatureSnapshotUrl ??
      raw.teacherSignature ??
      null;

    return {
      result,
      ca,
      exam,
      total,
      grade,
      position,
      remark,
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

  const summary = enrollment.TermSummary;

  const summaryRecord = Array.isArray(summary)
    ? summary[0]
    : summary;

  const summaryData =
    summaryRecord as unknown as Record<string, unknown> | null;

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

  const attendanceOpened =
    summaryData?.timesSchoolOpened ??
    summaryData?.schoolOpened ??
    summaryData?.timesOpened ??
    null;

  const attendancePresent =
    summaryData?.timesPresent ??
    summaryData?.present ??
    null;

  const attendanceAbsent =
    summaryData?.timesAbsent ??
    summaryData?.absent ??
    null;

  const attendanceLate =
    summaryData?.timesLate ??
    summaryData?.late ??
    null;

  const affectiveRatings =
    summaryData &&
    Array.isArray(summaryData.AffectiveRatingRecord)
      ? (summaryData.AffectiveRatingRecord as Array<
          Record<string, unknown>
        >)
      : [];

  const studentRecord =
    enrollment.student as unknown as Record<string, unknown>;

  const photoData = studentRecord.photoData;
  const photoUrl = studentRecord.photoUrl;

  const studentPhoto =
    text(photoData) !== "—"
      ? text(photoData)
      : text(photoUrl) !== "—"
        ? text(photoUrl)
        : "";

  const nextTermDate =
    summaryData?.nextTermDate ??
    summaryData?.nextTermResumption ??
    null;

  const generalRemark =
    summaryData?.principalRemark ??
    summaryData?.generalRemark ??
    summaryData?.remark ??
    null;

  const principalSignature =
    summaryData?.principalSignatureUrl ??
    summaryData?.principalSignature ??
    null;

  const classAverage = (() => {
    const stored = Number(summaryData?.classAverage ?? 0);

    if (Number.isFinite(stored) && stored > 0) {
      return stored;
    }

    const storedResultAverage = Number(
      (results[0] as unknown as Record<string, unknown>).classAverage ?? 0,
    );

    if (
      Number.isFinite(storedResultAverage) &&
      storedResultAverage > 0
    ) {
      return storedResultAverage;
    }

    return 0;
  })();

  return (
    <>
      <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl print:rounded-none print:border-0 print:shadow-none">

            {/* HEADER */}
            <div className="bg-slate-900 px-6 py-7 text-white sm:px-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/school-logo.png.png"
                      alt="Rising Foundation Academy Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black tracking-wide sm:text-3xl">
                      RISING FOUNDATION ACADEMY
                    </h1>

                    <p className="mt-1 text-sm font-medium text-slate-300">
                      Student Academic Report
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    {text(enrollment.session.name)}
                  </span>

                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    {termLabel(text(enrollment.term))}
                  </span>

                  <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    Published
                  </span>
                </div>
              </div>
            </div>

            {/* STUDENT INFORMATION */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_180px]">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-slate-900" />

                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                      Student Information
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Student Name
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {text(studentName)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Admission Number
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {text(enrollment.student.admissionNo)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Class
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {text(className)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stream / Arm
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {text(streamName)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Academic Session
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {text(enrollment.session.name)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Term
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {termLabel(text(enrollment.term))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="h-40 w-32 overflow-hidden rounded-xl border-4 border-white bg-slate-200 shadow-md">
                    {studentPhoto ? (
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
            <div className="px-6 py-6 sm:px-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-slate-900" />

                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Performance Summary
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Student Average
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {numberText(summaryAverage ?? studentAverage)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Class Average
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {numberText(classAverage)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Performance Rate
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {numberText(performanceRate ?? studentAverage)}%
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Overall Position
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {position
                      ? `${text(position)}${
                          positionOutOf
                            ? ` / ${text(positionOutOf)}`
                            : ""
                        }`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subjects
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {String(results.length)}
                  </p>
                </div>
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE */}
            <div className="px-6 pb-8 sm:px-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-slate-900" />

                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                    Academic Performance
                  </h2>
                </div>

                <span className="text-xs font-semibold text-slate-400">
                  {String(results.length)} Subjects
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          #
                        </th>

                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Subject
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          CA
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          Exam
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          Total
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          Grade
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          Position
                        </th>

                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Teacher Remark
                        </th>

                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                          Subject Master Sign
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {resultRows.map((row, index) => {
                        const signatureText = text(row.signature);

                        return (
                          <tr
                            key={String(row.result.id)}
                            className={
                              index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50"
                            }
                          >
                            <td className="border-t border-slate-200 px-4 py-4 font-bold text-slate-500">
                              {String(index + 1)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 font-bold text-slate-800">
                              {text(row.result.subject.name)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center font-semibold">
                              {numberText(row.ca)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center font-semibold">
                              {numberText(row.exam)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center font-black text-slate-900">
                              {numberText(row.total)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center">
                              <span
                                className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-black ${gradeClass(
                                  text(row.grade),
                                )}`}
                              >
                                {text(row.grade)}
                              </span>
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center font-semibold">
                              {text(row.position)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-slate-600">
                              {text(row.remark)}
                            </td>

                            <td className="border-t border-slate-200 px-4 py-4 text-center">
                              {signatureText !== "—" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={signatureText}
                                  alt="Teacher signature"
                                  className="mx-auto h-9 max-w-24 object-contain"
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
            </div>

            {/* ATTENDANCE */}
            <div className="border-y border-slate-200 bg-slate-50 px-6 py-7 sm:px-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-slate-900" />

                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Attendance Record
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    School Opened
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {text(attendanceOpened)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Present
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {text(attendancePresent)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Absent
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {text(attendanceAbsent)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Late
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {text(attendanceLate)}
                  </p>
                </div>
              </div>
            </div>

            {/* AFFECTIVE ASSESSMENT */}
            <div className="px-6 py-8 sm:px-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-slate-900" />

                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  Affective Assessment
                </h2>
              </div>

              {affectiveRatings.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {affectiveRatings.map((item, index) => {
                    const itemName =
                      item.item ??
                      item.name ??
                      "Assessment";

                    const rating =
                      item.rating ??
                      item.value ??
                      item.score ??
                      null;

                    return (
                      <div
                        key={String(item.id ?? index)}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-bold text-slate-700">
                          {text(itemName)}
                        </p>

                        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {text(rating)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
                  No affective assessment recorded.
                </div>
              )}
            </div>

            {/* COMMENTS */}
            <div className="grid gap-6 border-t border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  General / Principal Remark
                </p>

                <p className="mt-3 min-h-20 text-sm leading-7 text-slate-700">
                  {text(generalRemark)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Next Term
                </p>

                <p className="mt-3 text-sm font-bold text-slate-800">
                  Resumption Date
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {dateText(nextTermDate)}
                </p>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="px-6 py-10 sm:px-10">
              <div className="grid gap-12 md:grid-cols-2">
                <div>
                  <div className="mb-10 flex h-14 items-end justify-center">
                    {text(principalSignature) !== "—" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={text(principalSignature)}
                        alt="Principal signature"
                        className="h-12 max-w-40 object-contain"
                      />
                    ) : null}
                  </div>

                  <div className="border-t border-slate-400 pt-3 text-center">
                    <p className="text-sm font-black text-slate-800">
                      Principal / Head of School
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Signature
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-10 h-14" />

                  <div className="border-t border-slate-400 pt-3 text-center">
                    <p className="text-sm font-black text-slate-800">
                      School Stamp
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Official Stamp
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 bg-slate-900 px-6 py-6 text-center text-xs text-slate-400 sm:px-10">
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

          {/* ACTIONS */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between print:hidden">
            <Link
              href="/student/results"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back to Results
            </Link>

            <StudentPrintButton />
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }

              body {
                background: white !important;
              }

              .print\\:hidden {
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