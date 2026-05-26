import { Request, Response, NextFunction } from "express";
import status from "http-status";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next();
    }
    res.status(status.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} Not Found`,
    });
}