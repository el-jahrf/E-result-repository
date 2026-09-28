import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateClassResults } from "@/lib/result-engine";

type SubjectInput = {
  subjectId: string;
  ca1?: string | number | null;
  ca2?: string | number | null;
  exam?: string | number | null;
  teacherRemark?: string | null;
};

type ValidatedSubject = {
  subjectId: string;
  ca1: number | null;
  ca2: number | null;
  caTotal: number | null;
  exam: number | null;
  totalScore: number | null;
  teacherRemark: string | null;
};

type AffectiveInput = {
  item: string;
  rating: number | string;
};

type RequestBody = {
  classId?: string;
  studentId?: string;
  term?: "FIRST" | "SECOND" | "THIRD";
  action?: "DRAFT" | "SUBMIT";
  subjects?: SubjectInput[];

  attendanceOpened?: number | string | null;
  attendancePresent?: number | string | null;
  attendanceAbsent?: number | string | null;

  punctualityRating?: number | string | null;
  classTeacherComment?: string | null;
  affectiveRatings?: AffectiveInput[];
};

function parseScore(
  value: string | number | null | undefined,
  maximum: number,
) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > maximum) {
    return null;
  }

  return score;
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function parseInteger(value: unknown) {
  if (!hasValue(value)) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    return null;
  }

  return number;
}

function cleanRemark(value: unknown, maximum: number) {
  if (value === undefined || value === null) {
    return null;
  }

  const remark = String(value).trim();

  if (remark.length > maximum) {
    return null;
  }

  return remark || null;
}

