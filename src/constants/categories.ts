export const CATEGORIES: Category[] = [
  "MINDFULNESS",
  "WISDOM",
  "COURAGE",
  "LOVE",
  "NATURE",
  "GROWTH",
  "HEALING",
  "GRATITUDE",
];

export type Category =
  | "MINDFULNESS"
  | "WISDOM"
  | "COURAGE"
  | "LOVE"
  | "NATURE"
  | "GROWTH"
  | "HEALING"
  | "GRATITUDE";

export const SUBCATEGORIES = {
  MINDFULNESS: ["PRESENCE", "AWARENESS", "MEDITATION", "STILLNESS", "INNER_PEACE"],
  WISDOM: ["PHILOSOPHY", "TRUTH", "PERSPECTIVE", "JUDGMENT", "SELF_KNOWLEDGE"],
  COURAGE: ["BRAVERY", "RESILIENCE", "RISK", "ADVERSITY", "LEADERSHIP"],
  LOVE: ["ROMANTIC_LOVE", "FAMILY", "FRIENDSHIP", "COMPASSION", "SELF_LOVE"],
  NATURE: ["WILDERNESS", "SEASONS", "ANIMALS", "OCEAN", "COSMOS"],
  GROWTH: ["LEARNING", "DISCIPLINE", "CHANGE", "AMBITION", "CREATIVITY"],
  HEALING: ["GRIEF", "FORGIVENESS", "RECOVERY", "HOPE", "REST"],
  GRATITUDE: ["APPRECIATION", "CONTENTMENT", "JOY", "HUMILITY", "ABUNDANCE"],
} as const satisfies Record<Category, readonly string[]>;

export type Subcategory = (typeof SUBCATEGORIES)[Category][number];

export type MoodPreference =
  | "overwhelmed"
  | "clarity"
  | "challenge"
  | "disconnected"
  | "stuck"
  | "quiet"
  | "grow"
  | "grateful"
  | "surprise";

export const MOOD_OPTIONS: readonly {
  value: MoodPreference;
  label: string;
  summary: string;
  categories: readonly Category[];
}[] = [
  { value: "overwhelmed", label: "I feel overwhelmed", summary: "Calm & Recovery", categories: ["MINDFULNESS", "HEALING"] },
  { value: "clarity", label: "I need clarity", summary: "Clarity & Awareness", categories: ["WISDOM", "MINDFULNESS"] },
  { value: "challenge", label: "I am facing a challenge", summary: "Courage & Resilience", categories: ["COURAGE", "GROWTH"] },
  { value: "disconnected", label: "I feel disconnected", summary: "Connection & Hope", categories: ["LOVE", "HEALING"] },
  { value: "stuck", label: "I feel stuck", summary: "Change & Momentum", categories: ["GROWTH", "COURAGE"] },
  { value: "quiet", label: "I need quiet", summary: "Stillness & Nature", categories: ["MINDFULNESS", "NATURE"] },
  { value: "grow", label: "I am ready to grow", summary: "Learning & Leadership", categories: ["GROWTH", "COURAGE"] },
  { value: "grateful", label: "I feel grateful", summary: "Gratitude & Compassion", categories: ["GRATITUDE", "LOVE"] },
  { value: "surprise", label: "Surprise me", summary: "Balanced discovery", categories: CATEGORIES },
];

export function categoriesForMood(mood: MoodPreference): Category[] {
  return [...(MOOD_OPTIONS.find((option) => option.value === mood)?.categories ?? CATEGORIES)];
}

export function moodSummary(mood: MoodPreference): string {
  return MOOD_OPTIONS.find((option) => option.value === mood)?.summary ?? "Balanced discovery";
}

export const CATEGORY_COLORS: Record<Category, string> = {
  MINDFULNESS: "#8FAE8B",
  WISDOM: "#C9A96E",
  COURAGE: "#A0B4C8",
  LOVE: "#D4A0A0",
  NATURE: "#7BA88E",
  GROWTH: "#B8A8C8",
  HEALING: "#A8C5B8",
  GRATITUDE: "#C8B89A",
};
