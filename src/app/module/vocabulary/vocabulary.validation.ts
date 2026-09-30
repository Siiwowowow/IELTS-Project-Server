import { z } from "zod";

const wordSchema = z.object({
  word: z.string().trim().min(1).max(100),
  bangla: z.string().trim().min(1).max(300),
  pronunciation: z.string().trim().max(100).optional().nullable(),
  partOfSpeech: z.string().trim().min(1).max(50),
  definition: z.string().trim().min(1).max(1000),
  example: z.string().trim().min(1).max(1000),
  exampleBangla: z.string().trim().max(1000).optional().nullable(),
  collocations: z.array(z.string().trim().min(1).max(150)).max(12).default([]),
  topic: z.string().trim().min(1).max(80).default("Custom"),
  level: z.enum(["Intermediate", "Advanced"]).default("Intermediate"),
  simpleExample: z.string().trim().max(1000).optional().nullable(),
  compoundExample: z.string().trim().max(1000).optional().nullable(),
  complexExample: z.string().trim().max(1000).optional().nullable(),
});

export const VocabularyValidation = {
  createWord: wordSchema,
  updateWord: wordSchema.partial(),
  toggleBookmark: z.object({
    word: z.string().trim().min(1).max(100),
    meaning: z.string().trim().min(1).max(300),
  }),
};
