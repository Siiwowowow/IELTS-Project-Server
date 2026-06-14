// scratch/test_auth_api.ts
import { auth } from "../src/app/lib/auth.js";

async function main() {
    console.log("auth.api properties:", Object.keys(auth.api));
}

main().catch(console.error);
