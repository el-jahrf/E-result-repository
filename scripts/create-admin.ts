import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.production" });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const password = process.env.ADMIN_PASSWORD;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Check your .env.production file.",
    );
  }

  if (!password || password.length < 12) {
    throw new Error(
      "Choose an administrator password with at least 12 characters.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.upsert({
      where: {
        email: "harunamuhd999@gmail.com",
      },
      update: {
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        email: "harunamuhd999@gmail.com",
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("Administrator account is ready.");
    console.log("Login email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Active:", admin.isActive);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Administrator setup failed:", error);
  process.exitCode = 1;
});