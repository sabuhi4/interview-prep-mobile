import { Question, QuizQuestion } from "../types";

const BASE_URL = "https://iokfnmowtahrfsrozfex.supabase.co/rest/v1";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlva2ZubW93dGFocmZzcm96ZmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzI1NDAsImV4cCI6MjA3Njc0ODU0MH0.aYUuvCXDh4cXJR8Z42m1SAzujJkhjeuFsl32q6BC9Vo";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchQuestions() {
  return request<Question[]>("/questions?select=*&order=created_at.desc");
}

export async function fetchQuizQuestions() {
  return request<QuizQuestion[]>("/quiz_questions?select=*");
}
