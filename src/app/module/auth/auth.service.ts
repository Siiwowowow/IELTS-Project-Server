/* eslint-disable @typescript-eslint/no-unused-vars */

//src/app/module/auth/auth.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { auth } from "../../lib/auth.js";
import { IChangePasswordPayload, ILoginUserPayload, IRegisterUserPayload } from "./auth.interface.js";
import { tokenUtils } from "../../utils/token.js";
import { prisma } from "../../lib/prisma.js";
import { jwtUtils } from "../../utils/jwt.js";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env.js";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { randomBytes } from "node:crypto";
import { userStatus } from "@prisma/client";

/** Must match `session.expiresIn` in lib/auth.ts (seconds) → ms for Date */
const SESSION_DURATION_MS = 60 * 60 * 24 * 1000;

// src/app/module/auth/auth.service.ts (শুধু পরিবর্তিত অংশ)

const registerUSer = async (
  payload: IRegisterUserPayload,
  imageUrl?: string
) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, "Registration failed");
  }

  // ✅ SAFE USER SYNC
  await prisma.user.upsert({
    where: { email: data.user.email },
    update: {
      name: data.user.name,
      image: imageUrl ?? null,
    },
    create: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      image: imageUrl ?? null,
    },
  });

  // 🔥 FIXED: JWT তে সব necessary ফিল্ড যোগ করা
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
    needPasswordChange: data.user.needPasswordChange, // ✅ ADDED
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
    needPasswordChange: data.user.needPasswordChange, // ✅ ADDED
  });

  return {
    user: data.user,
    token: data.token,
    accessToken,
    refreshToken,
    message: "OTP sent to email",
    email: data.user.email,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: { email, password },
  });

  if (!data.user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  // 🔥 FIXED: JWT তে সব necessary ফিল্ড
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
    needPasswordChange: data.user.needPasswordChange, // ✅ ADDED
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
    needPasswordChange: data.user.needPasswordChange, // ✅ ADDED
  });

  await prisma.account.updateMany({
    where: { userId: data.user.id, providerId: "credential" },
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: data.user,
    token: data.token,
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      emailVerified: true, // ✅ ADDED
      needPasswordChange: true, // ✅ ADDED
      isDeleted: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};
const getNewToken = async (refreshToken : string, sessionToken : string | undefined) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET)

    if(!verifiedRefreshToken.success){
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const data = verifiedRefreshToken.data as JwtPayload;

    // ✅ Session fetches are optional and fail-safe during refresh
    let session: any = null;
    if (sessionToken) {
        try {
            session = await auth.api.getSession({
                headers: {
                    Cookie: `better-auth.session_token=${sessionToken}`,
                },
            });
        } catch (err) {
            console.error("Error fetching session in getNewToken:", err);
        }
    }

    const newAccessToken = tokenUtils.getAccessToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
        needPasswordChange: data.needPasswordChange,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
        needPasswordChange: data.needPasswordChange,
    });

    if (session && session.session) {
        try {
            await prisma.session.update({
                where: {
                    id: session.session.id,
                },
                data: {
                    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
                    updatedAt: new Date(),
                },
            });
        } catch (err) {
            // Safe to ignore if session is Redis-only or not in DB
        }
    }

    // Parse token expiration from JWT payload and save to Account
    const decodedAccessToken: any = jwtUtils.verifyToken(newAccessToken, envVars.ACCESS_TOKEN_SECRET);
    const decodedRefreshToken: any = jwtUtils.verifyToken(newRefreshToken, envVars.REFRESH_TOKEN_SECRET);

    const accessTokenExpiresAt = decodedAccessToken.success && decodedAccessToken.data?.exp 
        ? new Date(decodedAccessToken.data.exp * 1000) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const refreshTokenExpiresAt = decodedRefreshToken.success && decodedRefreshToken.data?.exp 
        ? new Date(decodedRefreshToken.data.exp * 1000) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ✅ Update existing Account record with new tokens (WITHOUT creating duplicates)
    await prisma.account.updateMany({
        where: {
            userId: data.userId,
            providerId: "credential",
        },
        data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessTokenExpiresAt: accessTokenExpiresAt,
            refreshTokenExpiresAt: refreshTokenExpiresAt,
        },
    });

    return {
        accessToken : newAccessToken,
        refreshToken : newRefreshToken,
        sessionToken : session && session.session ? sessionToken : undefined,
    }

}
const changePassword = async (
    payload: IChangePasswordPayload,
    sessionToken: string | undefined,
    authenticatedUserId: string
) => {
    const { currentPassword, newPassword } = payload;

    let user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
    let sessionId: string | null = null;

    if (sessionToken) {
        const sessionData = await auth.api.getSession({
            headers: {
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
        });

        if (!sessionData || !sessionData.session || !sessionData.user) {
            throw new AppError(status.UNAUTHORIZED, "Invalid session token");
        }
        if (sessionData.user.id !== authenticatedUserId) {
            throw new AppError(status.UNAUTHORIZED, "Session does not match user");
        }
        if (new Date(sessionData.session.expiresAt) < new Date()) {
            throw new AppError(status.UNAUTHORIZED, "Session token has expired");
        }

        const u = await prisma.user.findUnique({ where: { id: sessionData.user.id } });
        if (!u) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }
        user = u;
        sessionId = sessionData.session.id;
    } else {
        const u = await prisma.user.findUnique({ where: { id: authenticatedUserId } });
        if (!u) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }
        user = u;
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: user.id,
            providerId: "credential",
        },
    });

    if (!account?.password) {
        throw new AppError(status.BAD_REQUEST, "Account not found");
    }

    const passwordOk = await verifyPassword({
        hash: account.password,
        password: currentPassword,
    });
    if (!passwordOk) {
        throw new AppError(status.UNAUTHORIZED, "Current password is incorrect");
    }

    try {
        const hashedPassword = await hashPassword(newPassword);

        await prisma.account.update({
            where: { id: account.id },
            data: { password: hashedPassword },
        });

        let newSessionToken: string | null = null;

        if (sessionId) {
            // Revoke current session
            try {
                await auth.api.revokeSession({
                    body: {
                        token: sessionToken!
                    },
                    headers: {}
                });
            } catch (err) {
                // Ignore if it fails
            }
            
            // Delete other sessions in DB (if any)
            await prisma.session.deleteMany({
                where: {
                    userId: user.id,
                },
            });

            // Create new session by signing in again
            const loginRes = await auth.api.signInEmail({
                body: {
                    email: user.email,
                    password: newPassword,
                },
            });
            newSessionToken = loginRes.token;
        } else {
            await prisma.session.deleteMany({
                where: { userId: user.id },
            });
        }

        if (user.needPasswordChange) {
            await prisma.user.update({
                where: { id: user.id },
                data: { needPasswordChange: false },
            });
        }

        const accessToken = tokenUtils.getAccessToken({
            userId: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            status: user.status,
            isDeleted: user.isDeleted,
            emailVerified: user.emailVerified,
            needPasswordChange: user.needPasswordChange,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            status: user.status,
            isDeleted: user.isDeleted,
            emailVerified: user.emailVerified,
            needPasswordChange: user.needPasswordChange,
        });

        // Parse token expiration from JWT payload and save to Account
        const decodedAccessToken: any = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
        const decodedRefreshToken: any = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);

        const accessTokenExpiresAt = decodedAccessToken.success && decodedAccessToken.data?.exp 
            ? new Date(decodedAccessToken.data.exp * 1000) 
            : new Date(Date.now() + 24 * 60 * 60 * 1000);

        const refreshTokenExpiresAt = decodedRefreshToken.success && decodedRefreshToken.data?.exp 
            ? new Date(decodedRefreshToken.data.exp * 1000) 
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update Account with new tokens
        await prisma.account.update({
            where: { id: account.id },
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                accessTokenExpiresAt: accessTokenExpiresAt,
                refreshTokenExpiresAt: refreshTokenExpiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            token: newSessionToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    } catch (error: unknown) {
        console.error("Password update error:", error);
        throw new AppError(status.BAD_REQUEST, "Failed to change password");
    }
};

