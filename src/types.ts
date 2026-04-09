export const categories = [
  "React",
  "JavaScript",
  "Next.js",
  "TypeScript",
  "CSS",
  "HTML"
] as const;

export const difficulties = ["easy", "medium", "hard"] as const;

export type Category = typeof categories[number];
export type Difficulty = typeof difficulties[number];

export type Question = {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  answer: string;
  tags: string[];
};

export type QuizQuestion = {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  tags: string[];
};

export type QuizHistoryEntry = {
  id: string;
  date: string;
  category: string;
  difficulty: string;
  score: number;
  total: number;
};
