CREATE INDEX IF NOT EXISTS "user_mock_attempts_userId_createdAt_idx"
ON "user_mock_attempts"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "user_mock_attempts_mockTestId_userId_status_idx"
ON "user_mock_attempts"("mockTestId", "userId", "status");

CREATE INDEX IF NOT EXISTS "user_exam_attempts_userId_createdAt_idx"
ON "user_exam_attempts"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "user_listening_attempts_userId_createdAt_idx"
ON "user_listening_attempts"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "user_writing_attempts_userId_createdAt_idx"
ON "user_writing_attempts"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "user_speaking_attempts_userId_createdAt_idx"
ON "user_speaking_attempts"("userId", "createdAt");
