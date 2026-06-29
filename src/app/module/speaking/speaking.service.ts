/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateSpeakingExamPayload,
  ISubmitSpeakingAttemptPayload,
  IGradeSpeakingAttemptPayload,
} from "./speaking.interface.js";
import { Role, AttemptStatus } from "@prisma/client";

// Round to nearest 0.5 (IELTS band standard)
const roundToHalf = (n: number): number => Math.round(n * 2) / 2;

// ──────────────────────────────────────────────
// Create a full speaking exam
// ──────────────────────────────────────────────
const createExam = async (
  payload: ICreateSpeakingExamPayload & { creatorEmail?: string }
) => {
  return await prisma.speakingExam.create({
    data: {
      title: payload.title,
      description: payload.description,
      duration: payload.duration ?? 15,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
      parts: {
        create: payload.parts?.map((p) => ({
          partNumber: p.partNumber,
          title: p.title,
          instruction: p.instruction,
          preparationTime: p.preparationTime ?? 0,
          speakingTime: p.speakingTime ?? 0,
          order: p.order,
          questions: {
            create: p.questions?.map((q) => ({
              questionText: q.questionText,
              audioUrl: q.audioUrl,
              order: q.order,
            })),
          },
        })),
      },
    },
    include: {
      parts: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
};

// ──────────────────────────────────────────────
// Get all speaking exams
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

  return await prisma.speakingExam.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      creatorEmail: true,
      _count: {
        select: { parts: true },
      },
    },
  });
};

