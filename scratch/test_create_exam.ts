// scratch/test_create_exam.ts
import { ReadingService } from "../src/app/module/reading/reading.service.js";
import { prisma } from "../src/app/lib/prisma.js";

async function main() {
  const payload = {
    title: "Test Exam " + Date.now(),
    description: "IELTS Academic Reading Mock Exam",
    duration: 60,
    isPublished: true,
    passages: [
      {
        title: "Test Passage 1",
        text: "This is a test passage body.",
        pdfUrl: "",
        imageUrl: "",
        order: 1,
        questionGroups: [
          {
            type: "TABLE_COMPLETION",
            instruction: "Complete the table below.",
            passageSegment: "| A | B |\n| --- | --- |\n| Text | [1] |",
            options: [],
            imageUrl: "",
            order: 1,
            questions: [
              {
                questionNumber: 1,
                questionText: "Text",
                options: [],
                correctAnswer: "Answer 1",
                explanation: "Explanation 1"
              }
            ]
          }
        ]
      }
    ]
  };

  console.log("Calling ReadingService.createExam...");
  const result = await ReadingService.createExam(payload as any);
  console.log("Result:", JSON.stringify(result, null, 2));
}

main()
  .catch(e => console.error("Error creating exam:", e))
  .finally(async () => await prisma.$disconnect());
