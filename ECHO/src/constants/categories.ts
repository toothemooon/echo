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
