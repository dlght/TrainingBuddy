import React from "react";
import { Text, TextStyle } from "react-native";

type ExerciseLabelProps = {
  name: string;
  style?: TextStyle | TextStyle[];
  maxChars?: number;
};

export function ExerciseLabel({ name, style, maxChars }: ExerciseLabelProps) {
  const display = typeof maxChars === "number" && name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;

  return (
    <Text numberOfLines={1} ellipsizeMode="tail" style={style}>
      {display}
    </Text>
  );
}

export default ExerciseLabel;
