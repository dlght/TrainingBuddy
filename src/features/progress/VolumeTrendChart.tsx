import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { theme } from "@/components/theme";
import type { ExerciseVolumePoint } from "@/models/session";

type VolumeTrendChartProps = {
  points: ExerciseVolumePoint[];
};

export function VolumeTrendChart({ points }: VolumeTrendChartProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Volume trend</Text>
      {points.length === 0 ? (
        <Text style={styles.emptyText}>Completed session volume will appear here.</Text>
      ) : (
        <LineChart values={points.map((point) => point.volume)} />
      )}
    </View>
  );
}

function LineChart({ values }: { values: number[] }) {
  const width = 280;
  const height = 132;
  const padding = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const coordinates = values.map((value, index) => {
    const x = padding + (values.length === 1 ? chartWidth / 2 : (index / (values.length - 1)) * chartWidth);
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;

    return { x, y };
  });

  return (
    <View style={styles.chartBox}>
      <Svg height={height} width={width}>
        <Line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#d8dee9" strokeWidth={1} />
        <Line
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
          stroke="#d8dee9"
          strokeWidth={1}
        />
        <Polyline
          fill="none"
          points={coordinates.map((coordinate) => `${coordinate.x},${coordinate.y}`).join(" ")}
          stroke={theme.colors.primary}
          strokeWidth={3}
        />
        {coordinates.map((coordinate, index) => (
          <Circle cx={coordinate.x} cy={coordinate.y} fill={theme.colors.primary} key={index} r={4} />
        ))}
        <SvgText fill={theme.colors.muted} fontSize={11} x={padding} y={padding - 6}>
          {max}
        </SvgText>
        <SvgText fill={theme.colors.muted} fontSize={11} x={padding} y={height - 4}>
          {min}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  chartBox: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
