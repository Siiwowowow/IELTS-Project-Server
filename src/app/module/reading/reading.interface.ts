import { QuestionGroupType } from "@prisma/client";

export interface ICreateQuestionPayload {
  questionNumber: number;
  questionText?: string;
  options?: string[]; // Array of options (e.g. A, B, C, D) for MCQ
  correctAnswer: string;
  explanation?: string;
}

export interface ICreateQuestionGroupPayload {
  type: QuestionGroupType;
  instruction?: string;
  passageSegment?: string;
  options?: string[]; // E.g., headings lists, feature lists, etc.
  imageUrl?: string;
  order: number;
  questions: ICreateQuestionPayload[];
}

export interface ICreatePassagePayload {
  title: string;
  text?: string;
  body?: string;
  instruction?: string;
  pdfUrl?: string;
  imageUrl?: string;
  order: number;
  questionGroups: ICreateQuestionGroupPayload[];
}

export interface ICreateExamPayload {
  title: string;
  description?: string;
  duration?: number;
  isPublished?: boolean;
  isMockOnly?: boolean;
  passages?: ICreatePassagePayload[];
}

export interface ISubmitAnswerPayload {
  questionId: string;
  submittedAnswer: string;
}

export interface ISubmitAttemptPayload {
  answers: ISubmitAnswerPayload[];
}
