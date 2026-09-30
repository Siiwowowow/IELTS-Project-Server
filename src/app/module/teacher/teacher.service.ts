/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/module/teacher/teacher.service.ts
import status from "http-status";
import { AttemptStatus, Role, userStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import {
  ICreateTeacherPayload,
  ITeacherFilterOptions,
  IUpdateTeacherPayload,
  IUpdateTeacherProfilePayload,
} from "./teacher.interface.js";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config.js";
import { auth } from "../../lib/auth.js";

// ──────────────────────────────────────────────
// 1. Create a new Teacher (Admin / Super Admin only)
// ──────────────────────────────────────────────
const createTeacher = async (payload: ICreateTeacherPayload) => {
  const { email, name, password, contactNumber, designation, bio, expertise, profilePhoto } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { teacher: true },
  });

  if (existingUser) {
    if (existingUser.role === Role.TEACHER || existingUser.teacher) {
      throw new AppError(status.CONFLICT, "Teacher with this email already exists");
    }

    // If user exists with student role, promote to TEACHER
    return await prisma.$transaction(async (tx: any) => {
      const updatedUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          role: Role.TEACHER,
          image: profilePhoto || existingUser.image,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: updatedUser.id,
          name: name || updatedUser.name || "Teacher",
          email: updatedUser.email,
          contactNumber,
          designation,
          bio,
          expertise,
          profilePhoto: profilePhoto || updatedUser.image,
        },
        include: {
          user: true,
        },
      });

      return teacher;
    });
  }

  // Create new user via Better Auth
  if (!password) {
    throw new AppError(status.BAD_REQUEST, "Password is required for new teacher registration");
  }

  const authUser = await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
  });

  if (!authUser?.user?.id) {
    throw new AppError(status.BAD_REQUEST, "Failed to create teacher authentication account");
  }

  return await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: authUser.user.id },
      data: {
        role: Role.TEACHER,
        emailVerified: true,
        status: userStatus.ACTIVE,
        image: profilePhoto || null,
      },
    });

    const teacher = await tx.teacher.create({
      data: {
        userId: authUser.user.id,
        name,
        email,
        contactNumber,
        designation,
        bio,
        expertise,
        profilePhoto: profilePhoto || null,
      },
      include: {
        user: true,
      },
    });

    return teacher;
  });
};

// ──────────────────────────────────────────────
// 2. Get All Teachers (with optional search/filters)
// ──────────────────────────────────────────────
const getAllTeachers = async (filters: ITeacherFilterOptions = {}) => {
  const { searchTerm, isDeleted } = filters;

  const whereClause: any = {
    isDeleted: isDeleted !== undefined ? isDeleted : false,
  };

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { designation: { contains: searchTerm, mode: "insensitive" } },
      { expertise: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const teachers = await prisma.teacher.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return teachers;
};

// ──────────────────────────────────────────────
// 3. Get Single Teacher By ID
// ──────────────────────────────────────────────
const getTeacherById = async (id: string) => {
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      isDeleted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher not found");
  }

  return teacher;
};

// ──────────────────────────────────────────────
// 4. Get Current Teacher Profile (Me)
// ──────────────────────────────────────────────
const getMyProfile = async (currentUser: IRequestUser) => {
  let teacher = await prisma.teacher.findFirst({
    where: {
      OR: [{ userId: currentUser.userId }, { email: currentUser.email }],
      isDeleted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });

  // If user has role TEACHER but no teacher record yet, auto-create one
  if (!teacher && currentUser.role === Role.TEACHER) {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (user) {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          name: user.name || "Teacher",
          email: user.email,
          profilePhoto: user.image,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              status: true,
              emailVerified: true,
              createdAt: true,
            },
          },
        },
      });
    }
  }

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher profile not found");
  }

  return teacher;
};

// ──────────────────────────────────────────────
// 5. Update My Profile (Teacher self update)
// ──────────────────────────────────────────────
const updateMyProfile = async (
  currentUser: IRequestUser,
  payload: IUpdateTeacherProfilePayload
) => {
  let teacher = await prisma.teacher.findFirst({
    where: {
      OR: [{ userId: currentUser.userId }, { email: currentUser.email }],
    },
  });

  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        userId: currentUser.userId,
        name: currentUser.name || "Teacher",
        email: currentUser.email,
      },
    });
  }

  // Handle old profile photo deletion if new one provided
  if (payload.profilePhoto && teacher.profilePhoto) {
    try {
      await deleteFileFromCloudinary(teacher.profilePhoto);
    } catch (error) {
      console.error("Failed to delete old teacher photo:", error);
    }
  }

  const updatedTeacher = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.teacher.update({
      where: { id: teacher.id },
      data: {
        name: payload.name !== undefined ? payload.name : teacher.name,
        contactNumber: payload.contactNumber !== undefined ? payload.contactNumber : teacher.contactNumber,
        designation: payload.designation !== undefined ? payload.designation : teacher.designation,
        bio: payload.bio !== undefined ? payload.bio : teacher.bio,
        expertise: payload.expertise !== undefined ? payload.expertise : teacher.expertise,
        profilePhoto: payload.profilePhoto !== undefined ? payload.profilePhoto : teacher.profilePhoto,
      },
      include: {
        user: true,
      },
    });

    // Also sync User table name and image
    await tx.user.update({
      where: { id: currentUser.userId },
      data: {
        name: payload.name !== undefined ? payload.name : undefined,
        image: payload.profilePhoto !== undefined ? payload.profilePhoto : undefined,
      },
    });

    return updated;
  });

  return updatedTeacher;
};

