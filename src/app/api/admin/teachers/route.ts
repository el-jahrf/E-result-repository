import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type TeacherAssignmentInput = {
  classId?: string;
  subjectId?: string;
  sessionId?: string;
  term?: string;
};

type ClassMasterAssignmentInput = {
  classId?: string;
  sessionId?: string;
};

type CreateTeacherBody = {
  staffNo?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  signatureData?: string | null;
  assignments?: TeacherAssignmentInput[];
  classMasterAssignments?: ClassMasterAssignmentInput[];
};

type UpdateTeacherBody = {
  action?: "UPDATE_SIGNATURE" | "RESET_PASSWORD";
  teacherId?: string;
  signatureData?: string | null;
  password?: string;
};

type DeleteTeacherBody = {
  teacherId?: string;
};

const VALID_TERMS = ["FIRST", "SECOND", "THIRD"] as const;

function isValidTerm(
  value: string,
): value is (typeof VALID_TERMS)[number] {
  return VALID_TERMS.includes(
    value as (typeof VALID_TERMS)[number],
  );
}

function validateSignature(signatureData: string | null) {
  if (signatureData === null) {
    return null;
  }

  if (!signatureData.startsWith("data:image/")) {
    return "Invalid signature image.";
  }

  const allowedTypes = [
    "data:image/png;base64,",
    "data:image/jpeg;base64,",
    "data:image/webp;base64,",
  ];

  const isAllowedType = allowedTypes.some((type) =>
    signatureData.startsWith(type),
  );

  if (!isAllowedType) {
    return "Signature must be PNG, JPEG, or WebP.";
  }

  if (signatureData.length > 2_000_000) {
    return "Signature image is too large. Please use an image under 1.5 MB.";
  }

  return null;
}

