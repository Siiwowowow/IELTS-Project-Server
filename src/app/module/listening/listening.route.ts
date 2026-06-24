import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ListeningController } from "./listening.controller.js";
import { ListeningValidation } from "./listening.validation.js";
import { multerUpload } from "../../config/multer.config.js";

const router = Router();

// --- EXAMS ---

// 1. Create Listening Exam (Admin/Teacher only)
router.post(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(ListeningValidation.createListeningExamZodSchema),
  ListeningController.createExam
);

// 2. Get All Listening Exams (Super Admin, Admin, Teacher, Student)
router.get(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ListeningController.getAllExams
);

// 3. Get Student's Attempt History (Students, Teachers, Admins)
router.get(
  "/exams/history",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ListeningController.getStudentAttemptHistory
);

// 4. Get Single Listening Exam (Any authenticated user; students have answers hidden)
router.get(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ListeningController.getExamById
);

// 5. Update Listening Exam (Admin/Teacher only)
router.patch(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(ListeningValidation.updateListeningExamZodSchema),
  ListeningController.updateExam
);

// 6. Delete Listening Exam (Admin/Teacher only)
router.delete(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  ListeningController.deleteExam
);

// 7. Submit Student's Exam Attempt (Students, Teachers, Admins)
router.post(
  "/exams/:id/submit",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  validateRequest(ListeningValidation.submitListeningAttemptZodSchema),
  ListeningController.submitExamAttempt
);

// --- ATTEMPTS & REVIEWS ---

// 8. Get Attempt Review (Students can only get their own, Admins/Teachers can get any)
router.get(
  "/attempts/:attemptId/review",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  ListeningController.getAttemptReview
);

// --- FILE UPLOADS ---

// 9. Upload audio file for sections (Admin/Teacher only)
router.post(
  "/upload",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  multerUpload.single("file"),
  ListeningController.uploadAudioFile
);

export const ListeningRoutes = router;
