const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash =
    "$2b$12$U/Wwaefx3FBMYOqboeCcE.iXbHs6FOml/CCcG5oFB4XNFTnGH9cuy";

  const user = await prisma.user.update({
    where: {
      email: "hajaraabdullahi@gmail.com",
    },
    data: {
      passwordHash,
    },
  });

  console.log("Password reset successfully.");
  console.log("Teacher:", user.email);
}

main()
  .catch((error) => {
    console.error("Password reset failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });