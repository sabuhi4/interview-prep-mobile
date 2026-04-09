import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAppContext } from "../context/AppContext";
import { Card } from "../components/Card";
import { GradientButton } from "../components/GradientButton";
import { theme } from "../theme";

type Props = {
  onSelectTab: (tab: "home" | "questions" | "quiz" | "listen") => void;
};

export function HomeScreen({ onSelectTab }: Props) {
  const { questions, quizQuestions, bookmarks, history, loading, error, fetchAll } = useAppContext();
  const categoryCount = new Set(questions.map((item) => item.category)).size;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <LinearGradient colors={[theme.colors.blue, theme.colors.indigo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroIcon}>
            <Text style={styles.heroIconText}>FP</Text>
          </LinearGradient>
          <Text style={styles.title}>Frontend Interview Prep</Text>
          <Text style={styles.subtitle}>Master your frontend knowledge with questions, quiz drills, and audio review.</Text>
        </Card>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.colors.indigo} />
            <Text style={styles.metaText}>Loading interview content...</Text>
          </View>
        ) : error ? (
          <Card>
            <Text style={styles.errorTitle}>Could not load content</Text>
            <Text style={styles.metaText}>{error}</Text>
            <Pressable onPress={() => void fetchAll()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard value={`${questions.length}`} label="Questions" />
              <StatCard value={`${quizQuestions.length}`} label="Quiz Questions" />
              <StatCard value={`${categoryCount}`} label="Categories" />
              <StatCard value={`${bookmarks.size}`} label="Bookmarked" />
            </View>

            <Card style={styles.activityCard}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.metaText}>
                {history.length === 0
                  ? "No quizzes taken yet."
                  : `${history.length} quizzes taken. Average score ${averageScore(history)}%.`}
              </Text>
            </Card>

            <View style={styles.actions}>
              <GradientButton label="Explore Questions" onPress={() => onSelectTab("questions")} />
              <GradientButton label="Take a Quiz" onPress={() => onSelectTab("quiz")} secondary />
              <GradientButton label="Start Listen Mode" onPress={() => onSelectTab("listen")} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function averageScore(history: Array<{ score: number; total: number }>) {
  const total = history.reduce((sum, item) => {
    if (item.total === 0) {
      return sum;
    }
    return sum + item.score / item.total;
  }, 0);

  return Math.round((total / history.length) * 100);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    paddingBottom: 12
  },
  heroCard: {
    alignItems: "center",
    paddingVertical: 12
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  heroIconText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900"
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
    textAlign: "center"
  },
  centerBlock: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8
  },
  metaText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.indigo,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  statCard: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 10
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.muted
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8
  },
  activityCard: {
    backgroundColor: theme.colors.surfaceMuted
  },
  actions: {
    gap: 10
  }
});
