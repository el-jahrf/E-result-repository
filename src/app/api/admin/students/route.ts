import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const MAX_PHOTO_LENGTH = 2_000_000;

const VALID_TERMS = ["FIRST", "SECOND", "THIRD"] as const;

type ValidTerm = (typeof VALID_TERMS)[number];

function validatePhotoData(photoData: unknown) {
  if (photoData === null || photoData === undefined) {
    return null;
  }

  if (typeof photoData !== "string") {
    return "Invalid passport photograph.";
  }

  if (photoData.length > MAX_PHOTO_LENGTH) {
    return "Passport photograph is too large.";
  }

  if (
    !photoData.startsWith("data:image/jpeg;base64,") &&
    !photoData.startsWith("data:image/png;base64,") &&
    !photoData.startsWith("data:image/webp;base64,")
  ) {
    return "Passport photograph must be JPG, PNG or WebP.";
  }

  return null;
}

function parseDateOfBirth(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isValidTerm(value: unknown): value is ValidTerm {
  return (
    typeof value === "string" &&
    VALID_TERMS.includes(value as ValidTerm)
  );
}

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

    const students = await prisma.student.findMany({
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        middleName: true,
        lastName: true,
        gender: true,
        isActive: true,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load students.",
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
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      admissionNo,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      photoData,
      sessionId,
      classId,
      term,
    } = body;

    if (!admissionNo || !firstName || !lastName || !gender) {
      return NextResponse.json(
        {
          error:
            "Admission number, first name, last name, and gender are required.",
        },
        { status: 400 }
      );
    }

    if (!sessionId || !classId || !term) {
      return NextResponse.json(
        {
          error:
            "Academic session, class, and term are required for initial enrollment.",
        },
        { status: 400 }
      );
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender." },
        { status: 400 }
      );
    }

    if (!isValidTerm(term)) {
      return NextResponse.json(
        { error: "Invalid academic term." },
        { status: 400 }
      );
    }

    const photoError = validatePhotoData(photoData);

    if (photoError) {
      return NextResponse.json(
        { error: photoError },
        { status: 400 }
      );
    }

    const cleanAdmissionNo = String(admissionNo).trim();
    const cleanFirstName = String(firstName).trim();

    const cleanMiddleName = middleName
      ? String(middleName).trim()
      : null;

    const cleanLastName = String(lastName).trim();

    const cleanSessionId = String(sessionId).trim();
    const cleanClassId = String(classId).trim();

    if (
      !cleanAdmissionNo ||
      !cleanFirstName ||
      !cleanLastName
    ) {
      return NextResponse.json(
        {
          error:
            "Student name and admission number cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (!cleanSessionId || !cleanClassId) {
      return NextResponse.json(
        {
          error:
            "Academic session and class cannot be empty.",
        },
        { status: 400 }
      );
    }

    const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);

    if (dateOfBirth && !parsedDateOfBirth) {
      return NextResponse.json(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: {
        admissionNo: cleanAdmissionNo,
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          error:
            "A student with this admission number already exists.",
        },
        { status: 409 }
      );
    }

    const academicSession =
      await prisma.academicSession.findUnique({
        where: {
          id: cleanSessionId,
        },
      });

    if (!academicSession) {
      return NextResponse.json(
        { error: "Selected academic session was not found." },
        { status: 404 }
      );
    }

    const schoolClass = await prisma.class.findUnique({
      where: {
        id: cleanClassId,
      },
    });

    if (!schoolClass) {
      return NextResponse.json(
        { error: "Selected class was not found." },
        { status: 404 }
      );
    }

    if (!schoolClass.isActive) {
      return NextResponse.json(
        { error: "The selected class is inactive." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(cleanLastName, 10);

    const result = await prisma.$transaction(async (tx) => {
      const internalEmail = `student-${randomUUID()}@risingfoundation.local`;

      const user = await tx.user.create({
        data: {
          email: internalEmail,
          passwordHash,
          role: "STUDENT",
          isActive: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionNo: cleanAdmissionNo,
          firstName: cleanFirstName,
          middleName: cleanMiddleName,
          lastName: cleanLastName,
          gender,
          dateOfBirth: parsedDateOfBirth,
          photoData: photoData || null,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: schoolClass.id,
          sessionId: academicSession.id,
          term,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_STUDENT",
          entity: "Student",
          entityId: student.id,
          details: {
            admissionNo: cleanAdmissionNo,
            studentName: `${cleanFirstName} ${cleanLastName}`,
            accountCreated: true,
            enrollmentCreated: true,
            enrollmentId: enrollment.id,
            sessionId: academicSession.id,
            sessionName: academicSession.name,
            classId: schoolClass.id,
            className: schoolClass.name,
            classArm: schoolClass.arm,
            term,
          },
        },
      });

      return {
        student,
        enrollment,
      };
    });

    return NextResponse.json(
      {
        message:
          "Student created and enrolled successfully.",
        student: result.student,
        enrollment: result.enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create student error:", error);

    return NextResponse.json(
      { error: "Failed to create student and enrollment." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      admissionNo,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      photoData,
      password,
      isActive,
    } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      );
    }

    if (!admissionNo || !firstName || !lastName || !gender) {
      return NextResponse.json(
        {
          error:
            "Admission number, first name, last name, and gender are required.",
        },
        { status: 400 }
      );
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender." },
        { status: 400 }
      );
    }

    const photoError = validatePhotoData(photoData);

    if (photoError) {
      return NextResponse.json(
        { error: photoError },
        { status: 400 }
      );
    }

    const cleanAdmissionNo = String(admissionNo).trim();
    const cleanFirstName = String(firstName).trim();

    const cleanMiddleName = middleName
      ? String(middleName).trim()
      : null;

    const cleanLastName = String(lastName).trim();

    if (!cleanAdmissionNo || !cleanFirstName || !cleanLastName) {
      return NextResponse.json(
        { error: "Student name and admission number cannot be empty." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const existingAdmission = await prisma.student.findUnique({
      where: {
        admissionNo: cleanAdmissionNo,
      },
    });

    if (existingAdmission && existingAdmission.id !== id) {
      return NextResponse.json(
        {
          error:
            "A student with this admission number already exists.",
        },
        { status: 409 }
      );
    }

    const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);

    if (dateOfBirth && !parsedDateOfBirth) {
      return NextResponse.json(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }

    if (
      password !== undefined &&
      password !== null &&
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 400 }
      );
    }

    if (
      typeof password === "string" &&
      password.length > 0 &&
      password.length < 4
    ) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters." },
        { status: 400 }
      );
    }

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const studentUpdateData: {
        admissionNo: string;
        firstName: string;
        middleName: string | null;
        lastName: string;
        gender: "MALE" | "FEMALE";
        dateOfBirth: Date | null;
        photoData?: string | null;
        isActive?: boolean;
      } = {
        admissionNo: cleanAdmissionNo,
        firstName: cleanFirstName,
        middleName: cleanMiddleName,
        lastName: cleanLastName,
        gender,
        dateOfBirth: parsedDateOfBirth,
      };

      if (photoData !== undefined) {
        studentUpdateData.photoData = photoData || null;
      }

      if (typeof isActive === "boolean") {
        studentUpdateData.isActive = isActive;
      }

      const updated = await tx.student.update({
        where: { id },
        data: studentUpdateData,
      });

      if (student.userId) {
        const userUpdateData: {
          isActive?: boolean;
          passwordHash?: string;
        } = {};

        if (typeof isActive === "boolean") {
          userUpdateData.isActive = isActive;
        }

        if (
          typeof password === "string" &&
          password.length > 0
        ) {
          userUpdateData.passwordHash = await bcrypt.hash(
            password,
            10
          );
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: student.userId },
            data: userUpdateData,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_STUDENT",
          entity: "Student",
          entityId: updated.id,
          details: {
            admissionNo: cleanAdmissionNo,
            studentName: `${cleanFirstName} ${cleanLastName}`,
            passwordChanged:
              typeof password === "string" &&
              password.length > 0,
            photoUpdated: photoData !== undefined,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: "Student updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);

    return NextResponse.json(
      { error: "Failed to update student." },
      { status: 500 }
    );
  }
}