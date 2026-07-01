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
  options?: string[]; // E.g., headings lists, feature lists, matching keys, etc.
  imageUrl?: string;
  order: number;
  questions: ICreateQuestionPayload[];
}

export interface ICreateSectionPayload {
  title: string;
  audioUrl: string;
  youtubeUrl?: string;
  script?: string;
  instruction?: string;
  order: number;
  questionGroups: ICreateQuestionGroupPayload[];
}

export interface ICreateListeningExamPayload {
  title: string;
  description?: string;
  duration?: number;
  isPublished?: boolean;
  isMockOnly?: boolean;
  sections?: ICreateSectionPayload[];
}

export interface ISubmitAnswerPayload {
  questionId: string;
  submittedAnswer: string;
}

export interface ISubmitAttemptPayload {
  answers: ISubmitAnswerPayload[];
}
