/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { deleteFileFromCloudinary } from "../config/cloudinary.config.js";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import { handleZodError } from "../errorHelpers/handleZodError.js";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface.js";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error from Global Error Handler:", err);

    // Safely attempt file cleanup only if a path exists (e.g. for disk storage)
    try {
        if (req.file && typeof req.file.path === 'string') {
            await deleteFileFromCloudinary(req.file.path);
        }

        if (req.files) {
            let filesArray: any[] = [];
            if (Array.isArray(req.files)) {
                filesArray = req.files;
            } else if (typeof req.files === 'object') {
                // If it is an object/dictionary (e.g. from multer.fields)
                filesArray = Object.values(req.files).flat().filter(Boolean);
            }
            
            for (const file of filesArray) {
                if (file && typeof file.path === 'string') {
                    await deleteFileFromCloudinary(file.path);
                }
            }
        }
    } catch (cleanupError) {
        console.error("Error during file cleanup in globalErrorHandler:", cleanupError);
    }

    let errorSources: TErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal Server Error';
    let stack: string | undefined = undefined;

    //Zod Error Patttern
    /*
     error.issues; 
    /* [
      {
        expected: 'string',
        code: 'invalid_type',
        path: [ 'username' , 'password' ], => username password
        message: 'Invalid input: expected string'
      },
      {
        expected: 'number',
        code: 'invalid_type',
        path: [ 'xp' ],
        message: 'Invalid input: expected number'
      }
    ] 
    */

    if (err instanceof z.ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...simplifiedError.errorSources]
        stack = err.stack;

    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }
    else if (err instanceof Error) {
        statusCode = status.INTERNAL_SERVER_ERROR;
        message = err.message
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }


    const errorResponse: TErrorResponse = {
        success: false,
        message: message,
        errorSources,
        error: err,
        stack: stack,
    }

    res.status(statusCode).json(errorResponse);
}