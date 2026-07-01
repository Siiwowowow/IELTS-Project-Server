import { WritingExamType, WritingTaskType } from "@prisma/client";

export interface ICreateWritingTaskPayload {
  taskType: WritingTaskType;
  instruction: string;
  imageUrl?: string;
  pdfUrl?: string;
  minWords?: number;
  modelAnswer?: string;
  order: number;
}

export interface ICreateWritingExamPayload {
  title: string;
  description?: string;
  examType?: WritingExamType;
  duration?: number;
  isPublished?: boolean;
  isMockOnly?: boolean;
  tasks?: ICreateWritingTaskPayload[];
}

export interface ISubmitWritingResponsePayload {
  taskId: string;
  essay?: string;
  wordCount?: number;
}

export interface ISubmitWritingAttemptPayload {
  responses: ISubmitWritingResponsePayload[];
}

export interface IGradeWritingResponsePayload {
  responseId: string;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  feedback?: string;
}

export interface IGradeWritingAttemptPayload {
  grades: IGradeWritingResponsePayload[];
}
