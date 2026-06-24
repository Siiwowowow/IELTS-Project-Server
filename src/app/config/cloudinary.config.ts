/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import status from "http-status";
import AppError from "../errorHelpers/AppError.js";
import { envVars } from "./env.js";
import fs from "fs";
import path from "path";

cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
})

export const uploadFileToCloudinary = async (
    buffer : Buffer,
    fileName: string,
) : Promise<UploadApiResponse> =>{

    if(!buffer || !fileName) {
        throw new AppError(status.BAD_REQUEST, "File buffer and file name are required for upload");
    }

    const extension = fileName.split(".").pop()?.toLocaleLowerCase();

    const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".")
        .toLowerCase()
        .replace(/\s+/g, "-")
        // eslint-disable-next-line no-useless-escape
        .replace(/[^a-z0-9\-]/g, "");

    const uniqueName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileNameWithoutExtension;

    // Route files to appropriate folders and assign explicit resource types
    let folder = "images";
    let resource_type = "auto";

    if (extension === "pdf") {
        folder = "pdfs";
        resource_type = "raw";
    } else if (["mp3", "wav", "m4a", "ogg", "aac", "flac", "mpeg", "webm", "mp4"].includes(extension || "")) {
        folder = "audios";
        resource_type = "video"; // Cloudinary requires audio to be uploaded under 'video'
    }

    const uploadOptions = {
        resource_type: resource_type as any,
        public_id: uniqueName,
        folder : `ph-healthcare/${folder}`,
        timeout: 600000, // 10 minutes timeout (in milliseconds) to prevent Request Timeout (499)
    };

    if (buffer.length > 10 * 1024 * 1024) {
        // Use temp file and upload_large for files > 10MB to support chunked upload robustly
        const tempDir = path.join(process.cwd(), "temp_uploads");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, `temp_${uniqueName}.${extension}`);
        
        await fs.promises.writeFile(tempFilePath, buffer);

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(
                tempFilePath,
                {
                    ...uploadOptions,
                    chunk_size: 6000000, // 6MB chunks (must be >= 5MB to satisfy Cloudinary constraints)
                },
                async (error, result) => {
                    // Always cleanup the temp file
                    try {
                        await fs.promises.unlink(tempFilePath);
                    } catch (cleanupError) {
                        console.error("Failed to delete temp file:", cleanupError);
                    }

                    if (error) {
                        console.error("Cloudinary upload_large error details:", error);
                        return reject(new AppError(status.INTERNAL_SERVER_ERROR, `Failed to upload file to Cloudinary: ${error.message || JSON.stringify(error)}`));
                    }
                    resolve(result as UploadApiResponse);
                }
            );
        });
    } else {
        // Use standard upload stream for normal/small files <= 10MB
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if(error){
                        console.error("Cloudinary upload error details:", error);
                        return reject(new AppError(status.INTERNAL_SERVER_ERROR, `Failed to upload file to Cloudinary: ${error.message || JSON.stringify(error)}`));
                    }
                    resolve(result as UploadApiResponse);
                }
            );
            uploadStream.end(buffer);
        });
    }
}

export const deleteFileFromCloudinary = async (url : string) => {
    if (!url || typeof url !== 'string') {
        console.warn("Invalid or missing URL provided to deleteFileFromCloudinary");
        return;
    }

    try {
        const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

        const match = url.match(regex);

        if (match && match[1]) {
            const publicId = match[1];

            // Parse resource type from url path to delete the file correctly from Cloudinary
            let resource_type: "image" | "video" | "raw" = "image";
            if (url.includes("/video/upload/")) {
                resource_type = "video";
            } else if (url.includes("/raw/upload/")) {
                resource_type = "raw";
            }

            await cloudinary.uploader.destroy(
                publicId, {
                resource_type: resource_type
            }
            )

            console.log(`File ${publicId} (type: ${resource_type}) deleted from cloudinary`);
        }

    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to delete file from Cloudinary");
    }
}


export const cloudinaryUpload = cloudinary;