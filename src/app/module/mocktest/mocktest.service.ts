// src/app/module/mocktest/mocktest.service.ts
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateMockTestPayload, IUpdateMockTestPayload, IUpdateMockAttemptPayload } from "./mocktest.interface.js";
import { Role, AttemptStatus } from "@prisma/client";
import { ReadingService } from "../reading/reading.service.js";
import { ListeningService } from "../listening/listening.service.js";
import { WritingService } from "../writing/writing.service.js";
import { SpeakingService } from "../speaking/speaking.service.js";

// Round to nearest 0.5 (IELTS overall band standard)
const roundToHalf = (n: number): number => Math.round(n * 2) / 2;

// 1. Create Mock Test (Teacher/Admin only)
const createMockTest = async (payload: ICreateMockTestPayload & { creatorEmail?: string }) => {
  return await prisma.mockTest.create({
    data: {
      title: payload.title,
      description: payload.description,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
      readingExamId: payload.readingExamId,
      listeningExamId: payload.listeningExamId,
      writingExamId: payload.writingExamId,
      speakingExamId: payload.speakingExamId,
    },
    include: {
      readingExam: true,
      listeningExam: true,
      writingExam: true,
      speakingExam: true,
    },
  });
};

// 1b. Create Full Mock Test with modules created on the fly
const createFullMockTest = async (payload: any & { creatorEmail?: string }) => {
  let readingExamId: string | null = null;
  let listeningExamId: string | null = null;
  let writingExamId: string | null = null;
  let speakingExamId: string | null = null;

  if (payload.readingExam) {
    const readingExam = await ReadingService.createExam({
      ...payload.readingExam,
      isMockOnly: true,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
    });
    readingExamId = readingExam.id;
  }

  if (payload.listeningExam) {
    const listeningExam = await ListeningService.createExam({
      ...payload.listeningExam,
      isMockOnly: true,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
    });
    listeningExamId = listeningExam.id;
  }

  if (payload.writingExam) {
    const writingExam = await WritingService.createExam({
      ...payload.writingExam,
      isMockOnly: true,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
    });
    writingExamId = writingExam.id;
  }

  if (payload.speakingExam) {
    const speakingExam = await SpeakingService.createExam({
      ...payload.speakingExam,
      isMockOnly: true,
      isPublished: payload.isPublished ?? false,
      creatorEmail: payload.creatorEmail,
    });
    speakingExamId = speakingExam.id;
  }

  return await prisma.mockTest.create({
    data: {
      title: payload.title,
      description: payload.description,
      isPublished: payload.isPublished ?? false,
      isPremium: payload.isPremium ?? true,
      creatorEmail: payload.creatorEmail,
      readingExamId,
      listeningExamId,
      writingExamId,
      speakingExamId,
    },
    include: {
      readingExam: true,
      listeningExam: true,
      writingExam: true,
      speakingExam: true,
    },
  });
};

// 2. Get All Mock Tests
const getAllMockTests = async (role: Role, email?: string) => {
  const isStudent = role === Role.STUDENT;
  let whereClause: any = {};

  if (isStudent) {
    whereClause.isPublished = true;
  } else if (role === Role.TEACHER && email) {
    whereClause.OR = [
      { creatorEmail: email },
      { creatorEmail: null }
    ];
  }

  return await prisma.mockTest.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      readingExam: {
        select: { id: true, title: true, duration: true },
      },
      listeningExam: {
        select: { id: true, title: true, duration: true },
      },
      writingExam: {
        select: { id: true, title: true, duration: true },
      },
      speakingExam: {
        select: { id: true, title: true, duration: true },
      },
    },
  });
};

// 3. Get Single Mock Test Details
const getMockTestById = async (id: string) => {
  const mockTest = await prisma.mockTest.findUnique({
    where: { id },
    include: {
      readingExam: true,
      listeningExam: true,
      writingExam: true,
      speakingExam: true,
    },
  });

  if (!mockTest) {
    throw new AppError(status.NOT_FOUND, "Mock test not found");
  }

  return mockTest;
};

// 4. Update Mock Test (Teacher/Admin only)
const updateMockTest = async (id: string, payload: IUpdateMockTestPayload) => {
  // Verify existence
  await getMockTestById(id);

  return await prisma.mockTest.update({
    where: { id },
    data: payload,
    include: {
      readingExam: true,
      listeningExam: true,
      writingExam: true,
      speakingExam: true,
    },
  });
};

// 5. Delete Mock Test (Teacher/Admin only)
const deleteMockTest = async (id: string) => {
  await getMockTestById(id);
  return await prisma.mockTest.delete({
    where: { id },
  });
};

// 6. Create Student Mock Test Attempt
const createAttempt = async (mockTestId: string, userId: string) => {
  const mockTest = await getMockTestById(mockTestId);

  // Verify premium access
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User profile not found");
  }

  if (mockTest.isPremium && !user.isPremium) {
    throw new AppError(
      status.FORBIDDEN,
      "This is a Premium CBT Mock Test. Please upgrade your subscription plan to unlock full mock exam simulations."
    );
  }

  // Return existing in-progress attempt if exists
  const existingAttempt = await prisma.userMockAttempt.findFirst({
    where: {
      mockTestId,
      userId,
      status: AttemptStatus.IN_PROGRESS,
    },
  });

  if (existingAttempt) {
    return existingAttempt;
  }

  return await prisma.userMockAttempt.create({
    data: {
      mockTestId,
      userId,
      status: AttemptStatus.IN_PROGRESS,
    },
  });
};

