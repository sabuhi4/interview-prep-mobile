import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { FilterBar } from "../components/FilterBar";
import { GradientButton } from "../components/GradientButton";
import { useAppContext } from "../context/AppContext";
import { difficultyColor, theme } from "../theme";
import { QuizQuestion } from "../types";

type Phase = "setup" | "playing" | "results";

export function QuizScreen() {
  const { quizQuestions, addQuizResult, history } = useAppContext();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<number | null>>([]);

  const filteredPool = useMemo(() => {
    return quizQuestions.filter((question) => {
      if (selectedCategory && question.category !== selectedCategory) {
        return false;
      }
      if (selectedDifficulty && question.difficulty !== selectedDifficulty) {
        return false;
      }
      return true;
    });
  }, [quizQuestions, selectedCategory, selectedDifficulty]);

  const currentQuestion = currentQuestions[currentIndex];
  const hasAnswered = selectedAnswer !== null;
  const score = currentQuestions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctAnswer ? 1 : 0);
  }, 0);

  const startQuiz = () => {
    const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
    setCurrentQuestions(shuffled);
    setAnswers(Array.from({ length: shuffled.length }, () => null));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    if (shuffled.length > 0) {
      setPhase("playing");
    }
  };

  const selectAnswer = (answerIndex: number) => {
    if (hasAnswered) {
      return;
    }

    setSelectedAnswer(answerIndex);
    setAnswers((current) => {
      const next = [...current];
      next[currentIndex] = answerIndex;
      return next;
    });
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < currentQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      return;
    }

    addQuizResult({
      date: new Date().toISOString(),
      category: selectedCategory ?? "All",
      difficulty: selectedDifficulty ?? "All",
      score,
      total: currentQuestions.length
    });
    setPhase("results");
  };

  const reset = () => {
    setPhase("setup");
    setCurrentQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quiz</Text>

        {phase === "setup" ? (
          <>
            <Card style={styles.hero}>
              <Text style={styles.heroTitle}>Quiz Mode</Text>
              <Text style={styles.heroText}>Test your knowledge with multiple choice questions and a cleaner review flow.</Text>
            </Card>

            <FilterBar
              selectedCategory={selectedCategory}
              selectedDifficulty={selectedDifficulty}
              onCategoryChange={setSelectedCategory}
              onDifficultyChange={setSelectedDifficulty}
            />

            <Card style={styles.heroStats}>
              <Text style={styles.sectionTitle}>{filteredPool.length} questions available</Text>
              <Text style={styles.meta}>
                {history.length === 0 ? "No past quiz history yet." : `${history.length} quiz sessions stored locally.`}
              </Text>
            </Card>

            <GradientButton label="Start Quiz" onPress={startQuiz} secondary disabled={filteredPool.length === 0} />
          </>
        ) : null}

        {phase === "playing" && currentQuestion ? (
          <>
            <Card>
              <Text style={styles.meta}>
                Question {currentIndex + 1} of {currentQuestions.length}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }
                  ]}
                />
              </View>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${difficultyColor(currentQuestion.difficulty)}22` }
                  ]}
                >
                  <Text style={[styles.badgeText, { color: difficultyColor(currentQuestion.difficulty) }]}>
                    {currentQuestion.difficulty}
                  </Text>
                </View>
                <Text style={styles.category}>{currentQuestion.category}</Text>
              </View>
              <Text style={styles.question}>{currentQuestion.question}</Text>
            </Card>

            <View style={styles.optionStack}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = currentQuestion.correctAnswer === index;
                const showCorrect = hasAnswered && isCorrect;
                const showWrong = hasAnswered && isSelected && !isCorrect;

                return (
                  <Pressable
                    key={`${currentQuestion.id}-${index}`}
                    onPress={() => selectAnswer(index)}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      showCorrect && styles.optionCorrect,
                      showWrong && styles.optionWrong
                    ]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            {hasAnswered ? (
              <Card style={selectedAnswer === currentQuestion.correctAnswer ? styles.feedbackGood : styles.feedbackBad}>
                <Text style={styles.sectionTitle}>
                  {selectedAnswer === currentQuestion.correctAnswer ? "Correct" : "Incorrect"}
                </Text>
                <Text style={styles.meta}>{currentQuestion.explanation}</Text>
                <View style={{ marginTop: 14 }}>
                  <GradientButton
                    label={currentIndex + 1 < currentQuestions.length ? "Next Question" : "See Results"}
                    onPress={nextQuestion}
                    secondary
                  />
                </View>
              </Card>
            ) : null}
          </>
        ) : null}

        {phase === "results" ? (
          <>
            <Card style={styles.resultsHero}>
              <Text style={styles.resultsScore}>{Math.round((score / Math.max(currentQuestions.length, 1)) * 100)}%</Text>
              <Text style={styles.sectionTitle}>
                {score} / {currentQuestions.length} correct
              </Text>
            </Card>

            {currentQuestions.map((question, index) => {
              const correct = answers[index] === question.correctAnswer;
              return (
                <Card key={question.id}>
                  <Text style={[styles.resultState, { color: correct ? theme.colors.success : theme.colors.danger }]}>
                    {correct ? "Correct" : "Incorrect"}
                  </Text>
                  <Text style={styles.resultQuestion}>{question.question}</Text>
                </Card>
              );
            })}

            <GradientButton label="Try Again" onPress={reset} secondary />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    paddingBottom: 24
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text
  },
  hero: {
    backgroundColor: theme.colors.surfaceMuted
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text
  },
  heroText: {
    marginTop: 8,
    color: theme.colors.muted,
    lineHeight: 21
  },
  heroStats: {
    backgroundColor: theme.colors.surfaceMuted
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text
  },
  meta: {
    marginTop: 6,
    color: theme.colors.muted
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: "#e4e9fb",
    marginTop: 12,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.indigo
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 12
  },
  badge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  category: {
    color: theme.colors.muted
  },
  question: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    color: theme.colors.text
  },
  optionStack: {
    gap: 8
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 14
  },
  optionSelected: {
    borderColor: theme.colors.indigo,
    backgroundColor: "#e0e7ff"
  },
  optionCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: "#f0fdf4"
  },
  optionWrong: {
    borderColor: theme.colors.danger,
    backgroundColor: "#fef2f2"
  },
  optionText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text
  },
  feedbackGood: {
    backgroundColor: "#f0fdf4"
  },
  feedbackBad: {
    backgroundColor: "#fef2f2"
  },
  resultsHero: {
    alignItems: "center"
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.indigo
  },
  resultState: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  resultQuestion: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text
  }
});
