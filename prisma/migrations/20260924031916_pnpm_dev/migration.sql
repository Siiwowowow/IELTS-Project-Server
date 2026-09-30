-- CreateEnum
CREATE TYPE "WritingExamType" AS ENUM ('ACADEMIC', 'GENERAL_TRAINING');

-- CreateEnum
CREATE TYPE "WritingTaskType" AS ENUM ('TASK_1', 'TASK_2');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionGroupType" ADD VALUE 'MULTIPLE_CHOICE_MULTIPLE';
ALTER TYPE "QuestionGroupType" ADD VALUE 'SUMMARY_COMPLETION';
ALTER TYPE "QuestionGroupType" ADD VALUE 'NOTES_COMPLETION';
ALTER TYPE "QuestionGroupType" ADD VALUE 'TABLE_COMPLETION';
ALTER TYPE "QuestionGroupType" ADD VALUE 'FLOW_CHART_COMPLETION';
ALTER TYPE "QuestionGroupType" ADD VALUE 'DIAGRAM_LABELLING';

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "creatorEmail" TEXT,
ADD COLUMN     "isMockOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "passages" ADD COLUMN     "body" TEXT,
ADD COLUMN     "instruction" TEXT;

-- AlterTable
ALTER TABLE "student" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "listening_exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 40,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isMockOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorEmail" TEXT,

    CONSTRAINT "listening_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_sections" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "script" TEXT,
    "instruction" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_question_groups" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" "QuestionGroupType" NOT NULL,
    "instruction" TEXT,
    "passageSegment" TEXT,
    "options" JSONB,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_question_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_questions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_listening_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_listening_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_listening_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "submittedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_listening_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT true,
    "creatorEmail" TEXT,
    "readingExamId" TEXT,
    "listeningExamId" TEXT,
    "writingExamId" TEXT,
    "speakingExamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mock_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "readingAttemptId" TEXT,
    "listeningAttemptId" TEXT,
    "writingAttemptId" TEXT,
    "speakingAttemptId" TEXT,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mock_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 15,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isMockOnly" BOOLEAN NOT NULL DEFAULT false,
    "creatorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaking_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_parts" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT,
    "preparationTime" INTEGER NOT NULL DEFAULT 0,
    "speakingTime" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaking_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_questions" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "audioUrl" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaking_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_speaking_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "bandScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_speaking_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_speaking_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "fluencyScore" DOUBLE PRECISION,
    "lexicalScore" DOUBLE PRECISION,
    "grammarScore" DOUBLE PRECISION,
    "pronunciationScore" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_speaking_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "examType" "WritingExamType" NOT NULL DEFAULT 'ACADEMIC',
    "duration" INTEGER NOT NULL DEFAULT 60,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isMockOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorEmail" TEXT,

    CONSTRAINT "writing_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_tasks" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "taskType" "WritingTaskType" NOT NULL,
    "instruction" TEXT NOT NULL,
    "imageUrl" TEXT,
    "pdfUrl" TEXT,
    "minWords" INTEGER NOT NULL DEFAULT 150,
    "modelAnswer" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_writing_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "bandScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_writing_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_writing_responses" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "essay" TEXT,
    "wordCount" INTEGER,
    "taskAchievement" DOUBLE PRECISION,
    "coherenceCohesion" DOUBLE PRECISION,
    "lexicalResource" DOUBLE PRECISION,
    "grammaticalRange" DOUBLE PRECISION,
    "taskBandScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_writing_responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "listening_sections" ADD CONSTRAINT "listening_sections_examId_fkey" FOREIGN KEY ("examId") REFERENCES "listening_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_question_groups" ADD CONSTRAINT "listening_question_groups_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "listening_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_questions" ADD CONSTRAINT "listening_questions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "listening_question_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_attempts" ADD CONSTRAINT "user_listening_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_attempts" ADD CONSTRAINT "user_listening_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "listening_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_answers" ADD CONSTRAINT "user_listening_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_listening_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_answers" ADD CONSTRAINT "user_listening_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "listening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_readingExamId_fkey" FOREIGN KEY ("readingExamId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_listeningExamId_fkey" FOREIGN KEY ("listeningExamId") REFERENCES "listening_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_writingExamId_fkey" FOREIGN KEY ("writingExamId") REFERENCES "writing_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_speakingExamId_fkey" FOREIGN KEY ("speakingExamId") REFERENCES "speaking_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_attempts" ADD CONSTRAINT "user_mock_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_attempts" ADD CONSTRAINT "user_mock_attempts_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "mock_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_parts" ADD CONSTRAINT "speaking_parts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "speaking_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_questions" ADD CONSTRAINT "speaking_questions_partId_fkey" FOREIGN KEY ("partId") REFERENCES "speaking_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_speaking_attempts" ADD CONSTRAINT "user_speaking_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_speaking_attempts" ADD CONSTRAINT "user_speaking_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "speaking_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_speaking_answers" ADD CONSTRAINT "user_speaking_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_speaking_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_speaking_answers" ADD CONSTRAINT "user_speaking_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "speaking_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_tasks" ADD CONSTRAINT "writing_tasks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "writing_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_writing_attempts" ADD CONSTRAINT "user_writing_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_writing_attempts" ADD CONSTRAINT "user_writing_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "writing_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_writing_responses" ADD CONSTRAINT "user_writing_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "user_writing_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_writing_responses" ADD CONSTRAINT "user_writing_responses_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "writing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
