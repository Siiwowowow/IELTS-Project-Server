import { prisma } from "../src/app/lib/prisma.js";

async function main() {
  console.log("Connecting...");
  const users = await prisma.user.findMany({ take: 1 });
  console.log("Success! Users count:", users.length);
}

main()
  .catch(err => {
    console.error("Connection failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
