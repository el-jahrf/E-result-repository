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
        { status: 401 }
      );
    }

    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        level: true,
        arm: true,
        stream: true,
        section: true,
      },
      orderBy: [
        {
          section: "asc",
        },
        {
          level: "asc",
        },
        {
          name: "asc",
        },
        {
          arm: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error("Get result PIN classes error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load classes.",
      },
      { status: 500 }
    );
  }
}