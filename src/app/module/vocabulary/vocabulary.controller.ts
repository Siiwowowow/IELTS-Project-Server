import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { VocabularyService } from "./vocabulary.service.js";

const getMine = catchAsync(async (req: Request, res: Response) =>
  sendResponse(res, {
    success: true,
    httpCode: status.OK,
    message: "Vocabulary library fetched",
    data: await VocabularyService.getLibrary((req.user as IRequestUser | undefined)?.userId),
  })
);
const getAllWords = catchAsync(async (_req: Request, res: Response) => sendResponse(res, { success: true, httpCode: status.OK, message: "Vocabulary fetched", data: await VocabularyService.getAllWords() }));
const createWord = catchAsync(async (req: Request, res: Response) => sendResponse(res, { success: true, httpCode: status.CREATED, message: "Vocabulary saved", data: await VocabularyService.createWord((req.user as IRequestUser).userId, req.body) }));
const updateWord = catchAsync(async (req: Request, res: Response) => sendResponse(res, { success: true, httpCode: status.OK, message: "Vocabulary updated", data: await VocabularyService.updateWord(req.params.id as string, req.body) }));
const deleteWord = catchAsync(async (req: Request, res: Response) => sendResponse(res, { success: true, httpCode: status.OK, message: "Vocabulary deleted", data: await VocabularyService.deleteWord(req.params.id as string) }));
const toggleBookmark = catchAsync(async (req: Request, res: Response) => sendResponse(res, { success: true, httpCode: status.OK, message: "Bookmark updated", data: await VocabularyService.toggleBookmark((req.user as IRequestUser).userId, req.params.wordId as string, req.body.word, req.body.meaning) }));
export const VocabularyController = { getMine, getAllWords, createWord, updateWord, deleteWord, toggleBookmark };