// 7. Get Mock Test Attempt Details (including individual sub-attempt data)
const getAttemptById = async (attemptId: string, userId: string, role: Role) => {
  const attempt = await prisma.userMockAttempt.findUnique({
    where: { id: attemptId },
    include: {
      mockTest: {
        include: {
          readingExam: true,
          listeningExam: true,
          writingExam: true,
          speakingExam: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Mock attempt not found");
  }

  // Ensure student only accesses their own attempts
  if (role === Role.STUDENT && attempt.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Access denied to this attempt");
  }

  // Fetch sub-attempt details if linked
  let readingAttempt: any = null;
  let listeningAttempt: any = null;
  let writingAttempt: any = null;
  let speakingAttempt: any = null;

  if (attempt.readingAttemptId) {
    readingAttempt = await prisma.userExamAttempt.findUnique({
      where: { id: attempt.readingAttemptId },
    });
  }
  if (attempt.listeningAttemptId) {
    listeningAttempt = await prisma.userListeningAttempt.findUnique({
      where: { id: attempt.listeningAttemptId },
    });
  }
  if (attempt.writingAttemptId) {
    writingAttempt = await prisma.userWritingAttempt.findUnique({
      where: { id: attempt.writingAttemptId },
    });
  }
  if (attempt.speakingAttemptId) {
    speakingAttempt = await prisma.userSpeakingAttempt.findUnique({
      where: { id: attempt.speakingAttemptId },
    });
  }

  // Calculate scores
  const bandScores: number[] = [];
  let allSectionsCompleted = true;
  let allSectionsGraded = true;

  // Reading check
  if (attempt.mockTest.readingExamId) {
    if (readingAttempt && readingAttempt.status === AttemptStatus.SUBMITTED) {
      if (readingAttempt.bandScore != null) {
        bandScores.push(readingAttempt.bandScore);
      }
    } else {
      allSectionsCompleted = false;
    }
  }

  // Listening check
  if (attempt.mockTest.listeningExamId) {
    if (listeningAttempt && listeningAttempt.status === AttemptStatus.SUBMITTED) {
      if (listeningAttempt.bandScore != null) {
        bandScores.push(listeningAttempt.bandScore);
      }
    } else {
      allSectionsCompleted = false;
    }
  }

  // Writing check
  if (attempt.mockTest.writingExamId) {
    if (writingAttempt && writingAttempt.status === AttemptStatus.SUBMITTED) {
      if (writingAttempt.bandScore != null) {
        bandScores.push(writingAttempt.bandScore);
      } else {
        allSectionsGraded = false; // Submitted but pending teacher grading
      }
    } else {
      allSectionsCompleted = false;
    }
  }

  // Speaking check
  if (attempt.mockTest.speakingExamId) {
    if (speakingAttempt && speakingAttempt.status === AttemptStatus.SUBMITTED) {
      if (speakingAttempt.bandScore != null) {
        bandScores.push(speakingAttempt.bandScore);
      } else {
        allSectionsGraded = false; // Submitted but pending teacher grading
      }
    } else {
      allSectionsCompleted = false;
    }
  }

  let overallBandScore: number | null = null;
  if (allSectionsCompleted && allSectionsGraded && bandScores.length > 0) {
    const sum = bandScores.reduce((acc, score) => acc + score, 0);
    const avg = sum / bandScores.length;
    overallBandScore = roundToHalf(avg);
  }

  return {
    ...attempt,
    readingAttempt,
    listeningAttempt,
    writingAttempt,
    speakingAttempt,
    allSectionsCompleted,
    allSectionsGraded,
    overallBandScore,
  };
};

// 8. Link completed sub-attempt to Mock Test Attempt
const updateAttempt = async (attemptId: string, userId: string, payload: IUpdateMockAttemptPayload) => {
  const attempt = await prisma.userMockAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new AppError(status.NOT_FOUND, "Mock attempt not found");
  }

  if (attempt.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Access denied to this attempt");
  }

  // Check if updating the attempt will complete the entire test
  const updatedAttempt = await prisma.userMockAttempt.update({
    where: { id: attemptId },
    data: {
      readingAttemptId: payload.readingAttemptId !== undefined ? payload.readingAttemptId : attempt.readingAttemptId,
      listeningAttemptId: payload.listeningAttemptId !== undefined ? payload.listeningAttemptId : attempt.listeningAttemptId,
      writingAttemptId: payload.writingAttemptId !== undefined ? payload.writingAttemptId : attempt.writingAttemptId,
      speakingAttemptId: payload.speakingAttemptId !== undefined ? payload.speakingAttemptId : attempt.speakingAttemptId,
    },
    include: {
      mockTest: true,
    },
  });

  // Verify completeness to set status to SUBMITTED
  const hasReading = !updatedAttempt.mockTest.readingExamId || !!updatedAttempt.readingAttemptId;
  const hasListening = !updatedAttempt.mockTest.listeningExamId || !!updatedAttempt.listeningAttemptId;
  const hasWriting = !updatedAttempt.mockTest.writingExamId || !!updatedAttempt.writingAttemptId;
  const hasSpeaking = !updatedAttempt.mockTest.speakingExamId || !!updatedAttempt.speakingAttemptId;

  if (hasReading && hasListening && hasWriting && hasSpeaking && updatedAttempt.status !== AttemptStatus.SUBMITTED) {
    return await prisma.userMockAttempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.SUBMITTED },
    });
  }

  return updatedAttempt;
};

export const MockTestService = {
  createMockTest,
  createFullMockTest,
  getAllMockTests,
  getMockTestById,
  updateMockTest,
  deleteMockTest,
  createAttempt,
  getAttemptById,
  updateAttempt,
};
