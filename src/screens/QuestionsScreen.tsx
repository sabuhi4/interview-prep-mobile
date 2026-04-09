import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { FilterBar } from "../components/FilterBar";
import { useAppContext } from "../context/AppContext";
import { difficultyColor, theme } from "../theme";

export function QuestionsScreen() {
  const { questions, loading, bookmarks, toggleBookmark } = useAppContext();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (selectedCategory && question.category !== selectedCategory) {
        return false;
      }
      if (selectedDifficulty && question.difficulty !== selectedDifficulty) {
        return false;
      }
      if (showBookmarkedOnly && !bookmarks.has(question.id)) {
        return false;
      }
      if (!searchText.trim()) {
        return true;
      }
      const query = searchText.toLowerCase();
      return (
        question.question.toLowerCase().includes(query) ||
        question.answer.toLowerCase().includes(query) ||
        question.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [bookmarks, questions, searchText, selectedCategory, selectedDifficulty, showBookmarkedOnly]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Questions</Text>
        <TextInput
          placeholder="Search questions, answers, or tags"
          placeholderTextColor={theme.colors.subtle}
          value={searchText}
          onChangeText={setSearchText}
          style={styles.search}
        />

        <FilterBar
          selectedCategory={selectedCategory}
          selectedDifficulty={selectedDifficulty}
          onCategoryChange={setSelectedCategory}
          onDifficultyChange={setSelectedDifficulty}
        />

        <Pressable
          onPress={() => setShowBookmarkedOnly((current) => !current)}
          style={[styles.bookmarkToggle, showBookmarkedOnly && styles.bookmarkToggleActive]}
        >
          <Text style={[styles.bookmarkToggleText, showBookmarkedOnly && styles.bookmarkToggleTextActive]}>
            Bookmarked Only
          </Text>
        </Pressable>

        <Text style={styles.meta}>{loading ? "Loading..." : `${filteredQuestions.length} questions`}</Text>

        {filteredQuestions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Questions Found</Text>
            <Text style={styles.emptyText}>Adjust filters or search text to broaden the result set.</Text>
          </Card>
        ) : (
          filteredQuestions.map((question) => {
            const expanded = expandedId === question.id;
            const isBookmarked = bookmarks.has(question.id);
            return (
              <Card key={question.id} style={styles.questionCard}>
                <Pressable onPress={() => setExpandedId(expanded ? null : question.id)}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionMeta}>
                      <Text style={styles.questionText}>{question.question}</Text>
                      <View style={styles.badges}>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: `${difficultyColor(question.difficulty)}22` }
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: difficultyColor(question.difficulty) }]}>
                            {question.difficulty}
                          </Text>
                        </View>
                        <Text style={styles.category}>{question.category}</Text>
                      </View>
                    </View>

                    <Pressable onPress={() => toggleBookmark(question.id)} style={styles.bookmarkButton}>
                      <Text style={[styles.bookmarkIcon, isBookmarked && styles.bookmarkIconActive]}>{isBookmarked ? "★" : "☆"}</Text>
                    </Pressable>
                  </View>
                </Pressable>

                {expanded ? (
                  <View style={styles.answerBlock}>
                    <Text style={styles.answerText}>{question.answer}</Text>
                    <View style={styles.tagRow}>
                      {question.tags.map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
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
    paddingTop: 14,
    gap: 12,
    paddingBottom: 22
  },
  title: {
    paddingHorizontal: 16,
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text
  },
  search: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.text
  },
  bookmarkToggle: {
    marginHorizontal: 16,
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.indigo,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ffffff"
  },
  bookmarkToggleActive: {
    backgroundColor: theme.colors.indigo,
    borderColor: theme.colors.indigo
  },
  bookmarkToggleText: {
    color: theme.colors.indigo,
    fontWeight: "700"
  },
  bookmarkToggleTextActive: {
    color: "#ffffff",
    fontWeight: "800"
  },
  meta: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: theme.colors.muted
  },
  emptyCard: {
    marginHorizontal: 16
  },
  questionCard: {
    marginHorizontal: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.muted
  },
  questionHeader: {
    flexDirection: "row",
    gap: 12
  },
  questionMeta: {
    flex: 1,
    gap: 8
  },
  questionText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    color: theme.colors.text
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
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
    fontSize: 13,
    color: theme.colors.muted
  },
  bookmarkButton: {
    alignSelf: "flex-start"
  },
  bookmarkIcon: {
    fontSize: 22,
    color: theme.colors.tertiary
  },
  bookmarkIconActive: {
    color: theme.colors.indigo
  },
  answerBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 10
  },
  tag: {
    borderRadius: theme.radius.pill,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagText: {
    color: theme.colors.indigo,
    fontSize: 12,
    fontWeight: "600"
  }
});