const logoutUser = async (sessionToken: string | undefined) => {
  let serverSessionRemoved = false;
  if (sessionToken) {
    const deleted = await prisma.session.deleteMany({
      where: { token: sessionToken },
    });
    serverSessionRemoved = deleted.count > 0;
  }

  return {
    loggedOut: true,
    serverSessionRemoved,
    cookiesCleared: [
      "accessToken",
      "refreshToken",
      "better-auth.session_token",
    ] as const,
  };
};

const verifyEmail = async (email: string, otp: string) => {
  console.log('verifyEmail called for email:', email, 'otp:', otp);
  let result;
    try {
      result = await auth.api.verifyEmailOTP({
        body: { email, otp },
      });
      console.log('Email verification succeeded for', email);
    } catch (error) {
      console.error('Email verification failed for', email, error);
      throw error;
    }

  if (!result.user) {
    throw new AppError(status.BAD_REQUEST, "Invalid OTP");
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      status: userStatus.ACTIVE,
    },
  });

  return {
    success: true,
    message: "Email verified successfully",
  };
};
const forgetPassword = async (email : string) => {
  console.log('forgetPassword called for email:', email);
  const isUserExist = await prisma.user.findUnique({
      where: { email }
  });

  if (!isUserExist) {
      console.error('User not found for forgetPassword:', email);
      throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!isUserExist.emailVerified) {
      console.error('Email not verified for forgetPassword:', email);
      throw new AppError(status.BAD_REQUEST, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === userStatus.DELETED || isUserExist.status === userStatus.BLOCKED) {
      console.error('User is deleted or blocked for forgetPassword:', email);
      throw new AppError(status.NOT_FOUND, "User not found");
  }

  try {
      await auth.api.requestPasswordResetEmailOTP({
          body: { email }
      });
      console.log('OTP email sent for', email);
  } catch (error) {
      console.error('Failed to send OTP email for', email, error);
      throw error;
  }
  return { success: true, message: "OTP sent" };}
const resetPassword = async (email : string, otp : string, newPassword : string) => {
  console.log('resetPassword called for email:', email, 'otp:', otp);
  const isUserExist = await prisma.user.findUnique({
      where: { email }
  });

  if (!isUserExist) {
      console.error('User not found for resetPassword:', email);
      throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!isUserExist.emailVerified) {
      console.error('Email not verified for resetPassword:', email);
      throw new AppError(status.BAD_REQUEST, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === userStatus.DELETED) {
      console.error('User is deleted for resetPassword:', email);
      throw new AppError(status.NOT_FOUND, "User not found");
  }

  try {
      await auth.api.resetPasswordEmailOTP({
          body: { email, otp, password: newPassword }
      });
      console.log('Password reset successful for', email);
  } catch (error) {
      console.error('Failed to reset password for', email, error);
      throw error;
  }

  if (isUserExist.needPasswordChange) {
      await prisma.user.update({
          where: { id: isUserExist.id },
          data: { needPasswordChange: false }
      });
  }

  await prisma.session.deleteMany({
      where: { userId: isUserExist.id }
  });

  return { success: true, message: "Password reset successful" };}
const googleLoginSuccess = async (session: Record<string, any>) => {
  const googleImage =
    session.user.image ||
    session.user.picture ||
    session.user.avatar ||
    null;

  const user = await prisma.user.upsert({
    where: { id: session.user.id },
    update: {
      name: session.user.name,
      email: session.user.email,
      image: googleImage, // ✅ FIXED
    },
    create: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: googleImage, // ✅ FIXED
    },
  });

  const accessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
    needPasswordChange: user.needPasswordChange,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
    needPasswordChange: user.needPasswordChange,
  });

  return {
    accessToken,
    refreshToken,
  };
};


export const AuthService = {
  registerUSer,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};