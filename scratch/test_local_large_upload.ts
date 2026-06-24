import { jwtUtils } from "../src/app/utils/jwt.js";
import { envVars } from "../src/app/config/env.js";

const testToken = jwtUtils.createToken(
  {
    userId: "test-user-id",
    role: "TEACHER",
    email: "teacher@test.com",
    status: "ACTIVE",
    emailVerified: true,
  },
  envVars.ACCESS_TOKEN_SECRET,
  { expiresIn: "1h" }
);

async function testLargeUpload() {
  console.log("Fetching the tiny MP3 file...");
  const response = await fetch("https://www.w3schools.com/html/horse.mp3");
  if (!response.ok) throw new Error("Failed to fetch tiny MP3");
  const smallBuffer = Buffer.from(await response.arrayBuffer());
  console.log("Tiny MP3 size:", smallBuffer.length, "bytes");

  // Duplicate the tiny MP3 buffer 390 times to get ~10.75 MB
  const duplications = 390;
  const largeBuffer = Buffer.concat(Array(duplications).fill(smallBuffer));
  console.log("Constructed large MP3 size:", largeBuffer.length, "bytes (~" + (largeBuffer.length / 1024 / 1024).toFixed(2) + " MB)");

  const blob = new Blob([largeBuffer], { type: "audio/mpeg" });
  const form = new FormData();
  form.append("file", blob, "test_audio_15mb.mp3");

  console.log("Posting 15MB audio to http://localhost:5000/api/v1/listening/upload...");
  try {
    const start = Date.now();
    const res = await fetch("http://localhost:5000/api/v1/listening/upload", {
      method: "POST",
      headers: {
        Cookie: `accessToken=${testToken}`,
      },
      body: form,
    });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    const status = res.status;
    const bodyText = await res.text();
    console.log("Upload completed in", duration, "seconds");
    console.log("Status Code:", status);
    console.log("Response Body:", bodyText);
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testLargeUpload();
