// src/app/module/mocktest/mocktest.validation.ts
import { z } from "zod";
import { ReadingValidation } from "../reading/reading.validation.js";
import { ListeningValidation } from "../listening/listening.validation.js";
import { WritingValidation } from "../writing/writing.validation.js";
import { SpeakingValidation } from "../speaking/speaking.validation.js";

const createMockTestZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  readingExamId: z.string().uuid().nullable().optional(),
  listeningExamId: z.string().uuid().nullable().optional(),
  writingExamId: z.string().uuid().nullable().optional(),
  speakingExamId: z.string().uuid().nullable().optional(),
});

const createFullMockTestZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  readingExam: ReadingValidation.createExamZodSchema.optional().nullable(),
  listeningExam: ListeningValidation.createListeningExamZodSchema.optional().nullable(),
  writingExam: WritingValidation.createWritingExamZodSchema.optional().nullable(),
  speakingExam: SpeakingValidation.createSpeakingExamZodSchema.optional().nullable(),
});

const updateMockTestZodSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  readingExamId: z.string().uuid().nullable().optional(),
  listeningExamId: z.string().uuid().nullable().optional(),
  writingExamId: z.string().uuid().nullable().optional(),
  speakingExamId: z.string().uuid().nullable().optional(),
});

const updateMockAttemptZodSchema = z.object({
  readingAttemptId: z.string().uuid().nullable().optional(),
  listeningAttemptId: z.string().uuid().nullable().optional(),
  writingAttemptId: z.string().uuid().nullable().optional(),
  speakingAttemptId: z.string().uuid().nullable().optional(),
});

export const MockTestValidation = {
  createMockTestZodSchema,
  createFullMockTestZodSchema,
  updateMockTestZodSchema,
  updateMockAttemptZodSchema,
};
