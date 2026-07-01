// src/app/module/mocktest/mocktest.interface.ts

export interface ICreateMockTestPayload {
  title: string;
  description?: string;
  isPublished?: boolean;
  readingExamId?: string | null;
  listeningExamId?: string | null;
  writingExamId?: string | null;
  speakingExamId?: string | null;
}

export interface IUpdateMockTestPayload {
  title?: string;
  description?: string;
  isPublished?: boolean;
  readingExamId?: string | null;
  listeningExamId?: string | null;
  writingExamId?: string | null;
  speakingExamId?: string | null;
}

export interface IUpdateMockAttemptPayload {
  readingAttemptId?: string | null;
  listeningAttemptId?: string | null;
  writingAttemptId?: string | null;
  speakingAttemptId?: string | null;
}
