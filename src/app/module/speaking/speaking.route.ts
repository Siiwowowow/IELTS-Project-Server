import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { SpeakingController } from "./speaking.controller.js";
import { SpeakingValidation } from "./speaking.validation.js";
import { multerUpload } from "../../config/multer.config.js";

const router = Router();

// --- EXAMS ---

// 1. Create Speaking Exam (Admin/Teacher only)
router.post(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(SpeakingValidation.createSpeakingExamZodSchema),
  SpeakingController.createExam
);

// 2. Get All Speaking Exams (All authenticated users)
router.get(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  SpeakingController.getAllExams
);

// 3. Get Student's Attempt History
router.get(
  "/exams/history",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  SpeakingController.getStudentAttemptHistory
);

// 4. Get Single Speaking Exam
router.get(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  SpeakingController.getExamById
);

// 5. Update Speaking Exam (Admin/Teacher only)
router.patch(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(SpeakingValidation.updateSpeakingExamZodSchema),
  SpeakingController.updateExam
);

// 6. Delete Speaking Exam (Admin/Teacher only)
router.delete(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  SpeakingController.deleteExam
);

// 7. Submit Student's Speaking Attempt (Recorded audios)
router.post(
  "/exams/:id/submit",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  validateRequest(SpeakingValidation.submitSpeakingAttemptZodSchema),
  SpeakingController.submitExamAttempt
);

// --- ATTEMPTS & GRADING ---

// 8. Grade a Student's Speaking Attempt (Admin/Teacher only)
router.post(
  "/attempts/:attemptId/grade",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(SpeakingValidation.gradeSpeakingAttemptZodSchema),
  SpeakingController.gradeAttempt
);

// 9. Get Attempt Review (Students can only retrieve their own)
router.get(
  "/attempts/:attemptId/review",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  SpeakingController.getAttemptReview
);

// --- FILE UPLOADS ---

// 10. Upload recorded audio file
router.post(
  "/upload",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  multerUpload.single("file"),
  SpeakingController.uploadFile
);

export const SpeakingRoutes = router;
