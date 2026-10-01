/* eslint-disable @typescript-eslint/no-explicit-any */
//src/app/module/auth/auth.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { AuthService } from "./auth.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { tokenUtils } from "../../utils/token.js";
import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { envVars } from "../../config/env.js";
import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { redisClient } from "../../config/redis.js";
import { prisma } from "../../lib/prisma.js";
import { uploadFileToCloudinary } from "../../config/cloudinary.config.js";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  // ✅ File থাকলে Cloudinary তে upload করুন
  let imageUrl: string | undefined;

  const files = req.files as { [fieldName: string]: Express.Multer.File[] } | undefined;

  if (files?.profilePhoto?.[0]) {
    const file = files.profilePhoto[0];
    const uploadResult = await uploadFileToCloudinary(file.buffer, file.originalname);
    imageUrl = uploadResult.secure_url;
  }

  const result = await AuthService.registerUSer(req.body, imageUrl);

  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    httpCode: 201,
    success: true,
    message: "User created successfully",
    data: {
      ...rest,
      accessToken,
      refreshToken,
      token,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  sendResponse(res, {
    httpCode: 200,
    success: true,
    message: "Login successful",
    data: {
      ...rest,
      accessToken,
      refreshToken,
      token,
    },
  });
});

// =====================
// 🔥 FIXED GET ME
// =====================
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const result = await AuthService.getMe(userId);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});
const getNewToken = catchAsync(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const betterAuthSessionToken = req.cookies["__Secure-better-auth.session_token"] || req.cookies["better-auth.session_token"];
        if (!refreshToken) {
            throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
        }
        const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);

        const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
        
        if (sessionToken) {
            tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
        } else {
            tokenUtils.clearBetterAuthSessionCookie(res);
        }

        sendResponse(res, {
            httpCode: status.OK,
            success: true,
            message: "New tokens generated successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                sessionToken: sessionToken || null,
            },
        });
    }
)
const changePassword = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const betterAuthSessionToken = (req.cookies["__Secure-better-auth.session_token"] ||
        req.cookies["better-auth.session_token"]) as string | undefined;

    const result = await AuthService.changePassword(
        payload,
        betterAuthSessionToken,
        req.user.userId
    );

    const { accessToken, refreshToken, token: newSessionToken, ...rest } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    if (newSessionToken) {
        tokenUtils.setBetterAuthSessionCookie(res, newSessionToken);
    } else {
        tokenUtils.clearBetterAuthSessionCookie(res);
    }

    sendResponse(res, {
        httpCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: {
            ...rest,
            accessToken,
            refreshToken,
            token: newSessionToken,
        },
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = (req.cookies["__Secure-better-auth.session_token"] ||
    req.cookies["better-auth.session_token"]) as string | undefined;

  const data = await AuthService.logoutUser(sessionToken);

  tokenUtils.clearAccessTokenCookie(res);
  tokenUtils.clearRefreshTokenCookie(res);
  tokenUtils.clearBetterAuthSessionCookie(res);

  sendResponse(res, {
    httpCode: status.OK,
    success: true,
    message: "Logged out successfully",
    data,
  });
});

