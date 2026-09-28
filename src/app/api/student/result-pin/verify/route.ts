import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TERMS = ["FIRST", "SECOND", "THIRD"] as const;

type ValidTerm = (typeof VALID_TERMS)[number];

function formatPin(digits: string) {
  return [
    digits.slice(0, 4),
    digits.slice(4, 8),
    digits.slice(8, 12),
    digits.slice(12, 15),
  ]
    .filter(Boolean)
    .join("-");
}

function isValidTerm(value: unknown): value is ValidTerm {
  return (
    typeof value === "string" &&
    VALID_TERMS.includes(value as ValidTerm)
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request.",
        },
        { status: 400 },
      );
    }

    const rawPin = String(body?.pin ?? "");
    const sessionId = String(body?.sessionId ?? "").trim();
    const term = body?.term;

    const digits = rawPin.replace(/\D/g, "");

    if (!/^\d{15}$/.test(digits)) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid 15-digit Result PIN.",
        },
        { status: 400 },
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select an academic session.",
        },
        { status: 400 },
      );
    }

    if (!isValidTerm(term)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid term.",
        },
        { status: 400 },
      );
    }

    const pin = formatPin(digits);

    const student = await prisma.student.findUnique({
      where: {
        userId: session.user.id,
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
          error: "Student account not found or inactive.",
        },
        { status: 404 },
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
        { status: 404 },
      );
    }

    const resultPin = await prisma.resultPin.findUnique({
      where: {
        pin,
      },
      select: {
        id: true,
        studentId: true,
        sessionId: true,
        term: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
      },
    });

    if (!resultPin || resultPin.studentId !== student.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Result PIN.",
        },
        { status: 400 },
      );
    }

    if (
      resultPin.sessionId !== sessionId ||
      resultPin.term !== term
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Result PIN belongs to a different academic session or term.",
        },
        { status: 400 },
      );
    }

    if (!resultPin.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "This Result PIN has been disabled.",
        },
        { status: 400 },
      );
    }

    if (resultPin.usedCount >= resultPin.maxUses) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Result PIN has reached its maximum number of uses.",
        },
        { status: 400 },
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        sessionId,
        term,
      },
      select: {
        id: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No enrollment was found for the selected academic session and term.",
        },
        { status: 404 },
      );
    }

    const publishedResult = await prisma.result.findFirst({
      where: {
        studentId: student.id,
        enrollmentId: enrollment.id,
        sessionId,
        term,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!publishedResult) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No published result is available for this session and term yet.",
        },
        { status: 404 },
      );
    }

    const usageUpdate = await prisma.resultPin.updateMany({
      where: {
        id: resultPin.id,
        isActive: true,
        usedCount: {
          lt: resultPin.maxUses,
        },
      },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    if (usageUpdate.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Result PIN has reached its maximum number of uses.",
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Result PIN verified successfully.",
    });

    response.cookies.set({
      name: "result_pin_access",
      value: resultPin.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/student/results",
    });

    return response;
  } catch (error) {
    console.error("Student Result PIN verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify Result PIN.",
      },
      { status: 500 },
    );
  }
}