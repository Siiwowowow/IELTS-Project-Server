/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateExamPayload, ISubmitAttemptPayload } from "./reading.interface.js";
import { Role, AttemptStatus } from "@prisma/client";

// IELTS Reading Academic Band Score Calculator
const calculateBandScore = (score: number): number => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 20) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 6) return 3.5;
  if (score >= 4) return 3.0;
  if (score >= 2) return 2.5;
  if (score >= 1) return 2.0;
  return 0.0;
};

// Create a full exam with passages, groups, and questions
const createExam = async (payload: ICreateExamPayload & { creatorEmail?: string }) => {
  return await prisma.exam.create({
    data: {
      title: payload.title,
      description: payload.description,
      duration: payload.duration ?? 60,
      isPublished: payload.isPublished ?? false,
      isMockOnly: payload.isMockOnly ?? false,
      creatorEmail: payload.creatorEmail,
      passages: {
        create: payload.passages?.map((p) => ({
          title: p.title,
          text: p.text,
          body: p.body,
          instruction: p.instruction,
          pdfUrl: p.pdfUrl,
          imageUrl: p.imageUrl,
          order: p.order,
          questionGroups: {
            create: p.questionGroups?.map((g) => ({
              type: g.type,
              instruction: g.instruction,
              passageSegment: g.passageSegment,
              options: g.options ? JSON.parse(JSON.stringify(g.options)) : undefined,
              imageUrl: g.imageUrl,
              order: g.order,
              questions: {
                create: g.questions?.map((q) => ({
                  questionNumber: q.questionNumber,
                  questionText: q.questionText,
                  options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      passages: {
        orderBy: { order: "asc" },
        include: {
          questionGroups: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { questionNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });
};

// Retrieve all exams
const getAllExams = async (role: Role, email?: string) => {
  const isStudent = role === Role.STUDENT;
  const isTeacher = role === Role.TEACHER;
  
  let whereClause: any = {};
  
  if (email) {
    whereClause = {
      OR: [
        { creatorEmail: email },
        { creatorEmail: null }
      ]
    };
  } else if (isStudent || isTeacher) {
    whereClause = { isPublished: true };
  }

  if (isStudent) {
    whereClause.isMockOnly = false;
  }
  
  return await prisma.exam.findMany({
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
        select: { passages: true },
      },
    },
  });
};

// Retrieve single exam
const getExamById = async (id: string, role: Role) => {
  const isStudent = role === Role.STUDENT;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      passages: {
        orderBy: { order: "asc" },
        include: {
          questionGroups: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { questionNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Exam not found");
  }

  if (isStudent && !exam.isPublished) {
    throw new AppError(status.FORBIDDEN, "This exam is not published yet");
  }

  // Cheat protection: strip correct answers and explanations for students
  if (isStudent) {
    exam.passages.forEach((passage) => {
      passage.questionGroups.forEach((group) => {
        group.questions.forEach((question: any) => {
          delete question.correctAnswer;
          delete question.explanation;
        });
      });
    });
  }

  return exam;
};

// Update existing exam
const updateExam = async (id: string, payload: Partial<ICreateExamPayload>) => {
  const existingExam = await prisma.exam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Exam not found");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update the exam metadata
    await tx.exam.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        isPublished: payload.isPublished,
      },
    });

    // 2. If passages are provided, replace them
    if (payload.passages) {
      // Cascade delete existing passages, which will delete question groups and questions
      await tx.passage.deleteMany({
        where: { examId: id },
      });

      // Create new passages
      for (const p of payload.passages) {
        await tx.passage.create({
          data: {
            examId: id,
            title: p.title,
            text: p.text,
            body: p.body,
            instruction: p.instruction,
            pdfUrl: p.pdfUrl,
            imageUrl: p.imageUrl,
            order: p.order,
            questionGroups: {
              create: p.questionGroups?.map((g) => ({
                type: g.type,
                instruction: g.instruction,
                passageSegment: g.passageSegment,
                options: g.options ? JSON.parse(JSON.stringify(g.options)) : undefined,
                imageUrl: g.imageUrl,
                order: g.order,
                questions: {
                  create: g.questions?.map((q) => ({
                    questionNumber: q.questionNumber,
                    questionText: q.questionText,
                    options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                  })),
                },
              })),
            },
          },
        });
      }
    }

    return await tx.exam.findUnique({
      where: { id },
      include: {
        passages: {
          orderBy: { order: "asc" },
          include: {
            questionGroups: {
              orderBy: { order: "asc" },
              include: {
                questions: {
                  orderBy: { questionNumber: "asc" },
                },
              },
            },
          },
        },
      },
    });
  }, { timeout: 15000 });
};

// Delete exam and all cascaded models
const deleteExam = async (id: string) => {
  const existingExam = await prisma.exam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Exam not found");
  }

  return await prisma.exam.delete({
    where: { id },
  });
};

// Submit student's computer-based exam attempt
const submitExamAttempt = async (
  userId: string,
  examId: string,
  payload: ISubmitAttemptPayload
) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      passages: {
        include: {
          questionGroups: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new AppError(status.NOT_FOUND, "Exam not found");
  }

  // Grade user submissions for all questions in the exam
  const submittedAnswersMap = new Map<string, string>();
  (payload.answers || []).forEach((ans) => {
    if (ans.questionId) {
      submittedAnswersMap.set(ans.questionId, ans.submittedAnswer || "");
    }
  });

  let correctCount = 0;
  const formattedAnswers: { questionId: string; submittedAnswer: string; isCorrect: boolean }[] = [];

  exam.passages.forEach((passage) => {
    passage.questionGroups.forEach((group) => {
      group.questions.forEach((q) => {
        const submittedAnswer = submittedAnswersMap.get(q.id);
        const correctAnswer = q.correctAnswer;
        let isCorrect = false;

        if (correctAnswer && submittedAnswer !== undefined && submittedAnswer !== null && submittedAnswer.trim() !== "") {
          const cleanSub = submittedAnswer.trim().toLowerCase();
          const cleanCor = correctAnswer.trim().toLowerCase();

          // Flexible matching for True/False/Not Given and Yes/No/Not Given abbreviations
          if (
            (cleanSub === "t" && cleanCor === "true") ||
            (cleanSub === "true" && cleanCor === "true") ||
            (cleanSub === "f" && cleanCor === "false") ||
            (cleanSub === "false" && cleanCor === "false") ||
            (cleanSub === "ng" && cleanCor === "not given") ||
            (cleanSub === "not given" && cleanCor === "not given") ||
            (cleanSub === "y" && cleanCor === "yes") ||
            (cleanSub === "yes" && cleanCor === "yes") ||
            (cleanSub === "n" && cleanCor === "no") ||
            (cleanSub === "no" && cleanCor === "no")
          ) {
            isCorrect = true;
          } else if (cleanSub === cleanCor) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          correctCount++;
        }

        formattedAnswers.push({
          questionId: q.id,
          submittedAnswer: submittedAnswer || "",
          isCorrect,
        });
      });
    });
  });

  const bandScore = calculateBandScore(correctCount);

  // Store in database
  return await prisma.$transaction(async (tx) => {
  const attempt = await tx.userExamAttempt.create({
    data: {
      userId,
      examId,
      startTime: new Date(Date.now() - (exam.duration * 60000)), // Approximate default start time if not provided
      endTime: new Date(),
      status: AttemptStatus.SUBMITTED,
      score: correctCount,
      bandScore: bandScore,
    },
  });

  await tx.userAnswer.createMany({
    data: formattedAnswers.map((ans) => ({
      attemptId: attempt.id,
      questionId: ans.questionId,
      submittedAnswer: ans.submittedAnswer,
      isCorrect: ans.isCorrect,
    })),
  });

  return await tx.userExamAttempt.findUnique({
    where: { id: attempt.id },
    include: {
      answers: true,
      exam: {
        select: {
          title: true,
        },
      },
    },
  });
}, { timeout: 15000 });
};

// Retrieve details of a student attempt for review
const getAttemptReview = async (userId: string, attemptId: string, role: Role) => {
  const attempt = await prisma.userExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          question: {
            include: {
              group: {
                include: {
                  passage: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      exam: {
        select: {
          title: true,
          duration: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Attempt not found");
  }

  // Ensure security: Students can only view their own attempts
  if (role === Role.STUDENT && attempt.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to review other students' attempts");
  }

  return attempt;
};

// Retrieve attempt history for a student
const getStudentAttemptHistory = async (userId: string) => {
  return await prisma.userExamAttempt.findMany({
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

export const ReadingService = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
};