// ──────────────────────────────────────────────
// Get single speaking exam by ID
// ──────────────────────────────────────────────
const getExamById = async (id: string, role: Role) => {
  const isStudent = role === Role.STUDENT;

  const exam = await prisma.speakingExam.findUnique({
    where: { id },
    include: {
      parts: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Speaking exam not found");
  }

  if (isStudent && !exam.isPublished) {
    throw new AppError(
      status.FORBIDDEN,
      "This speaking exam is not published yet"
    );
  }

  return exam;
};

// ──────────────────────────────────────────────
// Update speaking exam
// ──────────────────────────────────────────────
const updateExam = async (
  id: string,
  payload: Partial<ICreateSpeakingExamPayload>
) => {
  const existingExam = await prisma.speakingExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Speaking exam not found");
  }

  return await prisma.$transaction(
    async (tx) => {
      // 1. Update exam metadata
      await tx.speakingExam.update({
        where: { id },
        data: {
          title: payload.title,
          description: payload.description,
          duration: payload.duration,
          isPublished: payload.isPublished,
        },
      });

      // 2. Replace parts if provided
      if (payload.parts) {
        // Find existing parts and delete their questions first
        const parts = await tx.speakingPart.findMany({
          where: { examId: id },
          select: { id: true },
        });
        const partIds = parts.map((p) => p.id);

        await tx.speakingQuestion.deleteMany({
          where: { partId: { in: partIds } },
        });

        await tx.speakingPart.deleteMany({
          where: { examId: id },
        });

        // Create new parts and questions
        for (const p of payload.parts) {
          await tx.speakingPart.create({
            data: {
              examId: id,
              partNumber: p.partNumber,
              title: p.title,
              instruction: p.instruction,
              preparationTime: p.preparationTime ?? 0,
              speakingTime: p.speakingTime ?? 0,
              order: p.order,
              questions: {
                create: p.questions?.map((q) => ({
                  questionText: q.questionText,
                  audioUrl: q.audioUrl,
                  order: q.order,
                })),
              },
            },
          });
        }
      }

      return await tx.speakingExam.findUnique({
        where: { id },
        include: {
          parts: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
    },
    { timeout: 20000 }
  );
};

// ──────────────────────────────────────────────
// Delete speaking exam
// ──────────────────────────────────────────────
const deleteExam = async (id: string) => {
  const existingExam = await prisma.speakingExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Speaking exam not found");
  }

  return await prisma.speakingExam.delete({
    where: { id },
  });
};

// ──────────────────────────────────────────────
// Submit student's speaking attempt (audio files submitted)
// ──────────────────────────────────────────────
const submitExamAttempt = async (
  userId: string,
  examId: string,
  payload: ISubmitSpeakingAttemptPayload
) => {
  const exam = await prisma.speakingExam.findUnique({
    where: { id: examId },
    include: {
      parts: {
        include: { questions: true },
      },
    },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Speaking exam not found");
  }

  // Validate that all questionIds belong to this speaking exam
  const examQuestionIds = new Set<string>();
  exam.parts.forEach((p) => {
    p.questions.forEach((q) => {
      examQuestionIds.add(q.id);
    });
  });

  const submittedAnswersMap = new Map<string, string | null | undefined>();
  for (const ans of (payload.answers || [])) {
    if (!examQuestionIds.has(ans.questionId)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Question ID ${ans.questionId} does not belong to this exam`
      );
    }
    submittedAnswersMap.set(ans.questionId, ans.audioUrl);
  }

  return await prisma.$transaction(
    async (tx) => {
      const attempt = await tx.userSpeakingAttempt.create({
        data: {
          userId,
          examId,
          startTime: new Date(Date.now() - exam.duration * 60000),
          endTime: new Date(),
          status: AttemptStatus.SUBMITTED,
        },
      });

      const answersData = [];
      for (const part of exam.parts) {
        for (const q of part.questions) {
          const audioUrl = submittedAnswersMap.get(q.id) || null;
          answersData.push({
            attemptId: attempt.id,
            questionId: q.id,
            audioUrl,
          });
        }
      }

      await tx.userSpeakingAnswer.createMany({
        data: answersData,
      });

      return await tx.userSpeakingAttempt.findUnique({
        where: { id: attempt.id },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          exam: {
            select: {
              title: true,
            },
          },
        },
      });
    },
    { timeout: 20000 }
  );
};

// ──────────────────────────────────────────────
// Grade speaking attempt (Teacher/Admin evaluates response audio)
// ──────────────────────────────────────────────
const gradeAttempt = async (
  attemptId: string,
  payload: IGradeSpeakingAttemptPayload
) => {
  const attempt = await prisma.userSpeakingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Speaking attempt not found");
  }

  const attemptAnswerIds = new Set(attempt.answers.map((a) => a.id));
  for (const grade of payload.grades) {
    if (!attemptAnswerIds.has(grade.answerId)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Answer ID ${grade.answerId} does not belong to this attempt`
      );
    }
  }

  return await prisma.$transaction(
    async (tx) => {
      let sumOfBands = 0;
      let count = 0;

      for (const grade of payload.grades) {
        const answerBand = roundToHalf(
          (grade.fluencyScore +
            grade.lexicalScore +
            grade.grammarScore +
            grade.pronunciationScore) /
            4
        );

        await tx.userSpeakingAnswer.update({
          where: { id: grade.answerId },
          data: {
            fluencyScore: grade.fluencyScore,
            lexicalScore: grade.lexicalScore,
            grammarScore: grade.grammarScore,
            pronunciationScore: grade.pronunciationScore,
            bandScore: answerBand,
            feedback: grade.feedback,
          },
        });

        sumOfBands += answerBand;
        count++;
      }

      const overallBand = count > 0 ? roundToHalf(sumOfBands / count) : null;

      await tx.userSpeakingAttempt.update({
        where: { id: attemptId },
        data: {
          bandScore: overallBand,
        },
      });

      return await tx.userSpeakingAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          exam: true,
        },
      });
    },
    { timeout: 20000 }
  );
};

// ──────────────────────────────────────────────
// Get attempt review
// ──────────────────────────────────────────────
const getAttemptReview = async (
  userId: string,
  attemptId: string,
  role: Role
) => {
  const attempt = await prisma.userSpeakingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
      exam: {
        include: {
          parts: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Speaking attempt review not found");
  }

  if (role === Role.STUDENT && attempt.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "Forbidden access to review other students' speaking attempts"
    );
  }

  return attempt;
};

// ──────────────────────────────────────────────
// Get student's attempt history
// ──────────────────────────────────────────────
const getStudentAttemptHistory = async (userId: string) => {
  return await prisma.userSpeakingAttempt.findMany({
    where: { userId },
    include: {
      exam: {
        select: {
          title: true,
          duration: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const SpeakingService = {
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
