import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Card as PaperCard } from "react-native-paper";
import { theme } from "../theme";

export function Card({
  style,
  children
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <PaperCard mode="elevated" style={[styles.card, style]}>
      <PaperCard.Content style={styles.content}>{children}</PaperCard.Content>
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow
  },
  content: {
    padding: 2
  }
});
