//src/app/utils/email.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";

// isGmail removed – condition inline below
let transporter;
if (envVars.EMAIL_SENDER.SMTP_HOST && envVars.EMAIL_SENDER.SMTP_HOST.includes('gmail')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: envVars.EMAIL_SENDER.SMTP_USER,
      pass: envVars.EMAIL_SENDER.SMTP_PASS,
    },
  });
} else {
  transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER.SMTP_HOST,
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
    secure: false,
    auth: {
      user: envVars.EMAIL_SENDER.SMTP_USER,
      pass: envVars.EMAIL_SENDER.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[]
}

export const sendEmail = async ({subject, templateData, templateName, to, attachments} : SendEmailOptions) => {
   
    
    try {
        const templatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);

        const html = await ejs.renderFile(templatePath, templateData);

        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to : to,
            subject : subject,
            html : html,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        })

        console.log(`Email sent to ${to} : ${info.messageId}`);
    } catch (error : any) {
        console.log("Email Sending Error", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
}