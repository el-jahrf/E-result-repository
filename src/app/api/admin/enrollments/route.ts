import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [students, classes, sessions] = await Promise.all([
      prisma.student.findMany({
        where: { isActive: true },
        orderBy: [
          { lastName: "asc" },
          { firstName: "asc" },
        ],
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      }),

      prisma.class.findMany({
        where: { isActive: true },
        orderBy: [
          { section: "asc" },
          { level: "asc" },
          { name: "asc" },
        ],
        select: {
          id: true,
          name: true,
          arm: true,
          stream: true,
        },
      }),

      prisma.academicSession.findMany({
        orderBy: {
          startDate: "desc",
        },
        select: {
          id: true,
          name: true,
          isCurrent: true,
        },
      }),
    ]);

    return NextResponse.json({
      students,
      classes,
      sessions,
    });
  } catch (error) {
    console.error("Load enrollment data error:", error);

    return NextResponse.json(
      {
        error: "Failed to load enrollment data.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      studentId,
      classId,
      sessionId,
      term,
    } = body;

    if (!studentId || !classId || !sessionId || !term) {
      return NextResponse.json(
        {
          error:
            "Student, class, academic session, and term are required.",
        },
        { status: 400 }
      );
    }

    if (!["FIRST", "SECOND", "THIRD"].includes(term)) {
      return NextResponse.json(
        { error: "Invalid term." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const schoolClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      return NextResponse.json(
        { error: "Class not found." },
        { status: 404 }
      );
    }

    const session = await prisma.academicSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Academic session not found." },
        { status: 404 }
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_sessionId_term: {
          studentId,
          sessionId,
          term,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          error:
            "This student is already enrolled for this academic session and term.",
        },
        { status: 409 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        sessionId,
        term,
      },
      include: {
        student: true,
        class: true,
        session: true,
      },
    });

    return NextResponse.json(
      {
        message: "Student enrolled successfully.",
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create enrollment error:", error);

    return NextResponse.json(
      { error: "Failed to enroll student." },
      { status: 500 }
    );
  }
}