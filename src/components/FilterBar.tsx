import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import { categories, difficulties } from "../types";
import { difficultyColor, theme } from "../theme";

type Props = {
  selectedCategory: string | null;
  selectedDifficulty: string | null;
  onCategoryChange: (value: string | null) => void;
  onDifficultyChange: (value: string | null) => void;
};

export function FilterBar({
  selectedCategory,
  selectedDifficulty,
  onCategoryChange,
  onDifficultyChange
}: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          selected={selectedCategory === null}
          onPress={() => onCategoryChange(null)}
          showSelectedCheck={false}
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          textStyle={[styles.chipText, selectedCategory === null && styles.chipTextActive]}
        >
          All
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => onCategoryChange(selectedCategory === category ? null : category)}
            showSelectedCheck={false}
            style={[styles.chip, selectedCategory === category && styles.chipActive]}
            textStyle={[styles.chipText, selectedCategory === category && styles.chipTextActive]}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          selected={selectedDifficulty === null}
          onPress={() => onDifficultyChange(null)}
          showSelectedCheck={false}
          style={[styles.chip, selectedDifficulty === null && styles.chipActive]}
          textStyle={[styles.chipText, selectedDifficulty === null && styles.chipTextActive]}
        >
          All
        </Chip>
        {difficulties.map((difficulty) => (
          <Chip
            key={difficulty}
            selected={selectedDifficulty === difficulty}
            onPress={() => onDifficultyChange(selectedDifficulty === difficulty ? null : difficulty)}
            showSelectedCheck={false}
            style={[
              styles.chip,
              selectedDifficulty === difficulty && { backgroundColor: difficultyColor(difficulty) }
            ]}
            textStyle={[styles.chipText, selectedDifficulty === difficulty && styles.chipTextActive]}
          >
            {difficulty[0].toUpperCase() + difficulty.slice(1)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10
  },
  row: {
    gap: 8,
    paddingHorizontal: 16
  },
  chip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  chipActive: {
    backgroundColor: theme.colors.indigo,
    borderColor: theme.colors.indigo
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "600"
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "700"
  }
});