function teacherSignatureData(teacher: {
  signatureData: string | null;
}) {
  return teacher.signatureData ?? null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          error: "Only teachers can enter results.",
        },
        {
          status: 403,
        },
      );
    }

    const teacherId = session.user.teacherId;

    if (!teacherId) {
      return NextResponse.json(
        {
          error: "Teacher profile not found.",
        },
        {
          status: 403,
        },
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      select: {
        id: true,
        isActive: true,
        signatureData: true,
      },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        {
          error: "Teacher profile not found or inactive.",
        },
        {
          status: 403,
        },
      );
    }

    const body = (await request.json()) as RequestBody;

    if (!body.classId || !body.studentId) {
      return NextResponse.json(
        {
          error: "Class and student are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.term ||
      !["FIRST", "SECOND", "THIRD"].includes(body.term)
    ) {
      return NextResponse.json(
        {
          error: "A valid academic term is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.action ||
      !["DRAFT", "SUBMIT"].includes(body.action)
    ) {
      return NextResponse.json(
        {
          error: "Invalid result action.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(body.subjects)) {
      return NextResponse.json(
        {
          error: "Subject results are required.",
        },
        {
          status: 400,
        },
      );
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: {
        isCurrent: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!currentSession) {
      return NextResponse.json(
        {
          error: "No current academic session is configured.",
        },
        {
          status: 400,
        },
      );
    }

    const classRecord = await prisma.class.findUnique({
      where: {
        id: body.classId,
      },
      include: {
        classSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!classRecord || !classRecord.isActive) {
      return NextResponse.json(
        {
          error: "Class not found.",
        },
        {
          status: 404,
        },
      );
    }

    const isLowerSchool =
      classRecord.section === "NURSERY" ||
      classRecord.section === "PRIMARY";

    if (!isLowerSchool) {
      return NextResponse.json(
        {
          error:
            "This endpoint is for Nursery and Primary Class Teacher results.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * LOWER-SCHOOL AUTHORIZATION
     *
     * A Class Teacher receives access to every subject in the class
     * through one ClassMasterAssignment.
     *
     * TeacherAssignment is intentionally NOT used here.
     */
    const classMasterAssignment =
      await prisma.classMasterAssignment.findFirst({
        where: {
          teacherId,
          classId: body.classId,
          sessionId: currentSession.id,
        },
        select: {
          id: true,
        },
      });

    if (!classMasterAssignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned as the Class Teacher for this class.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Verify that the student is genuinely enrolled
     * in this class/session/term.
     */
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: body.studentId,
        classId: body.classId,
        sessionId: currentSession.id,
        term: body.term,
      },
      include: {
        student: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          error:
            "This student is not enrolled in the selected class, session and term.",
        },
        {
          status: 400,
        },
      );
    }

    const classSubjectIds = classRecord.classSubjects.map(
      (item) => item.subjectId,
    );

    const submittedSubjectIds = new Set(
      body.subjects.map((subject) => subject.subjectId),
    );

    /*
     * Prevent duplicate subject entries in a request.
     */
    if (submittedSubjectIds.size !== body.subjects.length) {
      return NextResponse.json(
        {
          error: "A subject cannot be submitted more than once.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Make sure the browser cannot submit an arbitrary subject.
     */
    for (const subjectId of submittedSubjectIds) {
      if (!classSubjectIds.includes(subjectId)) {
        return NextResponse.json(
          {
            error:
              "One or more submitted subjects are not allocated to this class.",
          },
          {
            status: 400,
          },
        );
      }
    }

    /*
     * For submission, every subject must have complete scores.
     */
    if (
      body.action === "SUBMIT" &&
      body.subjects.length !== classSubjectIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Every subject must be entered before the result can be submitted.",
        },
        {
          status: 400,
        },
      );
    }

    const validatedSubjects: ValidatedSubject[] = [];

    for (const subject of body.subjects) {
      const ca1 = parseScore(subject.ca1, 20);
      const ca2 = parseScore(subject.ca2, 20);
      const exam = parseScore(subject.exam, 60);

      if (
        (hasValue(subject.ca1) && ca1 === null) ||
        (hasValue(subject.ca2) && ca2 === null) ||
        (hasValue(subject.exam) && exam === null)
      ) {
        return NextResponse.json(
          {
            error: `Invalid score for subject ${subject.subjectId}. CA1 must be 0-20, CA2 must be 0-20 and Examination must be 0-60.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        body.action === "SUBMIT" &&
        (ca1 === null || ca2 === null || exam === null)
      ) {
        return NextResponse.json(
          {
            error:
              "All CA1, CA2 and examination scores must be entered before submission.",
          },
          {
            status: 400,
          },
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

      const teacherRemark = cleanRemark(
        subject.teacherRemark,
        500,
      );

      if (
        hasValue(subject.teacherRemark) &&
        teacherRemark === null
      ) {
        return NextResponse.json(
          {
            error:
              "A subject teacher remark cannot exceed 500 characters.",
          },
          {
            status: 400,
          },
        );
      }

      validatedSubjects.push({
        subjectId: subject.subjectId,
        ca1,
        ca2,
        caTotal,
        exam,
        totalScore,
        teacherRemark,
      });
    }

    /*
     * Attendance.
     */
    const attendanceOpened = parseInteger(
      body.attendanceOpened,
    );

    const attendancePresent = parseInteger(
      body.attendancePresent,
    );

    const attendanceAbsent = parseInteger(
      body.attendanceAbsent,
    );

    if (
      (hasValue(body.attendanceOpened) &&
        (attendanceOpened === null ||
          attendanceOpened < 0)) ||
      (hasValue(body.attendancePresent) &&
        (attendancePresent === null ||
          attendancePresent < 0)) ||
      (hasValue(body.attendanceAbsent) &&
        (attendanceAbsent === null ||
          attendanceAbsent < 0))
    ) {
      return NextResponse.json(
        {
          error:
            "Attendance values must be valid non-negative numbers.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      attendanceOpened !== null &&
      attendancePresent !== null &&
      attendancePresent > attendanceOpened
    ) {
      return NextResponse.json(
        {
          error:
            "Days present cannot be greater than school days opened.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      attendanceOpened !== null &&
      attendanceAbsent !== null &&
      attendanceAbsent > attendanceOpened
    ) {
      return NextResponse.json(
        {
          error:
            "Days absent cannot be greater than school days opened.",
        },
        {
          status: 400,
        },
      );
    }

    let attendancePercentage: number | null = null;

    if (
      attendanceOpened !== null &&
      attendanceOpened > 0 &&
      attendancePresent !== null
    ) {
      attendancePercentage =
        (attendancePresent / attendanceOpened) * 100;
    }

    /*
     * Class assessment.
     */
    const punctualityRating = parseInteger(
      body.punctualityRating,
    );

    if (
      punctualityRating !== null &&
      (punctualityRating < 1 || punctualityRating > 5)
    ) {
      return NextResponse.json(
        {
          error: "Punctuality rating must be between 1 and 5.",
        },
        {
          status: 400,
        },
      );
    }

    const classTeacherComment = cleanRemark(
      body.classTeacherComment,
      1000,
    );

    if (
      hasValue(body.classTeacherComment) &&
      classTeacherComment === null
    ) {
      return NextResponse.json(
        {
          error:
            "The class teacher remark cannot exceed 1000 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const affectiveRatings = body.affectiveRatings ?? [];

    for (const rating of affectiveRatings) {
      const parsedRating = parseInteger(rating.rating);

      if (
        !rating.item?.trim() ||
        parsedRating === null ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return NextResponse.json(
          {
            error:
              "Each affective assessment must have a valid item and a rating from 1 to 5.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      body.action === "SUBMIT" &&
      (attendanceOpened === null ||
        attendancePresent === null ||
        attendanceAbsent === null)
    ) {
      return NextResponse.json(
        {
          error:
            "Attendance information must be completed before submission.",
        },
        {
          status: 400,
        },
      );
    }

    const targetStatus =
      body.action === "SUBMIT" ? "SUBMITTED" : "DRAFT";

    const signatureData = teacherSignatureData(teacher);

    /*
     * Save everything as one transaction.
     */
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          attendanceOpened,
          attendancePresent,
          attendanceAbsent,
          attendancePercentage,
        },
      });

      for (const subject of validatedSubjects) {
        await tx.result.upsert({
          where: {
            studentId_subjectId_sessionId_term: {
              studentId: body.studentId!,
              subjectId: subject.subjectId,
              sessionId: currentSession.id,
              term: body.term!,
            },
          },

          update: {
            enrollmentId: enrollment.id,
            classId: body.classId!,

            ca1Score: subject.ca1,
            ca2Score: subject.ca2,
            caTotal: subject.caTotal,

            examScore: subject.exam,
            totalScore: subject.totalScore,

            teacherRemark: subject.teacherRemark,

            status: targetStatus,
            enteredById: teacherId,

            teacherSignatureSnapshotUrl: null,

            ...(targetStatus === "SUBMITTED"
              ? {
                  approvedAt: null,
                  publishedAt: null,
                }
              : {}),
          },

          create: {
            id: crypto.randomUUID(),

            studentId: body.studentId!,
            enrollmentId: enrollment.id,
            classId: body.classId!,
            subjectId: subject.subjectId,
            sessionId: currentSession.id,
            term: body.term!,

            ca1Score: subject.ca1,
            ca2Score: subject.ca2,
            caTotal: subject.caTotal,

            examScore: subject.exam,
            totalScore: subject.totalScore,

            teacherRemark: subject.teacherRemark,

            status: targetStatus,
            enteredById: teacherId,

            teacherSignatureSnapshotUrl: null,
          },
        });
      }

      const existingSummary =
        await tx.termSummary.findUnique({
          where: {
            enrollmentId: enrollment.id,
          },
        });

      const summaryId =
        existingSummary?.id ?? crypto.randomUUID();

      await tx.termSummary.upsert({
        where: {
          enrollmentId: enrollment.id,
        },

        update: {
          punctualityRating,
          classTeacherComment,

          classTeacherSignatureData: signatureData,

          classTeacherSignedAt:
            targetStatus === "SUBMITTED"
              ? new Date()
              : existingSummary?.classTeacherSignedAt ?? null,
        },

        create: {
          id: summaryId,
          enrollmentId: enrollment.id,

          punctualityRating,
          classTeacherComment,

          classTeacherSignatureData: signatureData,

          classTeacherSignedAt:
            targetStatus === "SUBMITTED"
              ? new Date()
              : null,
        },
      });

      await tx.affectiveRatingRecord.deleteMany({
        where: {
          termSummaryId: summaryId,
        },
      });

      if (affectiveRatings.length > 0) {
        await tx.affectiveRatingRecord.createMany({
          data: affectiveRatings.map((rating) => ({
            id: crypto.randomUUID(),
            termSummaryId: summaryId,
            item: rating.item.trim(),
            rating: Number(rating.rating),
          })),
        });
      }
    });

    /*
     * Recalculate class-level result metrics.
     */
    await recalculateClassResults({
      classId: body.classId,
      sessionId: currentSession.id,
      term: body.term,
    });

    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action:
          body.action === "SUBMIT"
            ? "SUBMIT_CLASS_RESULT"
            : "SAVE_CLASS_RESULT_DRAFT",
        entity: "Enrollment",
        entityId: enrollment.id,
        details: {
          teacherId,
          studentId: body.studentId,
          classId: body.classId,
          sessionId: currentSession.id,
          term: body.term,
          subjectCount: validatedSubjects.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        body.action === "SUBMIT"
          ? "Student result submitted successfully for approval."
          : "Student result saved as draft.",
    });
  } catch (error) {
    console.error("LOWER SCHOOL RESULT ERROR:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while saving the student result.",
      },
      {
        status: 500,
      },
    );
  }
}