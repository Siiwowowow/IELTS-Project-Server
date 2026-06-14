/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ReadingService } from "./reading.service.js";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role } from "@prisma/client";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await ReadingService.createExam({ ...req.body, creatorEmail: user.email });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "IELTS Reading Exam created successfully with passages and questions",
    data: result,
  });
});

const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { myExams } = req.query as any;

  // Filter only if myExams parameter is present and role is TEACHER
  const filterEmail = myExams === "true" && user.role === Role.TEACHER ? user.email : undefined;

  const result = await ReadingService.getAllExams(user.role, filterEmail);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Exams fetched successfully",
    data: result,
  });
});

const getExamById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;
  const result = await ReadingService.getExamById(id, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Exam fetched successfully",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Enforce ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await ReadingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to update this exam");
    }
  }

  const result = await ReadingService.updateExam(id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Exam updated successfully",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Enforce ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await ReadingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to delete this exam");
    }
  }

  await ReadingService.deleteExam(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Exam deleted successfully",
    data: null,
  });
});

const submitExamAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any; // examId
  const result = await ReadingService.submitExamAttempt(user.userId, id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Exam attempt submitted and auto-graded successfully",
    data: result,
  });
});

const getAttemptReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;
  const result = await ReadingService.getAttemptReview(user.userId, attemptId, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Exam attempt review retrieved successfully",
    data: result,
  });
});

const getStudentAttemptHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await ReadingService.getStudentAttemptHistory(user.userId);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Student exam attempt history retrieved successfully",
    data: result,
  });
});

// File Upload handler for PDF or Image for teachers/admins
const uploadExamFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(status.BAD_REQUEST, "Please upload a file");
  }

  const uploadResult = await uploadFileToCloudinary(
    req.file.buffer,
    req.file.originalname
  );

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "File uploaded successfully to Cloudinary",
    data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
    },
  });
});

export const ReadingController = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
  uploadExamFile,
};
