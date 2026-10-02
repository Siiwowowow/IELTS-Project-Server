import { prisma } from "../../lib/prisma.js";

const getLibrary = async (userId?: string) => {
  const [words, bookmarks] = await Promise.all([
    prisma.vocabularyWord.findMany({ orderBy: [{ topic: "asc" }, { word: "asc" }] }),
    userId
      ? prisma.vocabularyBookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);
  return { words, bookmarks };
};
const getAllWords = () => prisma.vocabularyWord.findMany({ orderBy: { createdAt: "desc" } });
const createWord = (creatorId: string, payload: Record<string, unknown>) => prisma.vocabularyWord.create({ data: { ...payload, creatorId } as never });
const updateWord = (id: string, payload: Record<string, unknown>) => prisma.vocabularyWord.update({ where: { id }, data: payload });
const deleteWord = async (id: string) => { await prisma.vocabularyWord.delete({ where: { id } }); return null; };
const toggleBookmark = async (userId: string, wordId: string, word: string, meaning: string) => {
  const existing = await prisma.vocabularyBookmark.findUnique({ where: { userId_wordId: { userId, wordId } } });
  if (existing) {
    // deleteMany is deliberately idempotent. A repeated/concurrent toggle may
    // have removed this row after findUnique, and that should not become P2025.
    await prisma.vocabularyBookmark.deleteMany({ where: { userId, wordId } });
    return { bookmarked: false, wordId };
  }
  await prisma.vocabularyBookmark.create({ data: { userId, wordId, word, meaning } });
  return { bookmarked: true, wordId };
};
export const VocabularyService = { getLibrary, getAllWords, createWord, updateWord, deleteWord, toggleBookmark };