// ──────────────────────────────────────────────
// 6. Update Teacher by ID (Admin / Super Admin)
// ──────────────────────────────────────────────
const updateTeacher = async (id: string, payload: IUpdateTeacherPayload) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
  });

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher not found");
  }

  const { teacher: updateData } = payload;

  const updated = await prisma.$transaction(async (tx: any) => {
    const result = await tx.teacher.update({
      where: { id },
      data: {
        ...updateData,
      },
      include: {
        user: true,
      },
    });

    if (updateData?.name || updateData?.profilePhoto) {
      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          name: updateData.name || undefined,
          image: updateData.profilePhoto || undefined,
        },
      });
    }

    return result;
  });

  return updated;
};

// ──────────────────────────────────────────────
// 7. Delete Teacher (Soft Delete - Admin/Super Admin)
// ──────────────────────────────────────────────
const deleteTeacher = async (id: string, currentUser: IRequestUser) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
  });

  if (!teacher) {
    throw new AppError(status.NOT_FOUND, "Teacher not found");
  }

  if (teacher.userId === currentUser.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  return await prisma.$transaction(async (tx: any) => {
    const deletedTeacher = await tx.teacher.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: teacher.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: userStatus.DELETED,
      },
    });

    await tx.session.deleteMany({
      where: { userId: teacher.userId },
    });

    await tx.account.deleteMany({
      where: { userId: teacher.userId },
    });

    return deletedTeacher;
  });
};

