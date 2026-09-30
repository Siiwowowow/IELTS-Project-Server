// src/app/module/teacher/teacher.validation.ts
import z from "zod";

const createTeacherZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contactNumber: z.string().min(6).max(20).optional(),
  designation: z.string().optional(),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
});

const updateTeacherZodSchema = z.object({
  teacher: z
    .object({
      name: z.string().min(2).optional(),
      profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
      contactNumber: z.string().min(6).max(20).optional(),
      designation: z.string().optional(),
      bio: z.string().optional(),
      expertise: z.string().optional(),
    })
    .optional(),
});

const updateTeacherProfileZodSchema = z.object({
  name: z.string().min(2).optional(),
  contactNumber: z.string().min(6).max(20).optional(),
  designation: z.string().optional(),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profilePhoto: z.string().url().optional(),
});

export const TeacherValidation = {
  createTeacherZodSchema,
  updateTeacherZodSchema,
  updateTeacherProfileZodSchema,
};
