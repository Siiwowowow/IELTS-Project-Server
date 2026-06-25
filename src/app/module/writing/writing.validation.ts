import { z } from "zod";
import { WritingExamType, WritingTaskType } from "@prisma/client";

const createWritingTaskZodSchema = z.object({
  taskType: z.nativeEnum(WritingTaskType),
  instruction: z.string().min(1, "Task instruction is required"),
  imageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  minWords: z.number().int().min(1).optional(),
  modelAnswer: z.string().optional(),
  order: z.number().int().min(1).max(2),
});

const createWritingExamZodSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  description: z.string().optional(),
  examType: z.nativeEnum(WritingExamType).optional(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  tasks: z.array(createWritingTaskZodSchema).optional(),
});

const updateWritingExamZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  examType: z.nativeEnum(WritingExamType).optional(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  tasks: z.array(createWritingTaskZodSchema).optional(),
});

const submitWritingAttemptZodSchema = z.object({
  responses: z.array(
    z.object({
      taskId: z.string().min(1, "Task ID is required"),
      essay: z.string().min(1, "Essay content is required"),
      wordCount: z.number().int().min(0).optional(),
    })
  ),
});

const gradeWritingAttemptZodSchema = z.object({
  grades: z.array(
    z.object({
      responseId: z.string().min(1, "Response ID is required"),
      taskAchievement: z.number().min(0).max(9),
      coherenceCohesion: z.number().min(0).max(9),
      lexicalResource: z.number().min(0).max(9),
      grammaticalRange: z.number().min(0).max(9),
      feedback: z.string().optional(),
    })
  ),
});

export const WritingValidation = {
  createWritingExamZodSchema,
  updateWritingExamZodSchema,
  submitWritingAttemptZodSchema,
  gradeWritingAttemptZodSchema,
};
