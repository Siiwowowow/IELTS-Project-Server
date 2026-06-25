/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { WritingService } from "./writing.service.js";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role } from "@prisma/client";

const createExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await WritingService.createExam({
    ...req.body,
    creatorEmail: user.email,
  });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "IELTS Writing Exam created successfully with tasks",
    data: result,
  });
});

const getAllExams = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { myExams } = req.query as any;

  const filterEmail =
    myExams === "true" && user.role === Role.TEACHER ? user.email : undefined;

  const result = await WritingService.getAllExams(user.role, filterEmail);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing exams fetched successfully",
    data: result,
  });
});

const getExamById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;
  const result = await WritingService.getExamById(id, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing exam fetched successfully",
    data: result,
  });
});

const updateExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await WritingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to update this exam"
      );
    }
  }

  const result = await WritingService.updateExam(id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing exam updated successfully",
    data: result,
  });
});

const deleteExam = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Ownership check for TEACHER role
  if (user.role === Role.TEACHER) {
    const exam = await WritingService.getExamById(id, user.role);
    if (exam.creatorEmail && exam.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to delete this exam"
      );
    }
  }

  await WritingService.deleteExam(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing exam deleted successfully",
    data: null,
  });
});

const submitExamAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any; // examId
  const result = await WritingService.submitExamAttempt(
    user.userId,
    id,
    req.body
  );

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Writing exam attempt submitted successfully",
    data: result,
  });
});

const gradeAttempt = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params as any;
  const result = await WritingService.gradeAttempt(attemptId, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing attempt graded successfully",
    data: result,
  });
});

const getAttemptReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;
  const result = await WritingService.getAttemptReview(
    user.userId,
    attemptId,
    user.role
  );

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Writing exam attempt review retrieved successfully",
    data: result,
  });
});

const getStudentAttemptHistory = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const result = await WritingService.getStudentAttemptHistory(user.userId);

    sendResponse(res, {
      success: true,
      httpCode: status.OK,
      message: "Student writing exam attempt history retrieved successfully",
      data: result,
    });
  }
);

// Upload image/PDF for writing task stimulus (chart, diagram, etc.)
const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(status.BAD_REQUEST, "Please upload a file");
  }

  req.setTimeout(600000);

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

export const WritingController = {
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
