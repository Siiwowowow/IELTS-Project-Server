// src/app/module/mocktest/mocktest.route.ts
import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { MockTestController } from "./mocktest.controller.js";
import { MockTestValidation } from "./mocktest.validation.js";

const router = Router();

// 1. Create Full Mock Test (Admin/Teacher only)
router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(MockTestValidation.createMockTestZodSchema),
  MockTestController.createMockTest
);

// 1b. Create Full Mock Test with modules created on the fly (Admin/Teacher only)
router.post(
  "/create-full",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(MockTestValidation.createFullMockTestZodSchema),
  MockTestController.createFullMockTest
);

// 2. Get All Mock Tests (All roles)
router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  MockTestController.getAllMockTests
);

// 3. Get Single Mock Test Details (All roles)
router.get(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  MockTestController.getMockTestById
);

// 4. Update Mock Test (Admin/Teacher only)
router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(MockTestValidation.updateMockTestZodSchema),
  MockTestController.updateMockTest
);

// 5. Delete Mock Test (Admin/Teacher only)
router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  MockTestController.deleteMockTest
);

// 6. Start Mock Test Attempt (Student/All authenticated users)
router.post(
  "/:id/attempts",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  MockTestController.createAttempt
);

// 7. Get Mock Test Attempt Details (Student/All authenticated users)
router.get(
  "/attempts/:attemptId",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  MockTestController.getAttemptById
);

// 8. Update Mock Test Attempt (Link sub-exams)
router.patch(
  "/attempts/:attemptId",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  validateRequest(MockTestValidation.updateMockAttemptZodSchema),
  MockTestController.updateAttempt
);

export const MockTestRoutes = router;
