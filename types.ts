export enum Language {
  EN = 'English',
  PL = 'Polski',
  UA = 'Українська',
  RU = 'Русский',
  JA = '日本語'
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  EVENT_RESOLVING = 'EVENT_RESOLVING',
  MINIGAME_RPS = 'MINIGAME_RPS',
  MINIGAME_QUIZ = 'MINIGAME_QUIZ',
  GAME_OVER = 'GAME_OVER'
}

export type CellType = 'hidden' | 'start' | 'corridor' | 'door' | 'monster' | 'center';
export type DiceFace = 'corridor' | 'door' | 'monster';

export interface AssetConfig {
  players: string[];
  cells: {
    corridor: string;
    door: string;
    monster: string;
    center: string;
    hidden: string;
    start: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: Record<Language, string>;
  options: Record<Language, string[]>;
  correctIndex: number;
  questionImageId?: string;
  optionImageIds?: Array<string | null>;
  explanationImageId?: string;
}

export type QuestionDifficulty = 1 | 2 | 3;
export type QuestionSubject = 'language' | 'geography' | 'nature' | 'mathematics' | 'history';

export interface EditableQuestion {
  id: string;
  language: Language;
  question: string;
  options: string[];
  correctIndex: number;
  enabled: boolean;
  subject?: QuestionSubject;
  topic?: string;
  grade?: number;
  difficulty?: QuestionDifficulty;
  explanation?: string;
  questionImageId?: string;
  optionImageIds?: Array<string | null>;
  explanationImageId?: string;
}

export interface LocalImageAssetMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalImageAsset extends LocalImageAssetMetadata {
  blob: Blob;
}

export interface Player {
  id: number;
  name: string;
  grade: number;
  color: string;
  positionIndex: number;
  hasFinished: boolean;
  isSkippingTurn: boolean;
  isEliminated: boolean;
  retryDoor?: boolean;
  pendingQuestion?: QuizQuestion;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  language: Language;
  eventText: string | null;
  eventImage: string | null;
  isThinking: boolean;
  diceResult: DiceFace | null;
  logs: string[];
  boardState: Record<string, CellType>;
  activeQuestion: QuizQuestion | null;
  rpsSelection: 'rock' | 'paper' | 'scissors' | null;
  rpsOpponent: 'rock' | 'paper' | 'scissors' | null;
  rpsResult: 'win' | 'lose' | 'draw' | null;
  rpsContext: 'monster' | 'boss' | null;
  assets: AssetConfig;
}

export interface CellCoordinates {
  x: number;
  y: number;
  type: CellType;
  ownerId?: number;
  stepIndex: number;
  isLocked?: boolean;
}
