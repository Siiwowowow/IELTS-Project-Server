// scratch/check_sessions.ts
import { prisma } from "../src/app/lib/prisma.js";

async function main() {
    const sessions = await prisma.session.findMany({
        take: 5
    });
    console.log("Sessions:", JSON.stringify(sessions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
