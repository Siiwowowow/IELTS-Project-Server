// scratch/seed_listening_exam.ts
import { ListeningService } from "../src/app/module/listening/listening.service.js";
import { prisma } from "../src/app/lib/prisma.js";

async function main() {
  const listeningExamPayload = {
    title: "IELTS Listening Practice Test 1 (Seeded)",
    description: "Authentic Computer-Based IELTS Listening mock exam with audio. Contains Parts 1 to 4 and all standard listening question formats.",
    duration: 40,
    isPublished: true,
    sections: [
      {
        title: "Part 1",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        instruction: "Questions 1 - 10\nComplete the notes below.\nWrite NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        order: 1,
        questionGroups: [
          {
            type: "NOTES_COMPLETION",
            instruction: "Accommodation Rental Form Details",
            passageSegment: "Customer Name: John [1]\nCustomer Age: [2]\nOccupation: [3]\nCity: [4]\nContact Phone: [5]\nRental Type Preferred: [6]\nMonthly Budget Limit: £[7]\nLocation Requirements: near the [8]\nMove-in Date Target: [9] October\nSystem Registration Code: [10]",
            order: 1,
            questions: [
              { questionNumber: 1, questionText: "Customer Last Name", correctAnswer: "Smith", explanation: "The speaker mentions: 'My last name is Smith, S-M-I-T-H.'" },
              { questionNumber: 2, questionText: "Customer Age", correctAnswer: "25", explanation: "The customer states: 'I recently turned 25 years old.'" },
              { questionNumber: 3, questionText: "Customer Occupation", correctAnswer: "engineer", explanation: "The customer says: 'I work as a software engineer.'" },
              { questionNumber: 4, questionText: "Contact City", correctAnswer: "London", explanation: "The customer states: 'I am moving to London next month.'" },
              { questionNumber: 5, questionText: "Phone Number", correctAnswer: "123456", explanation: "The phone number dictated is 'one two three four five six'." },
              { questionNumber: 6, questionText: "Rental Type", correctAnswer: "flat", explanation: "The customer mentions: 'I would prefer renting a small flat.'" },
              { questionNumber: 7, questionText: "Budget Limit", correctAnswer: "800", explanation: "The customer's max budget is £800." },
              { questionNumber: 8, questionText: "Location Requirement", correctAnswer: "station", explanation: "The customer requests to live: 'near the local train station for commute.'" },
              { questionNumber: 9, questionText: "Move-in Day", correctAnswer: "15", explanation: "The customer states: 'I want to move in on October fifteenth.'" },
              { questionNumber: 10, questionText: "Registration Code", correctAnswer: "REF101", explanation: "The agent reads the code: 'R-E-F-one-zero-one.'" },
            ],
          },
        ],
      },
      {
        title: "Part 2",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        instruction: "Questions 11 - 15\nChoose the correct letter, A, B or C.\n\nQuestions 16 - 20\nLabel the plan below.\nWrite the correct letter, A-E, next to questions 16-20.",
        order: 2,
        questionGroups: [
          {
            type: "MULTIPLE_CHOICE",
            instruction: "New Community Sports Centre Tour",
            order: 1,
            questions: [
              {
                questionNumber: 11,
                questionText: "What is the main purpose of the new sports centre?",
                options: ["A. To host international championships", "B. To serve the local community", "C. To make a high profit"],
                correctAnswer: "B",
                explanation: "The guide states: 'Our principal objective is to provide affordable sport access to residents.'"
              },
              {
                questionNumber: 12,
                questionText: "The outdoor swimming pool will be open...",
                options: ["A. All year round", "B. Only during summer months", "C. On weekends only"],
                correctAnswer: "A",
                explanation: "The speaker notes: 'The heated pool will operate 365 days a year, despite winter snows.'"
              },
              {
                questionNumber: 13,
                questionText: "Full membership includes free access to...",
                options: ["A. All fitness classes", "B. The sauna and steam room", "C. Private physical therapy sessions"],
                correctAnswer: "B",
                explanation: "The guide explains: 'Sauna and steam rooms are complimentary for full-tier members, though classes carry a small fee.'"
              },
              {
                questionNumber: 14,
                questionText: "The primary financial funding of the project was provided by...",
                options: ["A. The local district council", "B. A private gym corporation", "C. A national charity foundation"],
                correctAnswer: "A",
                explanation: "The speaker clarifies: 'The funding was fully secured via the local district council's public development budget.'"
              },
              {
                questionNumber: 15,
                questionText: "Construction of the facility is scheduled to finish by...",
                options: ["A. Next January", "B. Next June", "C. Next September"],
                correctAnswer: "B",
                explanation: "The guide mentions: 'Contractors are on track to wrap up and hand over keys by mid-June next year.'"
              }
            ]
          },
          {
            type: "MATCHING_HEADINGS", // Using matching interface mode
            instruction: "Label the rooms on the sports centre plan",
            passageSegment: '{"mode": "WITH_CLUES"}',
            options: [
              "A. Main Entrance Area",
              "B. Visitor Cafe",
              "C. Reception Desk",
              "D. Changing Rooms",
              "E. Main Sports Hall"
            ],
            order: 2,
            questions: [
              { questionNumber: 16, questionText: "Reception desk location on map", correctAnswer: "C", explanation: "The reception desk is right next to the entrance gates." },
              { questionNumber: 17, questionText: "Cafe area location on map", correctAnswer: "B", explanation: "The cafe is situated at the back overlooking the pool." },
              { questionNumber: 18, questionText: "Changing rooms location on map", correctAnswer: "D", explanation: "Changing rooms are located adjacent to the showers." },
              { questionNumber: 19, questionText: "Main sports hall location on map", correctAnswer: "E", explanation: "The main hall takes up the entire east wing." },
              { questionNumber: 20, questionText: "Secondary exit location on map", correctAnswer: "A", explanation: "The secondary entrance is on the western pathway." }
            ]
          }
        ]
      },
      {
        title: "Part 3",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        instruction: "Questions 21 - 25\nMatch the courses to the student reviews.\nChoose the correct letter, A, B or C.\n\nQuestions 26 - 30\nChoose the correct letter, A, B or C.",
        order: 3,
        questionGroups: [
          {
            type: "MATCHING_FEATURES",
            instruction: "Student Feedback on Media Course Modules",
            options: [
              "A. It was too theoretical",
              "B. It was highly practical",
              "C. It was very difficult"
            ],
            order: 1,
            questions: [
              { questionNumber: 21, questionText: "Media Studies theory block", correctAnswer: "A", explanation: "Mark complains: 'There were too many essays and pure concepts, not enough hands-on projects.'" },
              { questionNumber: 22, questionText: "Journalism Ethics study", correctAnswer: "C", explanation: "Lisa agrees: 'Analyzing case laws was highly complex and tough to pass.'" },
              { questionNumber: 23, questionText: "Digital Audio Production workshop", correctAnswer: "B", explanation: "Lisa states: 'We spent all time inside the recording studio mixing audio. It was great practice.'" },
              { questionNumber: 24, questionText: "Public Relations campaign workshop", correctAnswer: "B", explanation: "Mark states: 'Designing real campaigns for client businesses gave great practical experience.'" },
              { questionNumber: 25, questionText: "Research Methodology module", correctAnswer: "A", explanation: "Both agree: 'It focused entirely on textbook models rather than survey work.'" }
            ]
          },
          {
            type: "MULTIPLE_CHOICE",
            instruction: "Coursework Discussion with Professor",
            order: 2,
            questions: [
              {
                questionNumber: 26,
                questionText: "Why did Lisa choose to major in Journalism?",
                options: ["A. Her father is a media news editor", "B. She enjoys writing narrative stories", "C. She wants to travel as a correspondent"],
                correctAnswer: "B",
                explanation: "Lisa notes: 'My main drive has always been a love for storytelling and writing pieces.'"
              },
              {
                questionNumber: 27,
                questionText: "What is Mark's chief concern regarding his upcoming media internship?",
                options: ["A. The long daily working hours", "B. The costly daily travel expenses", "C. The lack of financial compensation"],
                correctAnswer: "A",
                explanation: "Mark worries: 'Commuting early and working until 7 PM sounds exhausting.'"
              },
              {
                questionNumber: 28,
                questionText: "The joint research group project topic will cover...",
                correctAnswer: "A",
                options: ["A. Climate change reporting", "B. Local business advertising", "C. Social media impact"],
                explanation: "The Professor suggests: 'You both agreed to examine climate reporting coverage in newspapers.'"
              },
              {
                questionNumber: 29,
                questionText: "The deadline for the draft submission is...",
                options: ["A. This Friday afternoon", "B. Next Monday morning", "C. Next Tuesday by noon"],
                correctAnswer: "C",
                explanation: "Lisa confirms: 'We have until Tuesday twelve PM to turn in the draft.'"
              },
              {
                questionNumber: 30,
                questionText: "Who will serve on the evaluation board for the final presentations?",
                options: ["A. The course professors only", "B. An external industry panel", "C. The student classmates"],
                correctAnswer: "B",
                explanation: "The Professor says: 'We are bringing in editors from national newspapers to review your presentations.'"
              }
            ]
          }
        ]
      },
      {
        title: "Part 4",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        instruction: "Questions 31 - 40\nComplete the summary below.\nWrite NO MORE THAN TWO WORDS for each answer.",
        order: 4,
        questionGroups: [
          {
            type: "SUMMARY_COMPLETION",
            instruction: "Research Lecture: Urban Ecology and Bird Adaptation",
            passageSegment: "The speaker details how environmental changes impact urban bird populations.\nCompared to rural fields, cities offer abundant sources of [31] due to domestic waste.\nHowever, city birds face significant physiological [32] leading to health issues.\nIn particular, elevated noise levels impair the birds' ability to [33] effectively.\nTo overcome this, certain species have adapted by shifting their song [34].\nStudies in urban green spaces indicate that birds are generally more [35].\nSurprisingly, they allocate less energy towards scanning for potential [36].\nNesting success is lower, primarily due to predation by domestic [37].\nEcologists recommend that citizens plant more [38] trees in gardens.\nImplementing these steps will support local urban [39] and improve survival rates.\nThis is crucial for maintaining a healthy city [40].",
            order: 1,
            questions: [
              { questionNumber: 31, questionText: "Abundant source of...", correctAnswer: "food", explanation: "The lecturer mentions: 'A constant supply of discarded food and refuse makes cities highly attractive.'" },
              { questionNumber: 32, questionText: "Birds face significant...", correctAnswer: "stress", explanation: "The lecturer notes: 'However, constant exposure to lights and noise induces severe chronic stress.'" },
              { questionNumber: 33, questionText: "Noise levels impair ability to...", correctAnswer: "communicate", explanation: "The speaker says: 'High-frequency traffic noises drown out mating calls, making it hard to communicate.'" },
              { questionNumber: 34, questionText: "Shifting their song...", correctAnswer: "pitch", explanation: "The speaker explains: 'Birds have raised their vocal pitch to rise above low-frequency engine rumbles.'" },
              { questionNumber: 35, questionText: "Urban birds are generally more...", correctAnswer: "active", explanation: "The study shows: 'City park birds exhibit far higher levels of daily activity.'" },
              { questionNumber: 36, questionText: "Less energy scanning for...", correctAnswer: "predators", explanation: "The lecturer notes: 'Because there are fewer wild hawks, birds spend less time alert for predators.'" },
              { questionNumber: 37, questionText: "Predation by domestic...", correctAnswer: "cats", explanation: "The speaker states: 'Cats account for over eighty percent of nesting failures in residential zones.'" },
              { questionNumber: 38, questionText: "Plant more...", correctAnswer: "native", explanation: "The lecturer urges: 'Planting native shrubs and oak species provides authentic nesting cover.'" },
              { questionNumber: 39, questionText: "Support local urban...", correctAnswer: "biodiversity", explanation: "The speaker concludes: 'These actions play a vital role in boosting local urban biodiversity.'" },
              { questionNumber: 40, questionText: "Maintaining healthy city...", correctAnswer: "ecosystem", explanation: "The final slide reads: 'This is fundamental to sustaining the overall urban ecosystem.'" },
            ]
          }
        ]
      }
    ]
  };

  console.log("Calling ListeningService.createExam to seed a mock Listening test...");
  try {
    const exam = await ListeningService.createExam(listeningExamPayload as any);
    console.log("Successfully seeded Listening Exam! ID:", exam.id);
  } catch (error) {
    console.error("Failed to seed Listening Exam:", error);
  }
}

main()
  .catch((e) => console.error("Error in seed script:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
