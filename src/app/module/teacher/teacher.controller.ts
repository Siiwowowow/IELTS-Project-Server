// src/app/module/teacher/teacher.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { TeacherService } from "./teacher.service.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";

const createTeacher = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherService.createTeacher(req.body);

  sendResponse(res, {
    httpCode: status.CREATED,
    success: true,
    message: "Teacher created successfully",
    data: result,
  });
});

const getAllTeachers = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm, isDeleted } = req.query;

  const result = await TeacherService.getAllTeachers({
    searchTerm: searchTerm as string,
    isDeleted: isDeleted ? isDeleted === "true" : undefined,
  });

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teachers fetched successfully",
    data: result,
  });
});

const getTeacherById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeacherService.getTeacherById(id as string);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher fetched successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TeacherService.getMyProfile(user);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher profile fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TeacherService.updateMyProfile(user, req.body);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher profile updated successfully",
    data: result,
  });
});

const updateTeacher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeacherService.updateTeacher(id as string, req.body);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher updated successfully",
    data: result,
  });
});

const deleteTeacher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as IRequestUser;
  const result = await TeacherService.deleteTeacher(id as string, user);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher deleted successfully",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TeacherService.getDashboardStats(user);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Teacher dashboard statistics fetched successfully",
    data: result,
  });
});

const getPendingEvaluations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const type = req.query.type as "writing" | "speaking" | "all" | undefined;
  const result = await TeacherService.getPendingEvaluations(user, type);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Pending evaluations fetched successfully",
    data: result,
  });
});

export const TeacherController = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getMyProfile,
  updateMyProfile,
  updateTeacher,
  deleteTeacher,
  getDashboardStats,
  getPendingEvaluations,
};
