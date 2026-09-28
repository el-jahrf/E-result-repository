import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        middleName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        photoData: true,
        isActive: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      student: {
        ...student,
        dateOfBirth: student.dateOfBirth
          ? student.dateOfBirth.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Get student error:", error);

    return NextResponse.json(
      { error: "Failed to load student." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      /*
       * ResultPin does not cascade from Student,
       * so remove the student's result PIN records first.
       */
      await tx.resultPin.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      /*
       * Results are linked to Student with onDelete: Cascade,
       * but deleting them explicitly keeps this operation
       * predictable and safe.
       */
      await tx.result.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      /*
       * Enrollment has onDelete: Cascade to TermSummary.
       *
       * Therefore deleting the student's enrollments also
       * removes their TermSummary and AffectiveRatingRecord
       * records automatically.
       */
      await tx.enrollment.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      /*
       * Delete the Student record.
       */
      await tx.student.delete({
        where: {
          id: student.id,
        },
      });

      /*
       * Delete the login account belonging to the student.
       */
      if (student.userId) {
        await tx.user.delete({
          where: {
            id: student.userId,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `${student.firstName} ${student.lastName} was deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete student error:", error);

    return NextResponse.json(
      {
        error:
          "Failed to delete student. Please make sure the student has no records that prevent deletion.",
      },
      { status: 500 },
    );
  }
}