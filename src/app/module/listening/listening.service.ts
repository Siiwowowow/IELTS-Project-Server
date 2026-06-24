/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateListeningExamPayload, ISubmitAttemptPayload } from "./listening.interface.js";
import { Role, AttemptStatus } from "@prisma/client";

// IELTS Listening Band Score Calculator
const calculateListeningBandScore = (score: number): number => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 20) return 5.5;
  if (score >= 16) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 6) return 3.5;
  if (score >= 4) return 3.0;
  if (score >= 2) return 2.5;
  if (score >= 1) return 2.0;
  return 0.0;
};

// Create a full listening exam with sections, groups, and questions
const createExam = async (payload: ICreateListeningExamPayload & { creatorEmail?: string }) => {
  const firstAudioUrl = payload.sections?.find((s) => s.audioUrl)?.audioUrl || "";
  if (!firstAudioUrl) {
    throw new AppError(status.BAD_REQUEST, "Please provide at least one audio URL for the exam sections.");
  }

  return await prisma.listeningExam.create({
    data: {
      title: payload.title,
      description: payload.description,
      duration: payload.duration ?? 40,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
      sections: {
        create: payload.sections?.map((s) => ({
          title: s.title,
          audioUrl: s.audioUrl || firstAudioUrl,
          youtubeUrl: s.youtubeUrl,
          script: s.script,
          instruction: s.instruction,
          order: s.order,
          questionGroups: {
            create: s.questionGroups?.map((g) => ({
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
      sections: {
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

// Retrieve all listening exams
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
  
  return await prisma.listeningExam.findMany({
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
        select: { sections: true },
      },
    },
  });
};

// Retrieve single listening exam
const getExamById = async (id: string, role: Role) => {
  const isStudent = role === Role.STUDENT;

  const exam = await prisma.listeningExam.findUnique({
    where: { id },
    include: {
      sections: {
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
    throw new AppError(status.NOT_FOUND, "Listening exam not found");
  }

  if (isStudent && !exam.isPublished) {
    throw new AppError(status.FORBIDDEN, "This listening exam is not published yet");
  }

  // Cheat protection: strip correct answers and explanations for students
  if (isStudent) {
    exam.sections.forEach((section) => {
      section.questionGroups.forEach((group) => {
        group.questions.forEach((question: any) => {
          delete question.correctAnswer;
          delete question.explanation;
        });
      });
    });
  }

  return exam;
};

// Update existing listening exam
const updateExam = async (id: string, payload: Partial<ICreateListeningExamPayload>) => {
  const existingExam = await prisma.listeningExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Listening exam not found");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update the exam metadata
    await tx.listeningExam.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        isPublished: payload.isPublished,
      },
    });

    // 2. If sections are provided, replace them
    if (payload.sections) {
      const firstAudioUrl = payload.sections.find((s) => s.audioUrl)?.audioUrl || "";
      if (!firstAudioUrl) {
        throw new AppError(status.BAD_REQUEST, "Please provide at least one audio URL for the exam sections.");
      }

      // Cascade delete existing sections, which will delete question groups and questions
      await tx.listeningSection.deleteMany({
        where: { examId: id },
      });

      // Create new sections
      for (const s of payload.sections) {
        await tx.listeningSection.create({
          data: {
            examId: id,
            title: s.title,
            audioUrl: s.audioUrl || firstAudioUrl,
            youtubeUrl: s.youtubeUrl,
            script: s.script,
            instruction: s.instruction,
            order: s.order,
            questionGroups: {
              create: s.questionGroups?.map((g) => ({
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

    return await tx.listeningExam.findUnique({
      where: { id },
      include: {
        sections: {
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

// Delete listening exam
const deleteExam = async (id: string) => {
  const existingExam = await prisma.listeningExam.findUnique({
    where: { id },
  });

  if (!existingExam) {
    throw new AppError(status.NOT_FOUND, "Listening exam not found");
  }

  return await prisma.listeningExam.delete({
    where: { id },
  });
};

// Submit student's computer-based listening exam attempt
const submitExamAttempt = async (
  userId: string,
  examId: string,
  payload: ISubmitAttemptPayload
) => {
  const exam = await prisma.listeningExam.findUnique({
    where: { id: examId },
    include: {
      sections: {
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
    throw new AppError(status.NOT_FOUND, "Listening exam not found");
  }

  // Extract all questions for grading
  const allQuestionsMap = new Map<string, string>(); // questionId -> correctAnswer
  exam.sections.forEach((section) => {
    section.questionGroups.forEach((group) => {
      group.questions.forEach((q) => {
        allQuestionsMap.set(q.id, q.correctAnswer);
      });
    });
  });

  let correctCount = 0;

  // Grade user submissions
  const formattedAnswers = payload.answers.map((ans) => {
    const correctAnswer = allQuestionsMap.get(ans.questionId);
    let isCorrect = false;

    if (correctAnswer && ans.submittedAnswer) {
      const cleanSub = ans.submittedAnswer.trim().toLowerCase();
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

    return {
      questionId: ans.questionId,
      submittedAnswer: ans.submittedAnswer || "",
      isCorrect,
    };
  });

  const bandScore = calculateListeningBandScore(correctCount);

  // Store in database
  return await prisma.$transaction(async (tx) => {
    const attempt = await tx.userListeningAttempt.create({
      data: {
        userId,
        examId,
        startTime: new Date(Date.now() - (exam.duration * 60000)), // Approximate default start time
        endTime: new Date(),
        status: AttemptStatus.SUBMITTED,
        score: correctCount,
        bandScore: bandScore,
      },
    });

    for (const ans of formattedAnswers) {
      await tx.userListeningAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          submittedAnswer: ans.submittedAnswer,
          isCorrect: ans.isCorrect,
        },
      });
    }

    return await tx.userListeningAttempt.findUnique({
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
  const attempt = await prisma.userListeningAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          question: {
            include: {
              group: {
                include: {
                  section: {
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
        include: {
          sections: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              youtubeUrl: true,
              script: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Listening attempt review not found");
  }

  // Ensure security: Students can only view their own attempts
  if (role === Role.STUDENT && attempt.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to review other students' listening attempts");
  }

  return attempt;
};

// Retrieve attempt history for a student
const getStudentAttemptHistory = async (userId: string) => {
  return await prisma.userListeningAttempt.findMany({
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

export const ListeningService = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  submitExamAttempt,
  getAttemptReview,
  getStudentAttemptHistory,
};