const verifyEmail = catchAsync(
    async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        await AuthService.verifyEmail(email, otp);

        sendResponse(res, {
            httpCode: status.OK,
            success: true,
            message: "Email verified successfully",
        });
    }
)
const forgetPassword = catchAsync(
  async (req: Request, res: Response) => {
      const { email } = req.body;
      await AuthService.forgetPassword(email);

      sendResponse(res, {
          httpCode: status.OK,
          success: true,
          message: "Password reset OTP sent to email successfully",
      });
  }
)
const resetPassword = catchAsync(
  async (req: Request, res: Response) => {
      const { email, otp, newPassword } = req.body;
      await AuthService.resetPassword(email, otp, newPassword);

      sendResponse(res, {
          httpCode: status.OK,
          success: true,
          message: "Password reset successfully",
      });
  }
)
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || "/";
  const encodedRedirectPath = encodeURIComponent(redirectPath);

  const baseCallbackURL = envVars.BETTER_AUTH_URL.replace(
    "/api/auth",
    "/api/v1/auth/google/success"
  );
  const callbackURL = `${baseCallbackURL}?redirect=${encodedRedirectPath}`;
  const errorCallbackURL = `${envVars.FRONTEND_URL}/login?error=social_login_failed`;

  try {
    const authResponse = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL,
        errorCallbackURL,
      },
      asResponse: true,
    });

    const rawSetCookie = typeof (authResponse.headers as any).getSetCookie === "function"
      ? (authResponse.headers as any).getSetCookie()
      : [authResponse.headers.get("set-cookie")].filter(Boolean);

    if (rawSetCookie && rawSetCookie.length > 0) {
      rawSetCookie.forEach((cookieStr: string) => {
        res.append("Set-Cookie", cookieStr);
      });
    }

    const data = await authResponse.json();

    if (data?.url) {
      return res.redirect(data.url);
    }

    console.error("signInSocial returned no URL:", data);
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=social_login_failed`);
  } catch (error) {
    console.error("Error in googleLogin:", error);
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=social_login_failed`);
  }
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const sessionTokenCookie =
    req.cookies["__Secure-better-auth.session_token"] ||
    req.cookies["better-auth.session_token"];

  const rawCookieHeader = req.headers.cookie || "";
  let sessionToken = sessionTokenCookie;
  if (!sessionToken && rawCookieHeader) {
    const match = rawCookieHeader.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
    if (match) {
      sessionToken = decodeURIComponent(match[1]);
    }
  }

  if (!sessionToken) {
    console.error("googleLoginSuccess: sessionToken cookie missing from request");
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=social_login_failed`);
  }

  let session: any = null;
  try {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
  } catch (err) {
    console.warn("auth.api.getSession threw error:", err);
  }

  if (!session?.user || !session?.session) {
    const rawToken = sessionToken.split(".")[0];
    console.log("googleLoginSuccess: getSession returned null, trying fallback with rawToken:", rawToken);

    try {
      const ctx = await (auth as any).$context;
      const foundSession = await ctx.internalAdapter.findSession(rawToken);
      if (foundSession?.user && foundSession?.session) {
        session = foundSession;
      }
    } catch (err) {
      console.warn("ctx.internalAdapter.findSession failed:", err);
    }

    if (!session?.user && redisClient) {
      try {
        const raw = await redisClient.get("better-auth:" + rawToken);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (parsed?.user && parsed?.session) {
            session = parsed;
          }
        }
      } catch (err) {
        console.warn("Redis direct get failed:", err);
      }
    }

    if (!session?.user) {
      try {
        const dbSession = await prisma.session.findUnique({
          where: { token: rawToken },
          include: { user: true },
        });
        if (dbSession && dbSession.user) {
          session = {
            session: dbSession,
            user: dbSession.user,
          };
        }
      } catch (err) {
        console.warn("prisma.session.findUnique failed:", err);
      }
    }
  }

  if (!session?.user) {
    console.error("googleLoginSuccess: Failed to retrieve user session after all attempts");
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=social_login_failed`);
  }

  try {
    const result = await AuthService.googleLoginSuccess(session);

    const { accessToken, refreshToken } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    if (sessionToken) {
      tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
    }

    const redirectPath = (req.query.redirect as string) || "/";

    const redirectUrl = `${envVars.FRONTEND_URL}/?login=success` +
      `&accessToken=${encodeURIComponent(accessToken)}` +
      `&refreshToken=${encodeURIComponent(refreshToken)}` +
      `&sessionToken=${encodeURIComponent(sessionToken)}` +
      `&redirect=${encodeURIComponent(redirectPath)}`;

    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("googleLoginSuccess AuthService error:", error);
    tokenUtils.clearAccessTokenCookie(res);
    tokenUtils.clearRefreshTokenCookie(res);
    tokenUtils.clearBetterAuthSessionCookie(res);
    res.clearCookie("__Secure-better-auth.session_token", { path: "/" });
    res.clearCookie("better-auth.session_token", { path: "/" });
    const errorCode = error?.statusCode === status.FORBIDDEN
      ? (error?.message?.includes("student") ? "social_account_not_student" : "social_login_failed")
      : "social_login_failed";
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=${errorCode}`);
  }
});

const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = req.query.error as string || "oauth_failed";
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});
export const AuthController = {
  registerUser,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};