// ──────────────────────────────────────────────
// 8. Teacher Dashboard Statistics
// ──────────────────────────────────────────────
const getDashboardStats = async (currentUser: IRequestUser) => {
  const teacherEmail = currentUser.email;
  const isSuperAdminOrAdmin =
    currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN;

  // Filter exams by creatorEmail for teachers, or all if admin
  const examCreatorFilter = isSuperAdminOrAdmin
    ? {}
    : { creatorEmail: teacherEmail };

  // 1. Exam Counts
  const [
    readingExamsCount,
    listeningExamsCount,
    writingExamsCount,
    speakingExamsCount,
    mockTestsCount,
  ] = await Promise.all([
    prisma.exam.count({ where: examCreatorFilter }),
    prisma.listeningExam.count({ where: examCreatorFilter }),
    prisma.writingExam.count({ where: examCreatorFilter }),
    prisma.speakingExam.count({ where: examCreatorFilter }),
    prisma.mockTest.count({ where: examCreatorFilter }),
  ]);

  const totalExamsCreated =
    readingExamsCount +
    listeningExamsCount +
    writingExamsCount +
    speakingExamsCount +
    mockTestsCount;

  // 2. Pending Evaluations (Writing & Speaking)
  // Writing: status is SUBMITTED and bandScore is null
  const writingPendingWhere: any = {
    status: AttemptStatus.SUBMITTED,
    bandScore: null,
  };
  if (!isSuperAdminOrAdmin) {
    writingPendingWhere.exam = { creatorEmail: teacherEmail };
  }

  // Speaking: status is SUBMITTED and bandScore is null
  const speakingPendingWhere: any = {
    status: AttemptStatus.SUBMITTED,
    bandScore: null,
  };
  if (!isSuperAdminOrAdmin) {
    speakingPendingWhere.exam = { creatorEmail: teacherEmail };
  }

  const [pendingWritingCount, pendingSpeakingCount] = await Promise.all([
    prisma.userWritingAttempt.count({ where: writingPendingWhere }),
    prisma.userSpeakingAttempt.count({ where: speakingPendingWhere }),
  ]);

  // 3. Graded Evaluations
  const writingGradedWhere: any = {
    status: AttemptStatus.SUBMITTED,
    bandScore: { not: null },
  };
  if (!isSuperAdminOrAdmin) {
    writingGradedWhere.exam = { creatorEmail: teacherEmail };
  }

  const speakingGradedWhere: any = {
    status: AttemptStatus.SUBMITTED,
    bandScore: { not: null },
  };
  if (!isSuperAdminOrAdmin) {
    speakingGradedWhere.exam = { creatorEmail: teacherEmail };
  }

  const [gradedWritingCount, gradedSpeakingCount] = await Promise.all([
    prisma.userWritingAttempt.count({ where: writingGradedWhere }),
    prisma.userSpeakingAttempt.count({ where: speakingGradedWhere }),
  ]);

  // 4. Total Student Attempts on teacher's exams
  const writingAttemptsWhere = isSuperAdminOrAdmin
    ? {}
    : { exam: { creatorEmail: teacherEmail } };
  const speakingAttemptsWhere = isSuperAdminOrAdmin
    ? {}
    : { exam: { creatorEmail: teacherEmail } };
  const readingAttemptsWhere = isSuperAdminOrAdmin
    ? {}
    : { exam: { creatorEmail: teacherEmail } };
  const listeningAttemptsWhere = isSuperAdminOrAdmin
    ? {}
    : { exam: { creatorEmail: teacherEmail } };

  const [
    totalWritingAttempts,
    totalSpeakingAttempts,
    totalReadingAttempts,
    totalListeningAttempts,
  ] = await Promise.all([
    prisma.userWritingAttempt.count({ where: writingAttemptsWhere }),
    prisma.userSpeakingAttempt.count({ where: speakingAttemptsWhere }),
    prisma.userExamAttempt.count({ where: readingAttemptsWhere }),
    prisma.userListeningAttempt.count({ where: listeningAttemptsWhere }),
  ]);

  const totalSubmissions =
    totalWritingAttempts +
    totalSpeakingAttempts +
    totalReadingAttempts +
    totalListeningAttempts;

  // 5. Recent Pending Submissions (Top 5 each)
  const recentPendingWriting = await prisma.userWritingAttempt.findMany({
    where: writingPendingWhere,
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      examId: true,
      exam: {
        select: {
          title: true,
          examType: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const recentPendingSpeaking = await prisma.userSpeakingAttempt.findMany({
    where: speakingPendingWhere,
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      examId: true,
      exam: {
        select: {
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return {
    overview: {
      totalExamsCreated,
      totalSubmissions,
      pendingEvaluations: pendingWritingCount + pendingSpeakingCount,
      completedEvaluations: gradedWritingCount + gradedSpeakingCount,
    },
    examsBreakdown: {
      reading: readingExamsCount,
      listening: listeningExamsCount,
      writing: writingExamsCount,
      speaking: speakingExamsCount,
      mockTests: mockTestsCount,
    },
    evaluations: {
      pending: {
        writing: pendingWritingCount,
        speaking: pendingSpeakingCount,
        total: pendingWritingCount + pendingSpeakingCount,
      },
      completed: {
        writing: gradedWritingCount,
        speaking: gradedSpeakingCount,
        total: gradedWritingCount + gradedSpeakingCount,
      },
    },
    recentPending: {
      writing: recentPendingWriting,
      speaking: recentPendingSpeaking,
    },
  };
};

// ──────────────────────────────────────────────
// 9. Get Pending Evaluations List
// ──────────────────────────────────────────────
const getPendingEvaluations = async (
  currentUser: IRequestUser,
  type?: "writing" | "speaking" | "all"
) => {
  const teacherEmail = currentUser.email;
  const isSuperAdminOrAdmin =
    currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN;

  const evaluationType = type || "all";

  let writingPending: any[] = [];
  let speakingPending: any[] = [];

  if (evaluationType === "writing" || evaluationType === "all") {
    const whereClause: any = {
      status: AttemptStatus.SUBMITTED,
      bandScore: null,
    };
    if (!isSuperAdminOrAdmin) {
      whereClause.exam = { creatorEmail: teacherEmail };
    }

    writingPending = await prisma.userWritingAttempt.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
            duration: true,
            creatorEmail: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        responses: {
          select: {
            id: true,
            taskId: true,
            taskBandScore: true,
            wordCount: true,
          },
        },
      },
    });
  }

  if (evaluationType === "speaking" || evaluationType === "all") {
    const whereClause: any = {
      status: AttemptStatus.SUBMITTED,
      bandScore: null,
    };
    if (!isSuperAdminOrAdmin) {
      whereClause.exam = { creatorEmail: teacherEmail };
    }

    speakingPending = await prisma.userSpeakingAttempt.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
            creatorEmail: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            audioUrl: true,
            bandScore: true,
          },
        },
      },
    });
  }

  return {
    writing: writingPending,
    speaking: speakingPending,
    counts: {
      writing: writingPending.length,
      speaking: speakingPending.length,
      total: writingPending.length + speakingPending.length,
    },
  };
};

export const TeacherService = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getMyProfile,
  updateMyProfile,
  updateTeacher,
  deleteTeacher,
  getDashboardStats,
  getPendingEvaluations,
};
