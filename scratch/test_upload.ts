import { v2 as cloudinary } from "cloudinary";
import { envVars } from "../src/app/config/env.js";
import * as fs from "fs";
import * as path from "path";

cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

async function testSmallUploadLarge() {
  console.log("Fetching a small MP3 file...");
  const response = await fetch("https://www.w3schools.com/html/horse.mp3");
  if (!response.ok) throw new Error("Failed to fetch MP3");
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log("Downloaded size:", buffer.length, "bytes");

  const tempFilePath = path.join(process.cwd(), `temp_test_audio_small.mp3`);
  console.log("Writing buffer to temporary file:", tempFilePath);
  await fs.promises.writeFile(tempFilePath, buffer);

  console.log("Uploading MP3 via cloudinary.uploader.upload_large...");
  try {
    const res = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        tempFilePath,
        {
          resource_type: "video",
          public_id: "test-audio-small-upload-large",
          folder: "ph-healthcare/audios",
          chunk_size: 5000000, // 5MB chunks
        },
        async (error, result) => {
          // Cleanup temp file
          try {
            await fs.promises.unlink(tempFilePath);
            console.log("Temporary file deleted successfully.");
          } catch (unlinkError) {
            console.error("Failed to delete temp file:", unlinkError);
          }

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    console.log("Upload Large Success URL:", (res as any).secure_url);
  } catch (err) {
    console.error("Upload Large Failed:", err);
  }
}

testSmallUploadLarge();
