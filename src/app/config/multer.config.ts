/* eslint-disable @typescript-eslint/no-explicit-any */
// src/config/multer.config.ts
import multer from "multer";

// Use memory storage to get buffer for Cloudinary upload
const storage = multer.memoryStorage();

// File filter to allow images, PDFs, and audio files
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|mp3|wav|m4a|ogg|aac|flac|mpeg|webm|mp4/;
  const extname = allowedExtensions.test(file.originalname.toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image, PDF, and audio files are allowed"));
  }
};

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit to support large listening audio recordings
  },
  fileFilter: fileFilter,
});