/*
 * ------------------------------------------------------------------
 * GET TEACHERS
 * ------------------------------------------------------------------
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Only administrators can view teachers.",
        },
        { status: 403 },
      );
    }

    const teachers = await prisma.teacher.findMany({
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },

        assignments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                arm: true,
                level: true,
                stream: true,
                section: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                section: true,
              },
            },
            AcademicSession: {
              select: {
                id: true,
                name: true,
                isCurrent: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },

        classMasterAssignments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: true,
                arm: true,
                stream: true,
                section: true,
              },
            },
            session: {
              select: {
                id: true,
                name: true,
                isCurrent: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Load teachers error:", error);

    return NextResponse.json(
      { error: "Failed to load teachers." },
      { status: 500 },
    );
  }
}

/*
 * ------------------------------------------------------------------
 * CREATE TEACHER
 * ------------------------------------------------------------------
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Only administrators can create teachers.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateTeacherBody;

    const staffNo = body.staffNo?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const signatureData = body.signatureData ?? null;

    const assignments = Array.isArray(body.assignments)
      ? body.assignments
      : [];

    const classMasterAssignments = Array.isArray(
      body.classMasterAssignments,
    )
      ? body.classMasterAssignments
      : [];

    if (
      !staffNo ||
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Staff number, first name, last name, email, and password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 },
      );
    }

    const signatureError =
      validateSignature(signatureData);

    if (signatureError) {
      return NextResponse.json(
        { error: signatureError },
        { status: 400 },
      );
    }

    const [existingUser, existingTeacher] =
      await Promise.all([
        prisma.user.findUnique({
          where: { email },
        }),
        prisma.teacher.findUnique({
          where: { staffNo },
        }),
      ]);

    if (existingUser) {
      return NextResponse.json(
        {
          error: "A user with this email already exists.",
        },
        { status: 409 },
      );
    }

    if (existingTeacher) {
      return NextResponse.json(
        {
          error:
            "A teacher with this staff number already exists.",
        },
        { status: 409 },
      );
    }

    /*
     * Clean teaching assignments.
     */
    const cleanedAssignments = assignments
      .map((assignment) => ({
        classId: assignment.classId?.trim(),
        subjectId: assignment.subjectId?.trim(),
        sessionId: assignment.sessionId?.trim(),
        term: assignment.term?.trim().toUpperCase(),
      }))
      .filter(
        (
          assignment,
        ): assignment is {
          classId: string;
          subjectId: string;
          sessionId: string;
          term: string;
        } =>
          Boolean(
            assignment.classId &&
              assignment.subjectId &&
              assignment.sessionId &&
              assignment.term,
          ),
      );

    for (const assignment of cleanedAssignments) {
      if (!isValidTerm(assignment.term)) {
        return NextResponse.json(
          {
            error:
              "Each teaching assignment must use First, Second, or Third Term.",
          },
          { status: 400 },
        );
      }
    }

    /*
     * Remove duplicate teaching assignments.
     */
    const uniqueAssignmentMap = new Map<
      string,
      (typeof cleanedAssignments)[number]
    >();

    for (const assignment of cleanedAssignments) {
      const key = [
        assignment.classId,
        assignment.subjectId,
        assignment.sessionId,
        assignment.term,
      ].join(":");

      uniqueAssignmentMap.set(key, assignment);
    }

    const uniqueAssignments = Array.from(
      uniqueAssignmentMap.values(),
    );

    /*
     * Clean class-master assignments.
     */
    const cleanedClassMasterAssignments =
      classMasterAssignments
        .map((assignment) => ({
          classId: assignment.classId?.trim(),
          sessionId: assignment.sessionId?.trim(),
        }))
        .filter(
          (
            assignment,
          ): assignment is {
            classId: string;
            sessionId: string;
          } =>
            Boolean(
              assignment.classId &&
                assignment.sessionId,
            ),
        );

    /*
     * Remove duplicate class-master assignments.
     */
    const uniqueClassMasterMap = new Map<
      string,
      (typeof cleanedClassMasterAssignments)[number]
    >();

    for (const assignment of cleanedClassMasterAssignments) {
      const key = `${assignment.classId}:${assignment.sessionId}`;

      uniqueClassMasterMap.set(key, assignment);
    }

    const uniqueClassMasterAssignments = Array.from(
      uniqueClassMasterMap.values(),
    );

    /*
     * Validate teaching assignments.
     */
    for (const assignment of uniqueAssignments) {
      const [
        schoolClass,
        subject,
        academicSession,
      ] = await Promise.all([
        prisma.class.findUnique({
          where: {
            id: assignment.classId,
          },
          select: {
            id: true,
            name: true,
            arm: true,
            level: true,
            stream: true,
            section: true,
            isActive: true,
          },
        }),

        prisma.subject.findUnique({
          where: {
            id: assignment.subjectId,
          },
          select: {
            id: true,
            name: true,
            code: true,
            section: true,
            isActive: true,
          },
        }),

        prisma.academicSession.findUnique({
          where: {
            id: assignment.sessionId,
          },
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        }),
      ]);

      if (!schoolClass || !schoolClass.isActive) {
        return NextResponse.json(
          {
            error:
              "One of the selected classes is invalid or inactive.",
          },
          { status: 400 },
        );
      }

      if (!subject || !subject.isActive) {
        return NextResponse.json(
          {
            error:
              "One of the selected subjects is invalid or inactive.",
          },
          { status: 400 },
        );
      }

      if (!academicSession) {
        return NextResponse.json(
          {
            error:
              "One of the selected academic sessions is invalid.",
          },
          { status: 400 },
        );
      }

      if (
        subject.section &&
        subject.section !== schoolClass.section
      ) {
        return NextResponse.json(
          {
            error: `The subject "${subject.name}" does not belong to the selected class section.`,
          },
          { status: 400 },
        );
      }
    }

    /*
     * Validate class-master assignments.
     */
    for (const assignment of uniqueClassMasterAssignments) {
      const [
        schoolClass,
        academicSession,
      ] = await Promise.all([
        prisma.class.findUnique({
          where: {
            id: assignment.classId,
          },
          select: {
            id: true,
            name: true,
            arm: true,
            level: true,
            stream: true,
            section: true,
            isActive: true,
          },
        }),

        prisma.academicSession.findUnique({
          where: {
            id: assignment.sessionId,
          },
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        }),
      ]);

      if (!schoolClass || !schoolClass.isActive) {
        return NextResponse.json(
          {
            error:
              "One of the selected permanent classes is invalid or inactive.",
          },
          { status: 400 },
        );
      }

      if (!academicSession) {
        return NextResponse.json(
          {
            error:
              "One of the selected permanent class sessions is invalid.",
          },
          { status: 400 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      password,
      10,
    );

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: "TEACHER",
            isActive: true,
            profileCompleted: false,
            signatureData: null,
          },
        });

        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            staffNo,
            firstName,
            lastName,
            isActive: true,
            signatureData: null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

        /*
         * Create teaching assignments.
         */
        for (const assignment of uniqueAssignments) {
          await tx.teacherAssignment.create({
            data: {
              teacherId: teacher.id,
              classId: assignment.classId,
              subjectId: assignment.subjectId,
              sessionId: assignment.sessionId,
              term: assignment.term as
                | "FIRST"
                | "SECOND"
                | "THIRD",
            },
          });
        }

        /*
         * Create permanent class-master assignments.
         */
        for (const assignment of uniqueClassMasterAssignments) {
          await tx.classMasterAssignment.create({
            data: {
              teacherId: teacher.id,
              classId: assignment.classId,
              sessionId: assignment.sessionId,
            },
          });
        }

        return teacher;
      },
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_TEACHER",
        entity: "Teacher",
        entityId: result.id,
        details: {
          teacherId: result.id,
          staffNo: result.staffNo,
          teacherName: `${result.firstName} ${result.lastName}`,
          email: result.user.email,
          assignmentCount:
            uniqueAssignments.length,
          classMasterAssignmentCount:
            uniqueClassMasterAssignments.length,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          uniqueAssignments.length > 0 ||
          uniqueClassMasterAssignments.length > 0
            ? "Teacher and assignments created successfully."
            : "Teacher created successfully.",
        teacher: result,
        assignmentCount:
          uniqueAssignments.length,
        classMasterAssignmentCount:
          uniqueClassMasterAssignments.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create teacher error:", error);

    return NextResponse.json(
      {
        error: "Failed to create teacher.",
      },
      { status: 500 },
    );
  }
}

