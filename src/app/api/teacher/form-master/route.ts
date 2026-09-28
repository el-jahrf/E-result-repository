import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RatingInput = {
  item: string;
  rating: number;
};

type FormMasterBody = {
  classId?: string;
  studentId?: string;
  sessionId?: string;
  term?: "FIRST" | "SECOND" | "THIRD";
  attendanceOpened?: number;
  attendancePresent?: number;
  attendanceAbsent?: number;
  punctualityRating?: number | null;
  formMasterRemark?: string | null;
  affectiveRatings?: RatingInput[];
};

const ALLOWED_AFFECTIVE_ITEMS = [
  "Attentiveness",
  "Neatness",
  "Cooperation",
  "Respect",
  "Leadership",
];

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
        {
          error:
            "Only teachers can submit Form Master assessments.",
        },
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

    const body =
      (await request.json()) as FormMasterBody;

    if (
      !body.classId ||
      !body.studentId ||
      !body.sessionId ||
      !body.term
    ) {
      return NextResponse.json(
        {
          error:
            "Class, student, session and term are required.",
        },
        { status: 400 },
      );
    }

    const currentSession =
      await prisma.academicSession.findFirst({
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
          error:
            "No current academic session is configured.",
        },
        { status: 400 },
      );
    }

    if (body.sessionId !== currentSession.id) {
      return NextResponse.json(
        {
          error:
            "This is not the current academic session.",
        },
        { status: 400 },
      );
    }

    const classRecord =
      await prisma.class.findUnique({
        where: {
          id: body.classId,
        },
        select: {
          id: true,
          section: true,
          name: true,
        },
      });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found." },
        { status: 404 },
      );
    }

    if (
      classRecord.section !== "JSS" &&
      classRecord.section !== "SS"
    ) {
      return NextResponse.json(
        {
          error:
            "This Form Master assessment is for JSS and Senior Secondary classes.",
        },
        { status: 400 },
      );
    }

    const formMaster =
      await prisma.classMasterAssignment.findFirst({
        where: {
          teacherId,
          classId: body.classId,
          sessionId: currentSession.id,
        },
      });

    if (!formMaster) {
      return NextResponse.json(
        {
          error:
            "You are not the Form Master for this class.",
        },
        { status: 403 },
      );
    }

    const enrollment =
      await prisma.enrollment.findFirst({
        where: {
          studentId: body.studentId,
          classId: body.classId,
          sessionId: currentSession.id,
          term: body.term,
        },
        select: {
          id: true,
          studentId: true,
        },
      });

    if (!enrollment) {
      return NextResponse.json(
        {
          error:
            "This student is not enrolled in this class for the selected term.",
        },
        { status: 400 },
      );
    }

    const opened = body.attendanceOpened;

    const present = body.attendancePresent;

    const absent = body.attendanceAbsent;

    if (
      !Number.isInteger(opened) ||
      opened === undefined ||
      opened < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Days school opened must be a valid whole number.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(present) ||
      present === undefined ||
      present < 0 ||
      present > opened
    ) {
      return NextResponse.json(
        {
          error:
            "Days present must be between 0 and the number of days school opened.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(absent) ||
      absent === undefined ||
      absent < 0 ||
      absent > opened
    ) {
      return NextResponse.json(
        {
          error:
            "Days absent must be between 0 and the number of days school opened.",
        },
        { status: 400 },
      );
    }

    if (present + absent > opened) {
      return NextResponse.json(
        {
          error:
            "Days present and absent cannot exceed days school opened.",
        },
        { status: 400 },
      );
    }

    const attendancePercentage =
      opened > 0
        ? Number(
            ((present / opened) * 100).toFixed(2),
          )
        : null;

    const punctuality =
      body.punctualityRating === null ||
      body.punctualityRating === undefined
        ? null
        : Number(body.punctualityRating);

    if (
      punctuality !== null &&
      (!Number.isInteger(punctuality) ||
        punctuality < 1 ||
        punctuality > 5)
    ) {
      return NextResponse.json(
        {
          error:
            "Punctuality rating must be between 1 and 5.",
        },
        { status: 400 },
      );
    }

    const remark =
      body.formMasterRemark?.trim() || null;

    if (remark && remark.length > 500) {
      return NextResponse.json(
        {
          error:
            "Form Master remark must not exceed 500 characters.",
        },
        { status: 400 },
      );
    }

    const suppliedRatings =
      body.affectiveRatings ?? [];

    const ratingsMap = new Map<
      string,
      number
    >();

    for (const rating of suppliedRatings) {
      if (
        !ALLOWED_AFFECTIVE_ITEMS.includes(
          rating.item,
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid affective assessment item: ${rating.item}`,
          },
          { status: 400 },
        );
      }

      if (
        !Number.isInteger(rating.rating) ||
        rating.rating < 0 ||
        rating.rating > 5
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid rating for ${rating.item}.`,
          },
          { status: 400 },
        );
      }

      ratingsMap.set(
        rating.item,
        rating.rating,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          attendanceOpened: opened,
          attendancePresent: present,
          attendanceAbsent: absent,
          attendancePercentage,
        },
      });

      const termSummary =
        await tx.termSummary.upsert({
          where: {
            enrollmentId: enrollment.id,
          },
          update: {
            classTeacherComment: remark,
            punctualityRating: punctuality,
          },
          create: {
            id: crypto.randomUUID(),
            enrollmentId: enrollment.id,
            classTeacherComment: remark,
            punctualityRating: punctuality,
          },
        });

      await tx.affectiveRatingRecord.deleteMany({
        where: {
          termSummaryId: termSummary.id,
        },
      });

      const records =
        ALLOWED_AFFECTIVE_ITEMS
          .map((item) => ({
            id: crypto.randomUUID(),
            termSummaryId: termSummary.id,
            item,
            rating: ratingsMap.get(item) ?? 0,
          }))
          .filter(
            (record) => record.rating > 0,
          );

      if (records.length > 0) {
        await tx.affectiveRatingRecord.createMany({
          data: records,
        });
      }

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          action:
            "SAVE_FORM_MASTER_ASSESSMENT",
          entity: "TermSummary",
          entityId: termSummary.id,
          details: {
            teacherId,
            classId: body.classId,
            studentId: body.studentId,
            sessionId: currentSession.id,
            term: body.term,
            attendanceOpened: opened,
            attendancePresent: present,
            attendanceAbsent: absent,
            attendancePercentage,
            punctualityRating: punctuality,
            affectiveItems: records.length,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Form Master assessment saved successfully.",
      attendancePercentage,
    });
  } catch (error) {
    console.error(
      "FORM MASTER ASSESSMENT ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while saving the Form Master assessment.",
      },
      { status: 500 },
    );
  }
}