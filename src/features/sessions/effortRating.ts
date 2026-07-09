export type EffortRatingValue = 1 | 2 | 3 | 4 | 5;

export type EffortRatingOption = {
  value: EffortRatingValue;
  label: string;
  emoji: string;
};

export const RATING_OPTIONS: EffortRatingOption[] = [
  { value: 1, label: "In my sleep", emoji: "😴" },
  { value: 2, label: "Could do more", emoji: "🙂" },
  { value: 3, label: "Right there", emoji: "😅" },
  { value: 4, label: "Almost couldn't do it", emoji: "😣" },
  { value: 5, label: "Impossible", emoji: "🥵" }
];

export type EffortRatingMeta = {
  label: string;
  emoji: string;
};

const NOT_RATED: EffortRatingMeta = { label: "Not rated", emoji: "—" };

export function getEffortRatingMeta(rating: number | null | undefined): EffortRatingMeta {
  const option = RATING_OPTIONS.find((candidate) => candidate.value === rating);

  return option ? { label: option.label, emoji: option.emoji } : NOT_RATED;
}
