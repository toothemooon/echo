export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
}

export const QUOTES: Quote[] = [
  {
    id: 1,
    text: "The present moment is the only moment available to us, and it is the door to all moments.",
    author: "Thich Nhat Hanh",
    category: "MINDFULNESS",
  },
  {
    id: 2,
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    category: "WISDOM",
  },
  {
    id: 3,
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "COURAGE",
  },
  {
    id: 4,
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
    category: "LOVE",
  },
  {
    id: 5,
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu",
    category: "NATURE",
  },
];
