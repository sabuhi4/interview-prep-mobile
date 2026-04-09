import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchQuestions, fetchQuizQuestions } from "../lib/api";
import { getStoredJSON, setStoredJSON } from "../lib/storage";
import { categories, Question, QuizHistoryEntry, QuizQuestion } from "../types";

const allowedCategories = new Set<string>(categories);

const BOOKMARKS_KEY = "rn.bookmarkedQuestionIDs";
const HISTORY_KEY = "rn.quizHistory";

type AppContextValue = {
  questions: Question[];
  quizQuestions: QuizQuestion[];
  loading: boolean;
  error: string | null;
  bookmarks: Set<string>;
  history: QuizHistoryEntry[];
  fetchAll: () => Promise<void>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  addQuizResult: (entry: Omit<QuizHistoryEntry, "id">) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    void (async () => {
      const storedBookmarks = await getStoredJSON<string[]>(BOOKMARKS_KEY, []);
      const storedHistory = await getStoredJSON<QuizHistoryEntry[]>(HISTORY_KEY, []);
      setBookmarks(new Set(storedBookmarks));
      setHistory(storedHistory);
    })();
  }, []);

  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [fetchedQuestions, fetchedQuiz] = await Promise.all([
        fetchQuestions(),
        fetchQuizQuestions()
      ]);

      setQuestions(fetchedQuestions.filter((q) => allowedCategories.has(q.category)));
      setQuizQuestions(fetchedQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      void setStoredJSON(BOOKMARKS_KEY, Array.from(next));
      return next;
    });
  };

  const addQuizResult = (entry: Omit<QuizHistoryEntry, "id">) => {
    setHistory((current) => {
      const next = [{ ...entry, id: `${Date.now()}` }, ...current];
      void setStoredJSON(HISTORY_KEY, next);
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        questions,
        quizQuestions,
        loading,
        error,
        bookmarks,
        history,
        fetchAll,
        toggleBookmark,
        isBookmarked: (id: string) => bookmarks.has(id),
        addQuizResult
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
