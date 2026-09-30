// src/app/module/teacher/teacher.route.ts
import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { multerUpload } from "../../config/multer.config.js";
import { TeacherController } from "./teacher.controller.js";
import { TeacherValidation } from "./teacher.validation.js";
import { updateTeacherProfileMiddleware } from "./teacher.middlewares.js";

const router = Router();

// Dashboard specific routes
router.get(
  "/dashboard/stats",
  checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  TeacherController.getDashboardStats
);

router.get(
  "/dashboard/pending-evaluations",
  checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  TeacherController.getPendingEvaluations
);

// Self profile routes
router.get(
  "/me",
  checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  TeacherController.getMyProfile
);

router.patch(
  "/update-my-profile",
  checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.fields([{ name: "profilePhoto", maxCount: 1 }]),
  updateTeacherProfileMiddleware,
  validateRequest(TeacherValidation.updateTeacherProfileZodSchema),
  TeacherController.updateMyProfile
);

// Admin / Super Admin Teacher Management routes
router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(TeacherValidation.createTeacherZodSchema),
  TeacherController.createTeacher
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  TeacherController.getAllTeachers
);

router.get(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  TeacherController.getTeacherById
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(TeacherValidation.updateTeacherZodSchema),
  TeacherController.updateTeacher
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  TeacherController.deleteTeacher
);

export const TeacherRoutes = router;
