import React from "react";
import { Button } from "react-native-paper";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
};

export function GradientButton({ label, onPress, disabled, secondary }: Props) {
  return (
    <Button
      mode={secondary ? "contained-tonal" : "contained"}
      onPress={onPress}
      disabled={disabled}
      contentStyle={{ paddingVertical: 6 }}
    >
      {label}
    </Button>
  );
}
