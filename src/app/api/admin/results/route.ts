import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ResultAction = "APPROVE" | "REJECT";

type RequestBody = {
  resultId?: string;
  action?: ResultAction;
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

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "PRINCIPAL"
    ) {
      return NextResponse.json(
        { error: "Only administrators can approve or reject results." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as RequestBody;

    if (!body.resultId) {
      return NextResponse.json(
        { error: "Result ID is required." },
        { status: 400 },
      );
    }

    if (!body.action || !["APPROVE", "REJECT"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid result action." },
        { status: 400 },
      );
    }

    const result = await prisma.result.findUnique({
      where: {
        id: body.resultId,
      },
      include: {
        student: true,
        class: true,
        subject: true,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Result not found." },
        { status: 404 },
      );
    }

    if (result.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          error:
            "Only submitted results can be approved or rejected.",
        },
        { status: 400 },
      );
    }

    const newStatus =
      body.action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedResult = await prisma.result.update({
      where: {
        id: result.id,
      },
      data: {
        status: newStatus,
        approvedAt:
          body.action === "APPROVE" ? new Date() : null,
        publishedAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action:
          body.action === "APPROVE"
            ? "APPROVE_RESULT"
            : "REJECT_RESULT",
        entity: "Result",
        entityId: result.id,
        details: {
          resultId: result.id,
          studentId: result.studentId,
          studentName: `${result.student.firstName} ${result.student.lastName}`,
          classId: result.classId,
          subjectId: result.subjectId,
          previousStatus: "SUBMITTED",
          newStatus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        body.action === "APPROVE"
          ? "Result approved successfully."
          : "Result rejected successfully.",
      result: {
        id: updatedResult.id,
        status: updatedResult.status,
        approvedAt: updatedResult.approvedAt,
      },
    });
  } catch (error) {
    console.error("ADMIN RESULT ACTION ERROR:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing the result.",
      },
      { status: 500 },
    );
  }
}