import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ReadingController } from "./reading.controller.js";
import { ReadingValidation } from "./reading.validation.js";
import { multerUpload } from "../../config/multer.config.js";

const router = Router();

// --- EXAMS ---

// 1. Create Exam (Admin/Teacher only)
router.post(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(ReadingValidation.createExamZodSchema),
  ReadingController.createExam
);

// 2. Get All Exams (Super Admin, Admin, Teacher, Student)
router.get(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ReadingController.getAllExams
);

// 3. Get Student's Attempt History (Students only)
router.get(
  "/exams/history",
  checkAuth(Role.STUDENT),
  ReadingController.getStudentAttemptHistory
);

// 4. Get Single Exam (Any authenticated user; students have answers hidden)
router.get(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ReadingController.getExamById
);

// 5. Update Exam (Admin/Teacher only)
router.patch(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(ReadingValidation.updateExamZodSchema),
  ReadingController.updateExam
);

// 6. Delete Exam (Admin/Teacher only)
router.delete(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  ReadingController.deleteExam
);

// 7. Submit Student's Exam Attempt (Students only)
router.post(
  "/exams/:id/submit",
  checkAuth(Role.STUDENT),
  validateRequest(ReadingValidation.submitAttemptZodSchema),
  ReadingController.submitExamAttempt
);

// --- ATTEMPTS & REVIEWS ---

// 8. Get Attempt Review (Students can only get their own, Admins/Teachers can get any)
router.get(
  "/attempts/:attemptId/review",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ReadingController.getAttemptReview
);

// --- FILE UPLOADS ---

// 9. Upload PDF/Image for passage/questions (Admin/Teacher only)
router.post(
  "/upload",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  multerUpload.single("file"),
  ReadingController.uploadExamFile
);

export const ReadingRoutes = router;
