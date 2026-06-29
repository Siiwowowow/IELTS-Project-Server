/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateWritingExamPayload,
  ISubmitWritingAttemptPayload,
  IGradeWritingAttemptPayload,
} from "./writing.interface.js";
import { Role, AttemptStatus } from "@prisma/client";

// Round to nearest 0.5 (IELTS band standard)
const roundToHalf = (n: number): number => Math.round(n * 2) / 2;

// Calculate overall writing band score
// Task 2 is weighted double: (Task1Band + Task2Band * 2) / 3
const calculateOverallWritingBand = (
  task1Band: number | null,
  task2Band: number | null
): number | null => {
  if (task1Band == null || task2Band == null) return null;
  return roundToHalf((task1Band + task2Band * 2) / 3);
};

// Calculate task band from the 4 criteria (average, rounded to nearest 0.5)
const calculateTaskBand = (
  taskAchievement: number,
  coherenceCohesion: number,
  lexicalResource: number,
  grammaticalRange: number
): number => {
  const avg =
    (taskAchievement + coherenceCohesion + lexicalResource + grammaticalRange) /
    4;
  return roundToHalf(avg);
};

// ──────────────────────────────────────────────
// Create a full writing exam with tasks
// ──────────────────────────────────────────────
const createExam = async (
  payload: ICreateWritingExamPayload & { creatorEmail?: string }
) => {
  return await prisma.writingExam.create({
    data: {
      title: payload.title,
      description: payload.description,
      examType: payload.examType ?? "ACADEMIC",
      duration: payload.duration ?? 60,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
      tasks: {
        create: payload.tasks?.map((t) => ({
          taskType: t.taskType,
          instruction: t.instruction,
          imageUrl: t.imageUrl,
          pdfUrl: t.pdfUrl,
          minWords: t.minWords ?? (t.taskType === "TASK_1" ? 150 : 250),
          modelAnswer: t.modelAnswer,
          order: t.order,
        })),
      },
    },
    include: {
      tasks: {
        orderBy: { order: "asc" },
      },
    },
  });
};

// ──────────────────────────────────────────────
// Get all writing exams
// ──────────────────────────────────────────────
const getAllExams = async (role: Role, email?: string) => {
  const isStudent = role === Role.STUDENT;
  const isTeacher = role === Role.TEACHER;

  let whereClause: any = {};

  if (email) {
    whereClause = {
      OR: [{ creatorEmail: email }, { creatorEmail: null }],
    };
  } else if (isStudent || isTeacher) {
    whereClause = { isPublished: true };
  }

  return await prisma.writingExam.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      examType: true,
      duration: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      creatorEmail: true,
      _count: {
        select: { tasks: true },
      },
    },
  });
};

// ──────────────────────────────────────────────
// Get single writing exam by ID
// ──────────────────────────────────────────────
const getExamById = async (id: string, role: Role) => {
  const isStudent = role === Role.STUDENT;

  const exam = await prisma.writingExam.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Writing exam not found");
  }

  if (isStudent && !exam.isPublished) {
    throw new AppError(
      status.FORBIDDEN,
      "This writing exam is not published yet"
    );
  }

  // Strip model answers for students
  if (isStudent) {
    exam.tasks.forEach((task: any) => {
      delete task.modelAnswer;
    });
  }

  return exam;
};

// ──────────────────────────────────────────────
// Update writing exam
// ──────────────────────────────────────────────
const updateExam = async (
  id: string,
  payload: Partial<ICreateWritingExamPayload>
) => {
  const existingExam = await prisma.writingExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Writing exam not found");
  }

  return await prisma.$transaction(
    async (tx) => {
      // 1. Update exam metadata
      await tx.writingExam.update({
        where: { id },
        data: {
          title: payload.title,
          description: payload.description,
          examType: payload.examType,
          duration: payload.duration,
          isPublished: payload.isPublished,
        },
      });

      // 2. If tasks are provided, replace them
      if (payload.tasks) {
        // Delete existing tasks (cascades to responses)
        await tx.writingTask.deleteMany({
          where: { examId: id },
        });

        // Create new tasks
        for (const t of payload.tasks) {
          await tx.writingTask.create({
            data: {
              examId: id,
              taskType: t.taskType,
              instruction: t.instruction,
              imageUrl: t.imageUrl,
              pdfUrl: t.pdfUrl,
              minWords: t.minWords ?? (t.taskType === "TASK_1" ? 150 : 250),
              modelAnswer: t.modelAnswer,
              order: t.order,
            },
          });
        }
      }

      return await tx.writingExam.findUnique({
        where: { id },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      });
    },
    { timeout: 15000 }
  );
};

// ──────────────────────────────────────────────
// Delete writing exam
// ──────────────────────────────────────────────
const deleteExam = async (id: string) => {
  const existingExam = await prisma.writingExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Writing exam not found");
  }

  return await prisma.writingExam.delete({
    where: { id },
  });
};

