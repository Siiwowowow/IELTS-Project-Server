import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { WritingController } from "./writing.controller.js";
import { WritingValidation } from "./writing.validation.js";
import { multerUpload } from "../../config/multer.config.js";

const router = Router();

// --- EXAMS ---

// 1. Create Writing Exam (Admin/Teacher only)
router.post(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(WritingValidation.createWritingExamZodSchema),
  WritingController.createExam
);

// 2. Get All Writing Exams (All authenticated users)
router.get(
  "/exams",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  WritingController.getAllExams
);

// 3. Get Student's Attempt History
router.get(
  "/exams/history",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  WritingController.getStudentAttemptHistory
);

// 4. Get Single Writing Exam (students have model answers hidden)
router.get(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  WritingController.getExamById
);

// 5. Update Writing Exam (Admin/Teacher only)
router.patch(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(WritingValidation.updateWritingExamZodSchema),
  WritingController.updateExam
);

// 6. Delete Writing Exam (Admin/Teacher only)
router.delete(
  "/exams/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  WritingController.deleteExam
);

// 7. Submit Student's Writing Attempt (essay submission)
router.post(
  "/exams/:id/submit",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  validateRequest(WritingValidation.submitWritingAttemptZodSchema),
  WritingController.submitExamAttempt
);

// --- ATTEMPTS & GRADING ---

// 8. Grade a Student's Writing Attempt (Admin/Teacher only)
router.post(
  "/attempts/:attemptId/grade",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  validateRequest(WritingValidation.gradeWritingAttemptZodSchema),
  WritingController.gradeAttempt
);

// 9. Get Attempt Review (students can only get their own)
router.get(
  "/attempts/:attemptId/review",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT),
  WritingController.getAttemptReview
);

// --- FILE UPLOADS ---

// 10. Upload image/PDF for Task 1 stimulus (Admin/Teacher only)
router.post(
  "/upload",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER),
  multerUpload.single("file"),
  WritingController.uploadFile
);

export const WritingRoutes = router;
