import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth, optionalAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { VocabularyController } from "./vocabulary.controller.js";
import { VocabularyValidation } from "./vocabulary.validation.js";

const router = Router();
router.get("/me", optionalAuth, VocabularyController.getMine);
router.get("/words", checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), VocabularyController.getAllWords);
router.post("/words", checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), validateRequest(VocabularyValidation.createWord), VocabularyController.createWord);
router.patch("/words/:id", checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), validateRequest(VocabularyValidation.updateWord), VocabularyController.updateWord);
router.delete("/words/:id", checkAuth(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN), VocabularyController.deleteWord);
router.post("/bookmarks/:wordId", checkAuth(), validateRequest(VocabularyValidation.toggleBookmark), VocabularyController.toggleBookmark);
export const VocabularyRoutes = router;
