/* eslint-disable @typescript-eslint/no-explicit-any */
// src/config/multer.config.ts
import multer from "multer";

// Use memory storage to get buffer for Cloudinary upload
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|pdf/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"));
  }
};

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});