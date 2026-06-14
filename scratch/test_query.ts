import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/app/lib/prisma.js";

async function main() {
  const exams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      creatorId: true,
      isPublished: true,
    }
  });
  console.log("Existing exams in database:", JSON.stringify(exams, null, 2));
}

main()
  .catch((e) => {
    console.error("Error querying exams:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