/*
 * ------------------------------------------------------------------
 * UPDATE TEACHER
 * ------------------------------------------------------------------
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Only administrators can update teacher accounts.",
        },
        { status: 403 },
      );
    }

    const body =
      (await request.json()) as UpdateTeacherBody;

    const action =
      body.action ?? "UPDATE_SIGNATURE";

    const teacherId = body.teacherId?.trim();

    if (!teacherId) {
      return NextResponse.json(
        {
          error: "Teacher ID is required.",
        },
        { status: 400 },
      );
    }

    /*
     * ADMIN PASSWORD RESET
     */
    if (action === "RESET_PASSWORD") {
      const password = body.password;

      if (!password) {
        return NextResponse.json(
          {
            error:
              "A temporary password is required.",
          },
          { status: 400 },
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          {
            error:
              "Temporary password must be at least 6 characters.",
          },
          { status: 400 },
        );
      }

      const teacher =
        await prisma.teacher.findUnique({
          where: {
            id: teacherId,
          },
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            staffNo: true,
            user: {
              select: {
                id: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

      if (!teacher) {
        return NextResponse.json(
          {
            error: "Teacher not found.",
          },
          { status: 404 },
        );
      }

      if (!teacher.user.isActive) {
        return NextResponse.json(
          {
            error:
              "This teacher's account is inactive. Activate the account before resetting the password.",
          },
          { status: 400 },
        );
      }

      const passwordHash = await bcrypt.hash(
        password,
        12,
      );

      await prisma.user.update({
        where: {
          id: teacher.userId,
        },
        data: {
          passwordHash,
          profileCompleted: false,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "RESET_TEACHER_PASSWORD",
          entity: "Teacher",
          entityId: teacher.id,
          details: {
            teacherId: teacher.id,
            staffNo: teacher.staffNo,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            email: teacher.user.email,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Teacher password reset successfully. The teacher must create a new password when they log in.",
      });
    }

    /*
     * TEACHER SIGNATURE UPDATE
     */
    const signatureData =
      body.signatureData ?? null;

    const signatureError =
      validateSignature(signatureData);

    if (signatureError) {
      return NextResponse.json(
        {
          error: signatureError,
        },
        { status: 400 },
      );
    }

    const teacher =
      await prisma.teacher.findUnique({
        where: {
          id: teacherId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffNo: true,
        },
      });

    if (!teacher) {
      return NextResponse.json(
        {
          error: "Teacher not found.",
        },
        { status: 404 },
      );
    }

    const updatedTeacher =
      await prisma.teacher.update({
        where: {
          id: teacherId,
        },
        data: {
          signatureData,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffNo: true,
          signatureData: true,
        },
      });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action:
          signatureData === null
            ? "REMOVE_TEACHER_SIGNATURE"
            : "UPDATE_TEACHER_SIGNATURE",
        entity: "Teacher",
        entityId: teacher.id,
        details: {
          teacherId: teacher.id,
          staffNo: teacher.staffNo,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        signatureData === null
          ? "Teacher signature removed."
          : "Teacher signature saved successfully.",
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error(
      "Teacher update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update teacher account.",
      },
      { status: 500 },
    );
  }
}

/*
 * ------------------------------------------------------------------
 * DELETE TEACHER
 * ------------------------------------------------------------------
 *
 * This permanently removes:
 *
 *   Teacher
 *   Teacher assignments
 *   Class/Form Master assignments
 *   Teacher's login User account
 *
 * Existing student Result records are preserved.
 * Their enteredById is set to NULL before the teacher is removed.
 *
 * Only ADMIN users can perform this action.
 * ------------------------------------------------------------------
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Only administrators can delete teachers.",
        },
        { status: 403 },
      );
    }

    const body =
      (await request.json()) as DeleteTeacherBody;

    const teacherId = body.teacherId?.trim();

    if (!teacherId) {
      return NextResponse.json(
        {
          error: "Teacher ID is required.",
        },
        { status: 400 },
      );
    }

    /*
     * Never allow an administrator to accidentally
     * delete a different type of account through this endpoint.
     */
    const teacher =
      await prisma.teacher.findUnique({
        where: {
          id: teacherId,
        },
        select: {
          id: true,
          userId: true,
          staffNo: true,
          firstName: true,
          lastName: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

    if (!teacher) {
      return NextResponse.json(
        {
          error: "Teacher not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Prevent deleting the currently authenticated account
     * in case an account is ever incorrectly linked.
     */
    if (teacher.userId === session.user.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete the administrator account currently being used.",
        },
        { status: 400 },
      );
    }

    const teacherName =
      `${teacher.firstName} ${teacher.lastName}`.trim();

    /*
     * Capture counts before deletion for the audit entry.
     */
    const [
      assignmentCount,
      classMasterAssignmentCount,
      resultCount,
    ] = await Promise.all([
      prisma.teacherAssignment.count({
        where: {
          teacherId: teacher.id,
        },
      }),

      prisma.classMasterAssignment.count({
        where: {
          teacherId: teacher.id,
        },
      }),

      prisma.result.count({
        where: {
          enteredById: teacher.id,
        },
      }),
    ]);

    /*
     * Delete everything belonging specifically to the teacher.
     *
     * Results are NOT deleted. Their teacher reference is simply
     * removed so historical results remain available.
     */
    await prisma.$transaction(async (tx) => {
      /*
       * Preserve historical results.
       */
      await tx.result.updateMany({
        where: {
          enteredById: teacher.id,
        },
        data: {
          enteredById: null,
        },
      });

      /*
       * Remove subject-teacher assignments.
       */
      await tx.teacherAssignment.deleteMany({
        where: {
          teacherId: teacher.id,
        },
      });

      /*
       * Remove Class Teacher / Form Master assignments.
       */
      await tx.classMasterAssignment.deleteMany({
        where: {
          teacherId: teacher.id,
        },
      });

      /*
       * Remove the teacher profile.
       */
      await tx.teacher.delete({
        where: {
          id: teacher.id,
        },
      });

      /*
       * Remove the teacher's login account.
       *
       * The Teacher record is deleted first, so its
       * user relationship is no longer blocking deletion.
       */
      await tx.user.delete({
        where: {
          id: teacher.userId,
        },
      });
    });

    /*
     * Create the audit record AFTER deletion.
     *
     * The audit record belongs to the administrator who
     * performed the deletion, not to the deleted teacher.
     */
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_TEACHER",
        entity: "Teacher",
        entityId: teacher.id,
        details: {
          teacherId: teacher.id,
          staffNo: teacher.staffNo,
          teacherName,
          email: teacher.user.email,
          removedSubjectAssignments:
            assignmentCount,
          removedClassMasterAssignments:
            classMasterAssignmentCount,
          preservedResults: resultCount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${teacherName} has been deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "Delete teacher error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete teacher. No changes were made.",
      },
      { status: 500 },
    );
  }
}