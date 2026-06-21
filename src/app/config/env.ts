//src/app/config/env.ts
import dotenv from 'dotenv';
import status from 'http-status';
import AppError from '../errorHelpers/AppError.js';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;
    EMAIL_SENDER:{
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_HOST: string;
        SMTP_PORT: string;
        SMTP_FROM: string;
    }
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    FRONTEND_URL: string;
    CLOUDINARY:{
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    },
    SUPER_ADMIN_EMAIL: string;
    SUPER_ADMIN_PASSWORD: string;
    REDIS_URL?: string;
}


const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_URL',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'ACCESS_TOKEN_EXPIRES_IN',
        'REFRESH_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE',
        'EMAIL_SENDER_SMTP_USER',
        'EMAIL_SENDER_SMTP_PASS',
        'EMAIL_SENDER_SMTP_HOST',
        'EMAIL_SENDER_SMTP_PORT',
        'EMAIL_SENDER_SMTP_FROM',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CALLBACK_URL',
        'FRONTEND_URL',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'SUPER_ADMIN_EMAIL',
        'SUPER_ADMIN_PASSWORD',
    ]

const getCleanEnv = (key: string): string => {
        const val = process.env[key] || "";
        return val.trim().replace(/^["']|["']$/g, "");
    };

    const getCleanEnvOptional = (key: string): string | undefined => {
        const val = process.env[key];
        if (!val) return undefined;
        return val.trim().replace(/^["']|["']$/g, "");
    };

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
    })

    return {
        NODE_ENV: getCleanEnv('NODE_ENV'),
        PORT: getCleanEnv('PORT'),
        DATABASE_URL: getCleanEnv('DATABASE_URL'),
        BETTER_AUTH_SECRET: getCleanEnv('BETTER_AUTH_SECRET'),
        BETTER_AUTH_URL: getCleanEnv('BETTER_AUTH_URL'),
        ACCESS_TOKEN_SECRET: getCleanEnv('ACCESS_TOKEN_SECRET'),
        REFRESH_TOKEN_SECRET: getCleanEnv('REFRESH_TOKEN_SECRET'),
        ACCESS_TOKEN_EXPIRES_IN: getCleanEnv('ACCESS_TOKEN_EXPIRES_IN'),
        REFRESH_TOKEN_EXPIRES_IN: getCleanEnv('REFRESH_TOKEN_EXPIRES_IN'),
        BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: getCleanEnv('BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN'),
        BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: getCleanEnv('BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE'),
        EMAIL_SENDER: {
            SMTP_USER: getCleanEnv('EMAIL_SENDER_SMTP_USER'),
            SMTP_PASS: getCleanEnv('EMAIL_SENDER_SMTP_PASS'),
            SMTP_HOST: getCleanEnv('EMAIL_SENDER_SMTP_HOST'),
            SMTP_PORT: getCleanEnv('EMAIL_SENDER_SMTP_PORT'),
            SMTP_FROM: getCleanEnv('EMAIL_SENDER_SMTP_FROM'),
        },
        GOOGLE_CLIENT_ID: getCleanEnv('GOOGLE_CLIENT_ID'),
        GOOGLE_CLIENT_SECRET: getCleanEnv('GOOGLE_CLIENT_SECRET'),
        GOOGLE_CALLBACK_URL: getCleanEnv('GOOGLE_CALLBACK_URL'),
        FRONTEND_URL: getCleanEnv('FRONTEND_URL'),
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: getCleanEnv('CLOUDINARY_CLOUD_NAME'),
            CLOUDINARY_API_KEY: getCleanEnv('CLOUDINARY_API_KEY'),
            CLOUDINARY_API_SECRET: getCleanEnv('CLOUDINARY_API_SECRET'),
        },  
        SUPER_ADMIN_EMAIL: getCleanEnv('SUPER_ADMIN_EMAIL'),
        SUPER_ADMIN_PASSWORD: getCleanEnv('SUPER_ADMIN_PASSWORD'),
        REDIS_URL: getCleanEnvOptional('REDIS_URL'),
    }

}

export const envVars = loadEnvVariables();