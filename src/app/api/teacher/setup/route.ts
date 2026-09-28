import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SetupBody = {
  password?: string;
  signatureData?: string;
};

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
        { error: "Only teachers can complete teacher setup." },
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

    const body = (await request.json()) as SetupBody;

    const password = body.password?.trim();
    const signatureData = body.signatureData?.trim();

    if (!password) {
      return NextResponse.json(
        { error: "A new password is required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Your new password must contain at least 8 characters.",
        },
        { status: 400 },
      );
    }

    if (!signatureData) {
      return NextResponse.json(
        { error: "Your signature is required." },
        { status: 400 },
      );
    }

    if (!signatureData.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        {
          error:
            "Invalid signature format. Please draw your signature again.",
        },
        { status: 400 },
      );
    }

    if (signatureData.length > 2_000_000) {
      return NextResponse.json(
        {
          error:
            "The signature image is too large. Please provide a simpler signature.",
        },
        { status: 400 },
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      select: {
        id: true,
        userId: true,
        isActive: true,
        user: {
          select: {
            profileCompleted: true,
          },
        },
      },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: "Teacher profile not found or inactive." },
        { status: 403 },
      );
    }

    if (teacher.user.profileCompleted) {
      return NextResponse.json(
        {
          error:
            "Your teacher account has already been completed.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: teacher.userId,
        },
        data: {
          passwordHash,
          profileCompleted: true,
          signatureData,
        },
      }),

      prisma.teacher.update({
        where: {
          id: teacher.id,
        },
        data: {
          signatureData,
          signatureUrl: signatureData,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Teacher account setup completed successfully.",
    });
  } catch (error) {
    console.error("TEACHER SETUP ERROR:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while completing your account setup.",
      },
      { status: 500 },
    );
  }
}