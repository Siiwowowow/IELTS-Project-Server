CREATE TABLE "user_vocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "bangla" TEXT NOT NULL,
    "pronunciation" TEXT,
    "partOfSpeech" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "exampleBangla" TEXT,
    "collocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topic" TEXT NOT NULL DEFAULT 'Custom',
    "level" TEXT NOT NULL DEFAULT 'Intermediate',
    "simpleExample" TEXT,
    "compoundExample" TEXT,
    "complexExample" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_vocabulary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vocabulary_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vocabulary_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_vocabulary_userId_word_key" ON "user_vocabulary"("userId", "word");
CREATE INDEX "user_vocabulary_userId_idx" ON "user_vocabulary"("userId");
CREATE UNIQUE INDEX "vocabulary_bookmarks_userId_wordId_key" ON "vocabulary_bookmarks"("userId", "wordId");
CREATE INDEX "vocabulary_bookmarks_userId_idx" ON "vocabulary_bookmarks"("userId");
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vocabulary_bookmarks" ADD CONSTRAINT "vocabulary_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