// ──────────────────────────────────────────────
// Submit student's writing attempt (essays only, no grading)
// ──────────────────────────────────────────────
const submitExamAttempt = async (
  userId: string,
  examId: string,
  payload: ISubmitWritingAttemptPayload
) => {
  const exam = await prisma.writingExam.findUnique({
    where: { id: examId },
    include: { tasks: true },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Writing exam not found");
  }

  // Validate that submitted taskIds belong to this exam
  const examTaskIds = new Set(exam.tasks.map((t) => t.id));
  const submittedResponsesMap = new Map<string, { essay?: string; wordCount?: number }>();
  for (const resp of (payload.responses || [])) {
    if (!examTaskIds.has(resp.taskId)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Task ID ${resp.taskId} does not belong to this exam`
      );
    }
    submittedResponsesMap.set(resp.taskId, { essay: resp.essay, wordCount: resp.wordCount });
  }

  return await prisma.$transaction(
    async (tx) => {
      const attempt = await tx.userWritingAttempt.create({
        data: {
          userId,
          examId,
          startTime: new Date(Date.now() - exam.duration * 60000),
          endTime: new Date(),
          status: AttemptStatus.SUBMITTED,
        },
      });

      for (const task of exam.tasks) {
        const submitted = submittedResponsesMap.get(task.id);
        const essayContent = submitted?.essay ?? "";
        const wordCount = submitted?.wordCount ?? essayContent.trim().split(/\s+/).filter(Boolean).length;

        await tx.userWritingResponse.create({
          data: {
            attemptId: attempt.id,
            taskId: task.id,
            essay: essayContent,
            wordCount,
          },
        });
      }

      return await tx.userWritingAttempt.findUnique({
        where: { id: attempt.id },
        include: {
          responses: {
            include: {
              task: {
                select: {
                  taskType: true,
                  instruction: true,
                  minWords: true,
                  order: true,
                },
              },
            },
          },
          exam: {
            select: {
              title: true,
              examType: true,
            },
          },
        },
      });
    },
    { timeout: 15000 }
  );
};

// ──────────────────────────────────────────────
// Grade a student's writing attempt (Teacher/Admin)
// ──────────────────────────────────────────────
const gradeAttempt = async (
  attemptId: string,
  payload: IGradeWritingAttemptPayload
) => {
  const attempt = await prisma.userWritingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          task: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Writing attempt not found");
  }

  // Validate that all responseIds belong to this attempt
  const attemptResponseIds = new Set(attempt.responses.map((r) => r.id));
  for (const grade of payload.grades) {
    if (!attemptResponseIds.has(grade.responseId)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Response ID ${grade.responseId} does not belong to this attempt`
      );
    }
  }

  return await prisma.$transaction(
    async (tx) => {
      let task1Band: number | null = null;
      let task2Band: number | null = null;

      for (const grade of payload.grades) {
        const taskBand = calculateTaskBand(
          grade.taskAchievement,
          grade.coherenceCohesion,
          grade.lexicalResource,
          grade.grammaticalRange
        );

        await tx.userWritingResponse.update({
          where: { id: grade.responseId },
          data: {
            taskAchievement: grade.taskAchievement,
            coherenceCohesion: grade.coherenceCohesion,
            lexicalResource: grade.lexicalResource,
            grammaticalRange: grade.grammaticalRange,
            taskBandScore: taskBand,
            feedback: grade.feedback,
          },
        });

        // Determine which task this response belongs to
        const response = attempt.responses.find(
          (r) => r.id === grade.responseId
        );
        if (response?.task.taskType === "TASK_1") {
          task1Band = taskBand;
        } else if (response?.task.taskType === "TASK_2") {
          task2Band = taskBand;
        }
      }

      // Calculate overall band if both tasks are graded
      const overallBand = calculateOverallWritingBand(task1Band, task2Band);

      await tx.userWritingAttempt.update({
        where: { id: attemptId },
        data: {
          bandScore: overallBand,
        },
      });

      return await tx.userWritingAttempt.findUnique({
        where: { id: attemptId },
        include: {
          responses: {
            include: {
              task: {
                select: {
                  taskType: true,
                  instruction: true,
                  minWords: true,
                  order: true,
                },
              },
            },
          },
          exam: {
            select: {
              title: true,
              examType: true,
            },
          },
        },
      });
    },
    { timeout: 15000 }
  );
};

// ──────────────────────────────────────────────
// Get attempt review (student sees their graded work)
// ──────────────────────────────────────────────
const getAttemptReview = async (
  userId: string,
  attemptId: string,
  role: Role
) => {
  const attempt = await prisma.userWritingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: {
          task: {
            select: {
              taskType: true,
              instruction: true,
              minWords: true,
              order: true,
              modelAnswer: true,
            },
          },
        },
      },
      exam: {
        include: {
          tasks: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              taskType: true,
              instruction: true,
              imageUrl: true,
              pdfUrl: true,
              minWords: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Writing attempt review not found");
  }

  // Students can only view their own attempts
  if (role === Role.STUDENT && attempt.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "Forbidden access to review other students' writing attempts"
    );
  }

  // Strip model answers for students
  if (role === Role.STUDENT) {
    attempt.responses.forEach((resp: any) => {
      delete resp.task.modelAnswer;
    });
  }

  return attempt;
};

// ──────────────────────────────────────────────
// Get student's attempt history
// ──────────────────────────────────────────────
const getStudentAttemptHistory = async (userId: string) => {
  return await prisma.userWritingAttempt.findMany({
    where: { userId },
    include: {
      exam: {
        select: {
          title: true,
          examType: true,
          duration: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const WritingService = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  gradeAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
};
