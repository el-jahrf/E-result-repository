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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });