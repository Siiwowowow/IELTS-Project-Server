/* eslint-disable @typescript-eslint/no-explicit-any */
//src/app/middleware/checkAuth.ts
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { CookieUtils } from "../utils/cookie.js";
import { jwtUtils } from "../utils/jwt.js";
import { Role, userStatus } from "@prisma/client";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

      const sessionToken =
        CookieUtils.getCookie(req, "__Secure-better-auth.session_token") ||
        CookieUtils.getCookie(req, "better-auth.session_token") ||
        bearerToken;
      const accessToken = CookieUtils.getCookie(req, "accessToken") || bearerToken;

      let user: any = null;

      // ✅ Session try — fail হলে JWT try করবে
      if (sessionToken) {
        try {
          const session = await auth.api.getSession({
            headers: req.headers as any,
          });
          if (session?.user) {
            user = session.user;
          }
        } catch {
          user = null;
        }
      }

      // ✅ Session না পেলে JWT দিয়ে try
      if (!user && accessToken) {
        const verified = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
        if (verified.success) {
          user = verified.data;
        }
      }

      // ✅ দুটোই fail
      if (!user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Please login again.");
      }

      // Normalize Super Admin role if email matches env
      if (user.email === envVars.SUPER_ADMIN_EMAIL || user.role === Role.SUPER_ADMIN) {
        user.role = Role.SUPER_ADMIN;
        user.emailVerified = true;
        if (user.status === userStatus.PENDING_VERIFICATION) {
          user.status = userStatus.ACTIVE;
        }
      }

      const isMeRoute = req.originalUrl.endsWith("/me");

      if (
        user.status === userStatus.BLOCKED ||
        user.status === userStatus.DELETED ||
        user.isDeleted
      ) {
        throw new AppError(status.UNAUTHORIZED, "User is not active");
      }

      if (!isMeRoute && user.status === userStatus.PENDING_VERIFICATION) {
        throw new AppError(status.FORBIDDEN, "Account pending verification. Please verify your email.");
      }

      if (!isMeRoute && !user.emailVerified) {
        throw new AppError(status.FORBIDDEN, "Email verification required.");
      }

      if (authRoles.length > 0) {
        let currentRole: Role = user.role;
        let isSuperAdmin = currentRole === Role.SUPER_ADMIN || user.email === envVars.SUPER_ADMIN_EMAIL;
        let isAllowed = isSuperAdmin || authRoles.includes(currentRole);

        // Normalize if super admin
        if (isSuperAdmin) {
          currentRole = Role.SUPER_ADMIN;
          user.role = Role.SUPER_ADMIN;
        }

        // DB Fallback: If not allowed and not super admin, check database in case role was updated in DB
        if (!isAllowed) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.userId || user.id },
            select: { role: true, status: true, isDeleted: true, emailVerified: true },
          });

          if (dbUser) {
            currentRole = dbUser.role;
            user.role = dbUser.role;
            user.status = dbUser.status;
            user.emailVerified = dbUser.emailVerified;
            user.isDeleted = dbUser.isDeleted;

            if (currentRole === Role.SUPER_ADMIN || user.email === envVars.SUPER_ADMIN_EMAIL) {
              isSuperAdmin = true;
            }
            isAllowed = isSuperAdmin || authRoles.includes(currentRole);
          }
        }

        // Super Admin has master access across all routes
        if (isSuperAdmin) {
          isAllowed = true;
        }

        // If endpoint allows ADMIN, SUPER_ADMIN also has access
        if (authRoles.includes(Role.ADMIN) && (currentRole === Role.ADMIN || isSuperAdmin)) {
          isAllowed = true;
        }

        if (!isAllowed) {
          const onlyRequiresAdmin = authRoles.every(
            (r) => r === Role.ADMIN || r === Role.SUPER_ADMIN
          );

          if (onlyRequiresAdmin) {
            throw new AppError(status.FORBIDDEN, "Forbidden access: Admin privilege required");
          }

          throw new AppError(status.FORBIDDEN, "Forbidden access");
        }
      }

      // ✅ IRequestUser এর সব fields
      req.user = {
        name: user.name || "",
        userId: user.userId || user.id,
        role: user.role,
        email: user.email,
        isDeleted: user.isDeleted ?? false,
        emailVerified: user.emailVerified ?? false,
        status: user.status,
        image: user.image ?? null,
      };

      next();
    } catch (error: any) {
      next(error);
    }
  };

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const sessionToken =
      CookieUtils.getCookie(req, "__Secure-better-auth.session_token") ||
      CookieUtils.getCookie(req, "better-auth.session_token") ||
      bearerToken;
    const accessToken = CookieUtils.getCookie(req, "accessToken") || bearerToken;

    let user: any = null;

    if (sessionToken) {
      try {
        const session = await auth.api.getSession({
          headers: req.headers as any,
        });
        if (session?.user) {
          user = session.user;
        }
      } catch {
        user = null;
      }
    }

    if (!user && accessToken) {
      const verified = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
      if (verified.success) {
        user = verified.data;
      }
    }

    if (
      user &&
      !user.isDeleted &&
      user.status !== userStatus.BLOCKED &&
      user.status !== userStatus.DELETED
    ) {
      if (user.email === envVars.SUPER_ADMIN_EMAIL) {
        user.role = Role.SUPER_ADMIN;
      }

      req.user = {
        name: user.name || "",
        userId: user.userId || user.id,
        role: user.role,
        email: user.email,
        isDeleted: user.isDeleted ?? false,
        emailVerified: user.emailVerified ?? false,
        status: user.status,
        image: user.image ?? null,
      };
    }
  } catch {
    // ignore optional auth errors
  }
  next();
};