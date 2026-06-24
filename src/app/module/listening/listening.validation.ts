import { z } from "zod";
import { QuestionGroupType } from "@prisma/client";

const createQuestionZodSchema = z.object({
  questionNumber: z.number().int().min(1).max(40),
  questionText: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
});

const createQuestionGroupZodSchema = z.object({
  type: z.nativeEnum(QuestionGroupType),
  instruction: z.string().optional(),
  passageSegment: z.string().optional(),
  options: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  order: z.number().int().min(1),
  questions: z.array(createQuestionZodSchema),
});

const createSectionZodSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  audioUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  script: z.string().optional(),
  instruction: z.string().optional(),
  order: z.number().int().min(1).max(4),
  questionGroups: z.array(createQuestionGroupZodSchema),
});

const createListeningExamZodSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  description: z.string().optional(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  sections: z.array(createSectionZodSchema).optional(),
});

const updateListeningExamZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  sections: z.array(createSectionZodSchema).optional(),
});

const submitListeningAttemptZodSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "Question ID is required"),
      submittedAnswer: z.string().nullable().optional(),
    })
  ),
});

export const ListeningValidation = {
  createListeningExamZodSchema,
  updateListeningExamZodSchema,
  submitListeningAttemptZodSchema,
};
