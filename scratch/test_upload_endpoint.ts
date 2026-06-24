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

async function testUpload() {
  console.log("Fetching a 12.2MB MP3 file...");
  const response = await fetch("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3");
  if (!response.ok) throw new Error("Failed to fetch 12.2MB MP3");
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });

  const form = new FormData();
  form.append("file", blob, "test_audio_large.mp3");

  try {
    const res = await fetch("http://localhost:5000/api/v1/listening/upload", {
      method: "POST",
      headers: {
        Cookie: `accessToken=${testToken}`,
      },
      body: form,
    });
    const status = res.status;
    const bodyText = await res.text();
    console.log("Status Code:", status);
    console.log("Response Body:", bodyText);
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testUpload();
