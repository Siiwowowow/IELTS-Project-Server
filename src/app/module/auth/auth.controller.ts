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
const googleLogin = catchAsync((req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || "/dashboard";

  const encodedRedirectPath = encodeURIComponent(redirectPath);

  const baseCallbackURL = envVars.BETTER_AUTH_URL.replace(
    "/api/auth",
    "/api/v1/auth/google/success"
  );
  const callbackURL = `${baseCallbackURL}?redirect=${encodedRedirectPath}`;

  const html = `
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb; color: #374151;">
        <div style="text-align: center;">
          <svg style="animation: spin 1s linear infinite; width: 40px; height: 40px; color: #2563eb; margin: 0 auto 16px auto;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style="font-size: 16px; font-weight: 500;">Redirecting to Google...</p>
        </div>

        <script>
          function log(msg) {
            console.log(msg);
          }
          
          log("Starting Google Auth flow...");
          log("POST ${envVars.BETTER_AUTH_URL}/sign-in/social");
          log("Callback: ${callbackURL}");

          fetch("${envVars.BETTER_AUTH_URL}/sign-in/social", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
              provider: "google",
              callbackURL: "${callbackURL}"
            })
          })
          .then(res => {
            log("Status: " + res.status);
            return res.json();
          })
          .then(data => {
            log("Response Data: " + JSON.stringify(data, null, 2));
            if (data.url) {
              log("Redirecting to: " + data.url);
              window.location.href = data.url;
            } else {
              document.body.innerHTML += "<br/><b>Failed to get redirect URL from server.</b>";
            }
          })
          .catch(err => {
            log("Error: " + err.message);
          });
        </script>
        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      </body>
    </html>
  `;

  return res.send(html);
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies["__Secure-better-auth.session_token"] || req.cookies["better-auth.session_token"];

  if (!sessionToken) {
    return res.redirect(`${envVars.FRONTEND_URL}/?login=error&reason=no_session_token_cookie`);
  }

 const session = await auth.api.getSession({
  headers: {
    Cookie: req.headers.cookie || "",
  },
});

console.log("GOOGLE SESSION:", session?.user); // 🔥 DEBUG (temporary)

  if (!session) {
    return res.redirect(`${envVars.FRONTEND_URL}/?login=error&reason=invalid_session_from_better_auth`);
  }

  if (!session.user) {
    return res.redirect(`${envVars.FRONTEND_URL}/?login=error&reason=no_user_in_session`);
  }

  try {
    const result = await AuthService.googleLoginSuccess(session);

    const { accessToken, refreshToken } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    const redirectUrl = `${envVars.FRONTEND_URL}/?login=success` +
      `&accessToken=${encodeURIComponent(accessToken)}` +
      `&refreshToken=${encodeURIComponent(refreshToken)}` +
      `&sessionToken=${encodeURIComponent(sessionToken)}`;

    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("googleLoginSuccess AuthService error:", error);
    return res.redirect(`${envVars.FRONTEND_URL}/?login=error&reason=auth_service_failed&message=${encodeURIComponent(error.message || 'unknown')}`);
  }
});

const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = req.query.error as string || "oauth_failed";
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
})
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