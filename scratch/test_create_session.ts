// scratch/test_create_session.ts
import { auth } from "../src/app/lib/auth.js";
import { prisma } from "../src/app/lib/prisma.js";
import { createHash } from "node:crypto";

async function main() {
    try {
        const email = "testuser" + Date.now() + "@example.com";
        const password = "Password123!";
        
        // 1. Sign up
        const signupResult = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: "Test User"
            }
        });
        
        // 2. Manually verify email in DB
        await prisma.user.update({
            where: { id: signupResult.user.id },
            data: { emailVerified: true }
        });
        
        // 3. Sign in
        const signinResult = await auth.api.signInEmail({
            body: {
                email,
                password
            }
        });
        const rawToken = signinResult.token;
        console.log("Raw Session Token:", rawToken);
        
        // Wait 2 seconds for Redis to sync to DB (if it does)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Retrieve session from DB
        const sessions = await prisma.session.findMany({
            where: {
                userId: signupResult.user.id
            }
        });
        console.log("DB Sessions:", JSON.stringify(sessions, null, 2));
        
        if (sessions.length > 0) {
            const dbToken = sessions[0].token;
            const hashedRawToken = createHash("sha256").update(rawToken).digest("hex");
            console.log("Hashed Raw Token:", hashedRawToken);
            console.log("DB Token:        ", dbToken);
            console.log("Does it match?   ", dbToken === hashedRawToken);
        } else {
            console.log("No sessions in DB even after 2 seconds.");
        }
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
