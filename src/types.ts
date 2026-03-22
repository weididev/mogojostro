export type Flashcard = {
  id: string;
  term: string;
  definition: string;
  type?: 'flashcard' | 'mcq';
  options?: string[];
  correctOptionIndex?: number;
  moduleId?: string;
};

export type QuizResult = {
  id: string;
  date: string; // ISO string
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
};

export type Module = {
  id: string;
  title: string;
  cards: Flashcard[];
  results: QuizResult[];
};

export type AppState = {
  modules: Module[];
};
