export interface ICreateSpeakingQuestionPayload {
  questionText: string;
  audioUrl?: string;
  order: number;
}

export interface ICreateSpeakingPartPayload {
  partNumber: number;
  title: string;
  instruction?: string;
  preparationTime?: number;
  speakingTime?: number;
  order: number;
  questions?: ICreateSpeakingQuestionPayload[];
}

export interface ICreateSpeakingExamPayload {
  title: string;
  description?: string;
  duration?: number;
  isPublished?: boolean;
  parts?: ICreateSpeakingPartPayload[];
}

export interface ISubmitSpeakingAttemptPayload {
  answers: {
    questionId: string;
    audioUrl?: string;
  }[];
}

export interface IGradeSpeakingAttemptPayload {
  grades: {
    answerId: string;
    fluencyScore: number;
    lexicalScore: number;
    grammarScore: number;
    pronunciationScore: number;
    feedback?: string;
  }[];
}
