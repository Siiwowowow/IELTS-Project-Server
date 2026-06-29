import { z } from "zod";

const createSpeakingQuestionZodSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  audioUrl: z.string().optional().nullable(),
  order: z.number().int().min(1),
});

const createSpeakingPartZodSchema = z.object({
  partNumber: z.number().int().min(1).max(3),
  title: z.string().min(1, "Part title is required"),
  instruction: z.string().optional().nullable(),
  preparationTime: z.number().int().min(0).optional(),
  speakingTime: z.number().int().min(0).optional(),
  order: z.number().int().min(1).max(3),
  questions: z.array(createSpeakingQuestionZodSchema).optional(),
});

const createSpeakingExamZodSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  parts: z.array(createSpeakingPartZodSchema).optional(),
});

const updateSpeakingExamZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(1).optional(),
  isPublished: z.boolean().optional(),
  parts: z.array(createSpeakingPartZodSchema).optional(),
});

const submitSpeakingAttemptZodSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "Question ID is required"),
      audioUrl: z.string().optional().nullable(),
    })
  ),
});

const gradeSpeakingAttemptZodSchema = z.object({
  grades: z.array(
    z.object({
      answerId: z.string().min(1, "Answer ID is required"),
      fluencyScore: z.number().min(0).max(9),
      lexicalScore: z.number().min(0).max(9),
      grammarScore: z.number().min(0).max(9),
      pronunciationScore: z.number().min(0).max(9),
      feedback: z.string().optional().nullable(),
    })
  ),
});

export const SpeakingValidation = {
  createSpeakingExamZodSchema,
  updateSpeakingExamZodSchema,
  submitSpeakingAttemptZodSchema,
  gradeSpeakingAttemptZodSchema,
};
