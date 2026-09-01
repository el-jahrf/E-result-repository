import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    { name: "JSS 1A", level: "JSS 1", arm: "A" },
    { name: "JSS 2A", level: "JSS 2", arm: "A" },
    { name: "JSS 3A", level: "JSS 3", arm: "A" },
    { name: "SS 1A", level: "SS 1", arm: "A" },
    { name: "SS 2A", level: "SS 2", arm: "A" },
    { name: "SS 3A", level: "SS 3", arm: "A" },
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
        isActive: true,
      },
      create: {
        name: item.name,
        level: item.level,
        arm: item.arm,
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

  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });