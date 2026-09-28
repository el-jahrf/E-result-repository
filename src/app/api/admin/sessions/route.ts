import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const sessions = await prisma.academicSession.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
        currentTerm: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get academic sessions error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load academic sessions.",
      },
      { status: 500 },
    );
  }
}