// src/app/module/teacher/teacher.middlewares.ts
import { NextFunction, Request, Response } from "express";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";
import { IUpdateTeacherProfilePayload } from "./teacher.interface.js";

export const updateTeacherProfileMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse JSON data if sent as string in multipart form-data
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }

    const payload: IUpdateTeacherProfilePayload = req.body;

    const files = req.files as {
      [fieldName: string]: Express.Multer.File[] | undefined;
    };

    if (files?.profilePhoto?.[0]) {
      const file = files.profilePhoto[0];
      const uploadResult = await uploadFileToCloudinary(
        file.buffer,
        file.originalname
      );
      payload.profilePhoto = uploadResult.secure_url;
    }

    req.body = payload;
    next();
  } catch (error) {
    next(error);
  }
};
