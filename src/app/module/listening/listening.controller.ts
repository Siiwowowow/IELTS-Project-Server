/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ListeningService } from "./listening.service.js";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role } from "@prisma/client";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await ListeningService.createExam({ ...req.body, creatorEmail: user.email });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "IELTS Listening Exam created successfully with sections and questions",
    data: result,
  });
});

const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { myExams } = req.query as any;

  // Filter only if myExams parameter is present and role is TEACHER
  const filterEmail = myExams === "true" && user.role === Role.TEACHER ? user.email : undefined;

  const result = await ListeningService.getAllExams(user.role, filterEmail);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Listening exams fetched successfully",
    data: result,
  });
});

const getExamById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;
  const result = await ListeningService.getExamById(id, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Listening exam fetched successfully",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Enforce ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await ListeningService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to update this exam");
    }
  }

  const result = await ListeningService.updateExam(id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Listening exam updated successfully",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Enforce ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await ListeningService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to delete this exam");
    }
  }

  await ListeningService.deleteExam(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Listening exam deleted successfully",
    data: null,
  });
});

const submitExamAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any; // examId
  const result = await ListeningService.submitExamAttempt(user.userId, id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Listening exam attempt submitted and auto-graded successfully",
    data: result,
  });
});

const getAttemptReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;
  const result = await ListeningService.getAttemptReview(user.userId, attemptId, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Listening exam attempt review retrieved successfully",
    data: result,
  });
});

const getStudentAttemptHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await ListeningService.getStudentAttemptHistory(user.userId);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Student listening exam attempt history retrieved successfully",
    data: result,
  });
});

// File Upload handler for audio files (MP3/WAV/etc.)
const uploadAudioFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(status.BAD_REQUEST, "Please upload an audio file");
  }

  // Set request and socket timeout to 10 minutes to accommodate large uploads on slow connections
  req.setTimeout(600000);

  const uploadResult = await uploadFileToCloudinary(
    req.file.buffer,
    req.file.originalname
  );

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Audio file uploaded successfully to Cloudinary",
    data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
    },
  });
});

export const ListeningController = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
  uploadAudioFile,
};
