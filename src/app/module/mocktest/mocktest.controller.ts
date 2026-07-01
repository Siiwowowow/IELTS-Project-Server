// src/app/module/mocktest/mocktest.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { MockTestService } from "./mocktest.service.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role } from "@prisma/client";

const createMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await MockTestService.createMockTest({
    ...req.body,
    creatorEmail: user.email,
  });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Full Mock Test created successfully",
    data: result,
  });
});

const createFullMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await MockTestService.createFullMockTest({
    ...req.body,
    creatorEmail: user.email,
  });

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Premium CBT Full Mock Test created successfully with all modules.",
    data: result,
  });
});

const getAllMockTests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { myExams } = req.query as any;

  const filterEmail =
    myExams === "true" && user.role === Role.TEACHER ? user.email : undefined;

  const result = await MockTestService.getAllMockTests(user.role, filterEmail);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock tests fetched successfully",
    data: result,
  });
});

const getMockTestById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const result = await MockTestService.getMockTestById(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock test fetched successfully",
    data: result,
  });
});

const updateMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Teacher ownership validation
  if (user.role === Role.TEACHER) {
    const mockTest = await MockTestService.getMockTestById(id);
    if (mockTest.creatorEmail && mockTest.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to update this mock test"
      );
    }
  }

  const result = await MockTestService.updateMockTest(id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock test updated successfully",
    data: result,
  });
});

const deleteMockTest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id } = req.params as any;

  // Teacher ownership validation
  if (user.role === Role.TEACHER) {
    const mockTest = await MockTestService.getMockTestById(id);
    if (mockTest.creatorEmail && mockTest.creatorEmail !== user.email) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to delete this mock test"
      );
    }
  }

  await MockTestService.deleteMockTest(id);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock test deleted successfully",
    data: null,
  });
});

const createAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { id: mockTestId } = req.params as any;

  const result = await MockTestService.createAttempt(mockTestId, user.id);

  sendResponse(res, {
    success: true,
    httpCode: status.CREATED,
    message: "Mock test attempt started successfully",
    data: result,
  });
});

const getAttemptById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;

  const result = await MockTestService.getAttemptById(attemptId, user.id, user.role);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock test attempt details fetched successfully",
    data: result,
  });
});

const updateAttempt = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { attemptId } = req.params as any;

  const result = await MockTestService.updateAttempt(attemptId, user.id, req.body);

  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Mock test attempt updated successfully",
    data: result,
  });
});

export const MockTestController = {
  createMockTest,
  createFullMockTest,
  getAllMockTests,
  getMockTestById,
  updateMockTest,
  deleteMockTest,
  createAttempt,
  getAttemptById,
  updateAttempt,
};
