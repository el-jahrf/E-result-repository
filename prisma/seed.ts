import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================
  // ADMIN ACCOUNT
  // =========================

  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@eresult.local",
    },
    update: {
      passwordHash,
      isActive: true,
      role: "ADMIN",
    },
    create: {
      email: "admin@eresult.local",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Admin account ready:", admin.email);

  // =========================
  // ACADEMIC SESSION
  // =========================

  const session = await prisma.academicSession.upsert({
    where: {
      name: "2025/2026",
    },
    update: {
      isCurrent: true,
    },
    create: {
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-07-31"),
      isCurrent: true,
    },
  });

  console.log("Academic session ready:", session.name);

  // =========================
  // CLASSES
  // =========================

  const classes = [
    {
      name: "JSS 1A",
      level: "JSS 1",
      arm: "A",
      section: "JSS" as const,
    },
    {
      name: "JSS 2A",
      level: "JSS 2",
      arm: "A",
      section: "JSS" as const,
    },
    {
      name: "JSS 3A",
      level: "JSS 3",
      arm: "A",
      section: "JSS" as const,
    },
    {
      name: "SS 1A",
      level: "SS 1",
      arm: "A",
      section: "SS" as const,
    },
    {
      name: "SS 2A",
      level: "SS 2",
      arm: "A",
      section: "SS" as const,
    },
    {
      name: "SS 3A",
      level: "SS 3",
      arm: "A",
      section: "SS" as const,
    },
  ];

  for (const item of classes) {
    const schoolClass = await prisma.class.upsert({
      where: {
        name_arm: {
          name: item.name,
          arm: item.arm,
        },
      },
      update: {
        level: item.level,
        section: item.section,
        isActive: true,
      },
      create: {
        name: item.name,
        level: item.level,
        arm: item.arm,
        section: item.section,
        isActive: true,
      },
    });

    console.log("Class ready:", schoolClass.name);
  }

  // =========================
  // SUBJECTS
  // =========================

  const subjects = [
    {
      code: "MATH",
      name: "Mathematics",
      type: "CORE" as const,
    },
    {
      code: "ENG",
      name: "English Language",
      type: "CORE" as const,
    },
    {
      code: "PHY",
      name: "Physics",
      type: "CORE" as const,
    },
    {
      code: "CHEM",
      name: "Chemistry",
      type: "CORE" as const,
    },
    {
      code: "BIO",
      name: "Biology",
      type: "CORE" as const,
    },
    {
      code: "CSC",
      name: "Computer Science",
      type: "CORE" as const,
    },
    {
      code: "ECO",
      name: "Economics",
      type: "CORE" as const,
    },
    {
      code: "GOV",
      name: "Government",
      type: "CORE" as const,
    },
    {
      code: "LIT",
      name: "Literature in English",
      type: "CORE" as const,
    },
    {
      code: "CIVIC",
      name: "Civic Education",
      type: "CORE" as const,
    },
  ];

  for (const item of subjects) {
    const subject = await prisma.subject.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        type: item.type,
        isActive: true,
      },
      create: {
        code: item.code,
        name: item.name,
        type: item.type,
        isActive: true,
      },
    });

    console.log("Subject ready:", subject.name);
  }

  // =========================
  // TEACHERS
  // =========================

  const teacherPasswordHash = await bcrypt.hash("Teacher@12345", 12);

  const teacherData = [
    {
      email: "teacher.math@eresult.local",
      staffNo: "STF-001",
      firstName: "Ibrahim",
      lastName: "Musa",
    },
    {
      email: "teacher.english@eresult.local",
      staffNo: "STF-002",
      firstName: "Amina",
      lastName: "Yusuf",
    },
    {
      email: "teacher.science@eresult.local",
      staffNo: "STF-003",
      firstName: "Daniel",
      lastName: "Okoro",
    },
  ];

  const teachers = [];

  for (const item of teacherData) {
    const user = await prisma.user.upsert({
      where: {
        email: item.email,
      },
      update: {
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
        isActive: true,
      },
      create: {
        email: item.email,
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
        isActive: true,
      },
    });

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        staffNo: item.staffNo,
      },
    });

    const teacher = existingTeacher
      ? await prisma.teacher.update({
          where: {
            staffNo: item.staffNo,
          },
          data: {
            userId: user.id,
            firstName: item.firstName,
            lastName: item.lastName,
            isActive: true,
          },
        })
      : await prisma.teacher.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            staffNo: item.staffNo,
            firstName: item.firstName,
            lastName: item.lastName,
            isActive: true,
          },
        });

    teachers.push(teacher);

    console.log(
      "Teacher ready:",
      `${teacher.firstName} ${teacher.lastName}`
    );
  }

  // =========================
  // STUDENTS
  // =========================

  const studentData = [
    {
      admissionNo: "ADM-2026-001",
      firstName: "Aisha",
      middleName: "Ibrahim",
      lastName: "Bello",
      gender: "FEMALE" as const,
      className: "JSS 1A",
    },
    {
      admissionNo: "ADM-2026-002",
      firstName: "Muhammad",
      middleName: "Aliyu",
      lastName: "Bello",
      gender: "MALE" as const,
      className: "JSS 1A",
    },
    {
      admissionNo: "ADM-2026-003",
      firstName: "Fatima",
      middleName: "Sani",
      lastName: "Abdullahi",
      gender: "FEMALE" as const,
      className: "JSS 2A",
    },
    {
      admissionNo: "ADM-2026-004",
      firstName: "Abdullahi",
      middleName: "Musa",
      lastName: "Yusuf",
      gender: "MALE" as const,
      className: "SS 1A",
    },
    {
      admissionNo: "ADM-2026-005",
      firstName: "Maryam",
      middleName: "Usman",
      lastName: "Ibrahim",
      gender: "FEMALE" as const,
      className: "SS 2A",
    },
    {
      admissionNo: "ADM-2026-006",
      firstName: "Yusuf",
      middleName: "Haruna",
      lastName: "Musa",
      gender: "MALE" as const,
      className: "SS 3A",
    },
  ];

  const students = [];

  for (const item of studentData) {
    const student = await prisma.student.upsert({
      where: {
        admissionNo: item.admissionNo,
      },
      update: {
        firstName: item.firstName,
        middleName: item.middleName,
        lastName: item.lastName,
        gender: item.gender,
        isActive: true,
      },
      create: {
        admissionNo: item.admissionNo,
        firstName: item.firstName,
        middleName: item.middleName,
        lastName: item.lastName,
        gender: item.gender,
        isActive: true,
      },
    });

    const schoolClass = await prisma.class.findFirst({
      where: {
        name: item.className,
      },
    });

    if (!schoolClass) {
      throw new Error(`Class not found: ${item.className}`);
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_sessionId_term: {
          studentId: student.id,
          sessionId: session.id,
          term: "FIRST",
        },
      },
      update: {
        classId: schoolClass.id,
        attendanceOpened: 100,
        attendancePresent: 92,
        attendanceAbsent: 8,
        attendancePercentage: 92,
      },
      create: {
        studentId: student.id,
        classId: schoolClass.id,
        sessionId: session.id,
        term: "FIRST",
        attendanceOpened: 100,
        attendancePresent: 92,
        attendanceAbsent: 8,
        attendancePercentage: 92,
      },
    });

    students.push({
      student,
      enrollment,
      classId: schoolClass.id,
    });

    console.log(
      "Student ready:",
      `${student.firstName} ${student.lastName}`,
      `-> ${schoolClass.name}`
    );
  }

  // =========================
  // TEACHER ASSIGNMENTS
  // =========================

  const mathTeacher = teachers[0];
  const englishTeacher = teachers[1];
  const scienceTeacher = teachers[2];

  if (!mathTeacher || !englishTeacher || !scienceTeacher) {
    throw new Error("Required teachers were not created.");
  }

  const jss1 = await prisma.class.findFirst({
    where: { name: "JSS 1A" },
  });

  const jss2 = await prisma.class.findFirst({
    where: { name: "JSS 2A" },
  });

  const ss1 = await prisma.class.findFirst({
    where: { name: "SS 1A" },
  });

  if (!jss1 || !jss2 || !ss1) {
    throw new Error("Required classes were not found.");
  }

  const math = await prisma.subject.findUnique({
    where: { code: "MATH" },
  });

  const english = await prisma.subject.findUnique({
    where: { code: "ENG" },
  });

  const physics = await prisma.subject.findUnique({
    where: { code: "PHY" },
  });

  if (!math || !english || !physics) {
    throw new Error("Required subjects were not found.");
  }

  const assignments = [
    {
      teacherId: mathTeacher.id,
      classId: jss1.id,
      subjectId: math.id,
    },
    {
      teacherId: englishTeacher.id,
      classId: jss1.id,
      subjectId: english.id,
    },
    {
      teacherId: scienceTeacher.id,
      classId: ss1.id,
      subjectId: physics.id,
    },
    {
      teacherId: mathTeacher.id,
      classId: jss2.id,
      subjectId: math.id,
    },
  ];

  for (const item of assignments) {
    await prisma.teacherAssignment.upsert({
      where: {
        teacherId_classId_subjectId_sessionId_term: {
          teacherId: item.teacherId,
          classId: item.classId,
          subjectId: item.subjectId,
          sessionId: session.id,
          term: "FIRST",
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        teacherId: item.teacherId,
        classId: item.classId,
        subjectId: item.subjectId,
        sessionId: session.id,
        term: "FIRST",
      },
    });
  }

  console.log("Teacher assignments ready.");

  // =========================
  // RESULTS
  // =========================

  const resultData = [
    {
      admissionNo: "ADM-2026-001",
      subjectCode: "MATH",
      ca1: 9,
      ca2: 9,
      exam: 68,
    },
    {
      admissionNo: "ADM-2026-001",
      subjectCode: "ENG",
      ca1: 8,
      ca2: 9,
      exam: 65,
    },
    {
      admissionNo: "ADM-2026-002",
      subjectCode: "MATH",
      ca1: 8,
      ca2: 8,
      exam: 60,
    },
    {
      admissionNo: "ADM-2026-002",
      subjectCode: "ENG",
      ca1: 7,
      ca2: 8,
      exam: 58,
    },
    {
      admissionNo: "ADM-2026-003",
      subjectCode: "MATH",
      ca1: 9,
      ca2: 8,
      exam: 64,
    },
    {
      admissionNo: "ADM-2026-004",
      subjectCode: "PHY",
      ca1: 8,
      ca2: 9,
      exam: 62,
    },
  ];

  function getGrade(total: number) {
    if (total >= 70) return { grade: "A", remark: "Excellent" };
    if (total >= 60) return { grade: "B", remark: "Very Good" };
    if (total >= 50) return { grade: "C", remark: "Good" };
    if (total >= 45) return { grade: "D", remark: "Fair" };
    if (total >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  }

  for (const item of resultData) {
    const studentRecord = students.find(
      (itemStudent) =>
        itemStudent.student.admissionNo === item.admissionNo
    );

    if (!studentRecord) {
      throw new Error(`Student not found: ${item.admissionNo}`);
    }

    const subject = await prisma.subject.findUnique({
      where: {
        code: item.subjectCode,
      },
    });

    if (!subject) {
      throw new Error(`Subject not found: ${item.subjectCode}`);
    }

    const caTotal = item.ca1 + item.ca2;
    const totalScore = caTotal + item.exam;
    const { grade, remark } = getGrade(totalScore);

    const teacherForSubject =
      item.subjectCode === "ENG"
        ? englishTeacher
        : item.subjectCode === "PHY"
          ? scienceTeacher
          : mathTeacher;

    await prisma.result.upsert({
      where: {
        studentId_subjectId_sessionId_term: {
          studentId: studentRecord.student.id,
          subjectId: subject.id,
          sessionId: session.id,
          term: "FIRST",
        },
      },
      update: {
        enrollmentId: studentRecord.enrollment.id,
        classId: studentRecord.classId,
        ca1Score: item.ca1,
        ca2Score: item.ca2,
        caTotal,
        examScore: item.exam,
        totalScore,
        grade,
        remark,
        status: "PUBLISHED",
        enteredById: teacherForSubject.id,
        publishedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        studentId: studentRecord.student.id,
        enrollmentId: studentRecord.enrollment.id,
        classId: studentRecord.classId,
        subjectId: subject.id,
        sessionId: session.id,
        term: "FIRST",
        ca1Score: item.ca1,
        ca2Score: item.ca2,
        caTotal,
        examScore: item.exam,
        totalScore,
        grade,
        remark,
        status: "PUBLISHED",
        enteredById: teacherForSubject.id,
        publishedAt: new Date(),
      },
    });
  }

  console.log("Results ready.");

  // =========================
  // TERM SUMMARIES
  // =========================

  for (const record of students.slice(0, 4)) {
    const results = await prisma.result.findMany({
      where: {
        enrollmentId: record.enrollment.id,
        sessionId: session.id,
        term: "FIRST",
      },
    });

    if (results.length === 0) {
      continue;
    }

    const total = results.reduce(
      (sum, result) => sum + Number(result.totalScore ?? 0),
      0
    );

    const average = total / results.length;

    await prisma.termSummary.upsert({
      where: {
        enrollmentId: record.enrollment.id,
      },
      update: {
        overallTotal: total,
        average,
        position: 1,
        positionOutOf: 2,
        performanceRate: average,
        classScoringAverage: average - 3,
        teacherComment: "A good performance. Keep working hard.",
        headTeacherComment: "Good progress. Continue to improve.",
        nextTermDate: new Date("2026-01-12"),
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        enrollmentId: record.enrollment.id,
        overallTotal: total,
        average,
        position: 1,
        positionOutOf: 2,
        performanceRate: average,
        classScoringAverage: average - 3,
        teacherComment: "A good performance. Keep working hard.",
        headTeacherComment: "Good progress. Continue to improve.",
        nextTermDate: new Date("2026-01-12"),
        updatedAt: new Date(),
      },
    });
  }

  console.log("Term summaries ready.");

  console.log("");
  console.log("====================================");
  console.log("DATABASE SEED COMPLETED SUCCESSFULLY");
  console.log("====================================");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });