import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [classes, subjects, sessions] = await Promise.all([
    prisma.class.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        level: true,
        arm: true,
        stream: true,
        section: true,
      },
      orderBy: [
        { section: "asc" },
        { level: "asc" },
        { name: "asc" },
        { arm: "asc" },
      ],
    }),

    prisma.subject.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    }),

    prisma.academicSession.findMany({
      select: {
        id: true,
        name: true,
        isCurrent: true,
        startDate: true,
      },
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    }),
  ]);

  return NextResponse.json({
    classes,
    subjects,
    sessions,
  });
}
