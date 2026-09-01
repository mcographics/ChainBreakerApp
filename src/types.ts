export type Screen = 'home' | 'word' | 'brotherhood' | 'build' | 'journey' | 'battle';

export type Identity =
  | 'Man of God'
  | 'Disciplined Man'
  | 'Strong Husband'
  | 'Present Father'
  | 'Leader'
  | 'Physically Strong'
  | 'Financially Responsible'
  | 'Free From Addiction';

export type BattleKind =
  | 'Pornography'
  | 'Lust'
  | 'Alcohol'
  | 'Anger'
  | 'Fear'
  | 'Procrastination'
  | 'Gambling'
  | 'Isolation'
  | 'Nicotine'
  | 'Unforgiveness';

export type Battle = {
  id: string;
  kind: BattleKind;
  startDate: string;
  active: boolean;
  primary: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BattleCheckIn = {
  id: string;
  battleId: string;
  date: string;
  status: 'strong' | 'struggling' | 'intervention-complete';
  createdAt: string;
};

export type UserProfile = {
  id: string;
  identities: Identity[];
  battleKinds: BattleKind[];
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyEntry = {
  id: string;
  day: number;
  reference: string;
  verse: string;
  devotion: string;
  prayer: string;
  challenge: string;
};

export type ReadingProgress = {
  reference: string;
  updatedAt: string;
};

export type BibleVerse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  isRedLetter: boolean;
};

export type Bookmark = { id: string; verseId: string; createdAt: string };
export type Highlight = { id: string; verseId: string; color: 'gold' | 'green' | 'blue'; createdAt: string };
export type VerseNote = { id: string; verseId: string; body: string; updatedAt: string };

export type WorkoutExercise = { id: string; name: string; prescription: string; cue: string };
export type Workout = {
  id: string;
  title: string;
  virtue: string;
  duration: string;
  dayIndex: number;
  exercises: WorkoutExercise[];
};
export type WorkoutSession = {
  id: string;
  workoutId: string;
  date: string;
  completedExerciseIds: string[];
  notes: string;
  completedAt?: string;
};

export type BrotherhoodCategory =
  | 'Marriage & Women'
  | 'Fatherhood'
  | 'Purpose & Career'
  | 'Money'
  | 'Sexual Discipline'
  | 'Mental Strength'
  | 'Faith'
  | 'Culture';

export type BrotherhoodArticle = {
  id: string;
  category: BrotherhoodCategory;
  title: string;
  summary: string;
  issue: string;
  biblicalPerspective: string;
  practicalSolution: string;
  challenge: string;
  references: string[];
};

export type AppState = {
  profile: UserProfile | null;
  battles: Battle[];
  checkIns: BattleCheckIn[];
  dailyCompletions: string[];
  readingProgress: ReadingProgress;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  notes: VerseNote[];
  workoutSessions: WorkoutSession[];
  readArticleIds: string[];
};

export type BrotherhoodFilter = { category?: BrotherhoodCategory; query?: string };
