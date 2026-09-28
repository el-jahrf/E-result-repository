import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TERMS = ["FIRST", "SECOND", "THIRD"] as const;

function generatePin(): string {
  const digits = Array.from({ length: 15 }, () =>
    randomInt(0, 10).toString()
  ).join("");

  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(
    8,
    12
  )}-${digits.slice(12, 15)}`;
}

async function createUniquePin() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = generatePin();

    const existing = await prisma.resultPin.findUnique({
      where: { pin },
      select: { id: true },
    });

    if (!existing) {
      return pin;
    }
  }

  throw new Error("Unable to generate a unique PIN.");
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("sessionId");
    const term = searchParams.get("term");

    const resultPins = await prisma.resultPin.findMany({
      where: {
        ...(sessionId ? { sessionId } : {}),
        ...(term && TERMS.includes(term as (typeof TERMS)[number])
          ? { term: term as (typeof TERMS)[number] }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      resultPins,
    });
  } catch (error) {
    console.error("Get result PINs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load result PINs.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      studentId,
      sessionId,
      term,
      classId,
      mode = "student",
      maxUses = 5,
    } = body;

    if (!sessionId || !term) {
      return NextResponse.json(
        {
          success: false,
          error: "Session and term are required.",
        },
        { status: 400 }
      );
    }

    if (!TERMS.includes(term)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid term.",
        },
        { status: 400 }
      );
    }

    if (!["student", "class", "all"].includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid generation mode.",
        },
        { status: 400 }
      );
    }

    if (mode === "student" && !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Student is required.",
        },
        { status: 400 }
      );
    }

    if (mode === "class" && !classId) {
      return NextResponse.json(
        {
          success: false,
          error: "Class is required.",
        },
        { status: 400 }
      );
    }

    const academicSession = await prisma.academicSession.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!academicSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Academic session not found.",
        },
        { status: 404 }
      );
    }

    let studentIds: string[] = [];

    if (mode === "student") {
      const student = await prisma.student.findUnique({
        where: {
          id: studentId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!student || !student.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Student not found or inactive.",
          },
          { status: 404 }
        );
      }

      studentIds = [student.id];
    }

    if (mode === "class") {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId,
          sessionId,
          term,
          student: {
            isActive: true,
          },
        },
        select: {
          studentId: true,
        },
        distinct: ["studentId"],
      });

      studentIds = enrollments.map((item) => item.studentId);
    }

    if (mode === "all") {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          sessionId,
          term,
          student: {
            isActive: true,
          },
        },
        select: {
          studentId: true,
        },
        distinct: ["studentId"],
      });

      studentIds = enrollments.map((item) => item.studentId);
    }

    if (studentIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No students found for the selected criteria.",
        },
        { status: 404 }
      );
    }

    const createdPins = [];
    const existingPins = [];

    for (const currentStudentId of studentIds) {
      const existingActivePin = await prisma.resultPin.findFirst({
        where: {
          studentId: currentStudentId,
          sessionId,
          term,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingActivePin) {
        existingPins.push(existingActivePin);
        continue;
      }

      const pin = await createUniquePin();

      const createdPin = await prisma.resultPin.create({
        data: {
          pin,
          studentId: currentStudentId,
          sessionId,
          term,
          maxUses:
            typeof maxUses === "number" && maxUses > 0 ? maxUses : 5,
          usedCount: 0,
          isActive: true,
        },
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      createdPins.push(createdPin);
    }

    return NextResponse.json({
      success: true,
      createdPins,
      existingPins,
      createdCount: createdPins.length,
      existingCount: existingPins.length,
      totalCount: createdPins.length + existingPins.length,
    });
  } catch (error) {
    console.error("Generate result PINs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate result PINs.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "PIN ID and active status are required.",
        },
        { status: 400 }
      );
    }

    const resultPin = await prisma.resultPin.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      resultPin,
    });
  } catch (error) {
    console.error("Update result PIN error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update result PIN.",
      },
      { status: 500 }
    );
  }
}