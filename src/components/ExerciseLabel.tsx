import React from "react";
import { Text, TextStyle } from "react-native";

type ExerciseLabelProps = {
  name: string;
  style?: TextStyle | TextStyle[];
  maxChars?: number;
  numberOfLines?: number;
};

export function ExerciseLabel({ name, style, maxChars, numberOfLines = 1 }: ExerciseLabelProps) {
  const display = typeof maxChars === "number" && name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;

  return (
    <Text numberOfLines={numberOfLines} ellipsizeMode="tail" style={style}>
      {display}
    </Text>
  );
}

export default ExerciseLabel;
