import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateClassResults } from "@/lib/result-engine";

type ResultInput = {
  studentId: string;
  ca1?: string | number | null;
  ca2?: string | number | null;
  exam?: string | number | null;
  teacherRemark?: string | null;
};

type SaveResultsBody = {
  assignmentId?: string;
  action?: "DRAFT" | "SUBMIT";
  results?: ResultInput[];
};

function parseScore(
  value: string | number | null | undefined,
  maximum: number,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > maximum) {
    return null;
  }

  return score;
}

function hasProvidedValue(
  value: string | number | null | undefined,
) {
  return value !== undefined && value !== null && value !== "";
}

function parseTeacherRemark(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const remark = value.trim();

  if (!remark) {
    return null;
  }

  if (remark.length > 500) {
    return null;
  }

  return remark;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can enter results." },
        { status: 403 },
      );
    }

    const teacherId = session.user.teacherId;

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as SaveResultsBody;

    if (!body.assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required." },
        { status: 400 },
      );
    }

    if (
      !body.action ||
      !["DRAFT", "SUBMIT"].includes(body.action)
    ) {
      return NextResponse.json(
        { error: "Invalid result action." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.results) || body.results.length === 0) {
      return NextResponse.json(
        { error: "No student results were provided." },
        { status: 400 },
      );
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: {
        isCurrent: true,
      },
      select: {
        id: true,
      },
    });

    if (!currentSession) {
      return NextResponse.json(
        {
          error: "No current academic session is configured.",
        },
        { status: 400 },
      );
    }

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        id: body.assignmentId,
        teacherId,
        sessionId: currentSession.id,
      },
      select: {
        id: true,
        classId: true,
        subjectId: true,
        sessionId: true,
        term: true,
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            section: true,
          },
        },
        teacher: {
          select: {
            id: true,
            signatureUrl: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to enter results for this assignment.",
        },
        { status: 403 },
      );
    }

    if (
      assignment.subject.section !== null &&
      assignment.subject.section !== assignment.class.section
    ) {
      return NextResponse.json(
        {
          error:
            `The subject "${assignment.subject.name}" is not valid for the ${assignment.class.section} section.`,
        },
        { status: 400 },
      );
    }

    const studentIds = body.results.map(
      (result) => result.studentId,
    );

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        classId: assignment.classId,
        sessionId: assignment.sessionId,
        term: assignment.term,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    const enrollmentMap = new Map(
      enrollments.map((enrollment) => [
        enrollment.studentId,
        enrollment.id,
      ]),
    );

    for (const input of body.results) {
      if (!enrollmentMap.has(input.studentId)) {
        return NextResponse.json(
          {
            error:
              `Student ${input.studentId} is not enrolled in this assignment.`,
          },
          { status: 400 },
        );
      }
    }

    const validatedResults = [];

    for (const input of body.results) {
      const ca1 = parseScore(input.ca1, 20);
      const ca2 = parseScore(input.ca2, 20);
      const exam = parseScore(input.exam, 60);

      if (
        (hasProvidedValue(input.ca1) && ca1 === null) ||
        (hasProvidedValue(input.ca2) && ca2 === null) ||
        (hasProvidedValue(input.exam) && exam === null)
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid score for student ${input.studentId}. CA1 must be 0-20, CA2 must be 0-20, and Exam must be 0-60.`,
          },
          { status: 400 },
        );
      }

      if (
        body.action === "SUBMIT" &&
        (ca1 === null || ca2 === null || exam === null)
      ) {
        return NextResponse.json(
          {
            error:
              "All CA1, CA2 and examination scores must be entered before submitting for approval.",
          },
          { status: 400 },
        );
      }

      const teacherRemark = parseTeacherRemark(input.teacherRemark);

      if (
        input.teacherRemark !== undefined &&
        input.teacherRemark !== null &&
        teacherRemark === null &&
        input.teacherRemark.trim().length > 500
      ) {
        return NextResponse.json(
          {
            error:
              "Teacher remark must not exceed 500 characters.",
          },
          { status: 400 },
        );
      }

      const caTotal =
        ca1 !== null || ca2 !== null
          ? (ca1 ?? 0) + (ca2 ?? 0)
          : null;

      const totalScore =
        caTotal !== null || exam !== null
          ? (caTotal ?? 0) + (exam ?? 0)
          : null;

      validatedResults.push({
        studentId: input.studentId,
        enrollmentId: enrollmentMap.get(input.studentId)!,
        ca1,
        ca2,
        caTotal,
        exam,
        totalScore,
        teacherRemark,
      });
    }

    const targetStatus =
      body.action === "SUBMIT"
        ? "SUBMITTED"
        : "DRAFT";

    const savedResults = [];

    for (const input of validatedResults) {
      const result = await prisma.result.upsert({
        where: {
          studentId_subjectId_sessionId_term: {
            studentId: input.studentId,
            subjectId: assignment.subjectId,
            sessionId: assignment.sessionId,
            term: assignment.term,
          },
        },

        update: {
          enrollmentId: input.enrollmentId,
          classId: assignment.classId,

          ca1Score: input.ca1,
          ca2Score: input.ca2,
          caTotal: input.caTotal,

          examScore: input.exam,
          totalScore: input.totalScore,

          teacherRemark: input.teacherRemark,

          status: targetStatus,
          enteredById: teacherId,

          teacherSignatureSnapshotUrl:
            assignment.teacher.signatureUrl,

          ...(targetStatus === "SUBMITTED"
            ? {
                approvedAt: null,
                publishedAt: null,
              }
            : {}),
        },

        create: {
          id: crypto.randomUUID(),

          studentId: input.studentId,
          enrollmentId: input.enrollmentId,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          sessionId: assignment.sessionId,
          term: assignment.term,

          ca1Score: input.ca1,
          ca2Score: input.ca2,
          caTotal: input.caTotal,

          examScore: input.exam,
          totalScore: input.totalScore,

          teacherRemark: input.teacherRemark,

          status: targetStatus,
          enteredById: teacherId,

          teacherSignatureSnapshotUrl:
            assignment.teacher.signatureUrl,
        },
      });

      savedResults.push({
        studentId: result.studentId,
        status: result.status,
      });
    }

    await recalculateClassResults({
      classId: assignment.classId,
      sessionId: assignment.sessionId,
      term: assignment.term,
    });

    const recalculatedResults = await prisma.result.findMany({
      where: {
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        sessionId: assignment.sessionId,
        term: assignment.term,
        studentId: {
          in: studentIds,
        },
      },
      select: {
        studentId: true,
        status: true,
        caTotal: true,
        totalScore: true,
        grade: true,
        remark: true,
        teacherRemark: true,
        classAverage: true,
        lowestInClass: true,
        performanceRate: true,
        position: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,

        action:
          body.action === "SUBMIT"
            ? "SUBMIT_RESULTS"
            : "SAVE_RESULT_DRAFT",

        entity: "Result",
        entityId: assignment.id,

        details: {
          teacherId,
          assignmentId: assignment.id,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          sessionId: assignment.sessionId,
          term: assignment.term,
          studentCount: savedResults.length,
          calculated: true,
        },
      },
    });

    return NextResponse.json({
      success: true,

      message:
        body.action === "SUBMIT"
          ? "Results calculated and submitted for approval."
          : "Results calculated and saved as draft.",

      results: recalculatedResults.map((result) => ({
        studentId: result.studentId,
        status: result.status,

        caTotal: result.caTotal?.toString() ?? null,
        totalScore: result.totalScore?.toString() ?? null,

        grade: result.grade,
        remark: result.remark,
        teacherRemark: result.teacherRemark,

        classAverage:
          result.classAverage?.toString() ?? null,

        lowestInClass:
          result.lowestInClass?.toString() ?? null,

        performanceRate:
          result.performanceRate?.toString() ?? null,

        position: result.position,
      })),
    });
  } catch (error) {
    console.error(
      "TEACHER RESULT CALCULATION ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while calculating and saving results.",
      },
      { status: 500 },
    );
  }
}