/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { SpeakingService } from "./speaking.service.js";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role } from "@prisma/client";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await SpeakingService.createExam({
    ...req.body,
    creatorEmail: user.email,
  });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "IELTS Speaking Exam created successfully with parts and questions",
    data: result,
  });
});

const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { myExams } = req.query as any;

  const filterEmail =
    myExams === "true" && user.role === Role.TEACHER ? user.email : undefined;

  const result = await SpeakingService.getAllExams(user.role, filterEmail);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking exams fetched successfully",
    data: result,
  });
});

const getExamById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;
  const result = await SpeakingService.getExamById(id, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking exam fetched successfully",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await SpeakingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to update this exam"
      );
    }
  }

  const result = await SpeakingService.updateExam(id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking exam updated successfully",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await SpeakingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to delete this exam"
      );
    }
  }

  await SpeakingService.deleteExam(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking exam deleted successfully",
    data: null,
  });
});

const submitExamAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any; // examId
  const result = await SpeakingService.submitExamAttempt(
    user.userId,
    id,
    req.body
  );

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Speaking exam attempt submitted successfully",
    data: result,
  });
});

const gradeAttempt = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params as any;
  const result = await SpeakingService.gradeAttempt(attemptId, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking attempt graded successfully",
    data: result,
  });
});

const getAttemptReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;
  const result = await SpeakingService.getAttemptReview(
    user.userId,
    attemptId,
    user.role
  );

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Speaking exam attempt review retrieved successfully",
    data: result,
  });
});

const getStudentAttemptHistory = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const result = await SpeakingService.getStudentAttemptHistory(user.userId);

    sendResponse(res, {
      success: true,
      httpCode: status.OK,
      message: "Student speaking exam attempt history retrieved successfully",
      data: result,
    });
  }
);

// Upload audio response
const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(status.BAD_REQUEST, "Please upload an audio file");
  }

  req.setTimeout(600000); // 10 minutes timeout

  const uploadResult = await uploadFileToCloudinary(
    req.file.buffer,
    req.file.originalname
  );

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Audio uploaded successfully to Cloudinary",
    data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
    },
  });
});

export const SpeakingController = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  gradeAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
  uploadFile,
};
