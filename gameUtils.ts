import { DICE_FACES, MAX_PLAYERS } from './constants';
import { DICTIONARY, QUESTIONS_DB } from './dictionary';
import { AssetConfig, CellType, DiceFace, GamePhase, GameState, Language, Player, QuizQuestion } from './types';

const RPS_CHOICES = ['rock', 'paper', 'scissors'] as const;

type RpsChoice = typeof RPS_CHOICES[number];
type RpsResult = 'win' | 'lose' | 'draw';

export const createEmptyAssets = (): AssetConfig => ({
  players: Array(MAX_PLAYERS).fill(''),
  cells: {
    corridor: '',
    door: '',
    monster: '',
    center: '',
    hidden: '',
    start: ''
  }
});

export const createBaseGameState = (language: Language = Language.EN): GameState => ({
  phase: GamePhase.SETUP,
  players: [],
  currentPlayerIndex: 0,
  language,
  eventText: null,
  eventImage: null,
  isThinking: false,
  diceResult: null,
  logs: [],
  boardState: {},
  activeQuestion: null,
  rpsSelection: null,
  rpsOpponent: null,
  rpsResult: null,
  rpsContext: null,
  assets: createEmptyAssets()
});

export const getPlayerName = (index: number, language: Language) =>
  `${DICTIONARY[language].ui.player_name} ${index + 1}`;

export const createPlayers = (playerCount: number, language: Language, colors: string[]): Player[] =>
  Array.from({ length: playerCount }, (_, i) => ({
    id: i,
    name: getPlayerName(i, language),
    color: colors[i],
    positionIndex: 0,
    hasFinished: false,
    isSkippingTurn: false,
    isEliminated: false
  }));

export const createInitialBoardState = (playerCount: number): Record<string, CellType> => {
  const boardState: Record<string, CellType> = {};

  for (let p = 0; p < playerCount; p++) {
    boardState[`${p}-0`] = 'start';
    boardState[`${p}-1`] = 'hidden';
    boardState[`${p}-2`] = 'hidden';
    boardState[`${p}-3`] = 'hidden';
  }

  return boardState;
};

export const getCellTypeFromDice = (diceResult: DiceFace): CellType => {
  if (diceResult === 'door') return 'door';
  if (diceResult === 'monster') return 'monster';
  return 'corridor';
};

export const getRandomDiceFace = (): DiceFace => {
  const rollIndex = Math.floor(Math.random() * DICE_FACES.length);
  return DICE_FACES[rollIndex];
};

export const getNextPlayerIndex = (currentIndex: number, playerCount: number) =>
  (currentIndex + 1) % playerCount;

export const pickQuizQuestion = (pendingQuestion?: QuizQuestion): QuizQuestion => {
  if (pendingQuestion) return pendingQuestion;
  const qIndex = Math.floor(Math.random() * QUESTIONS_DB.length);
  return QUESTIONS_DB[qIndex];
};

export const getRandomRpsChoice = (): RpsChoice =>
  RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];

export const resolveRpsRound = (playerChoice: RpsChoice, opponentChoice: RpsChoice): RpsResult => {
  if (playerChoice === opponentChoice) return 'draw';

  if (
    (playerChoice === 'rock' && opponentChoice === 'scissors') ||
    (playerChoice === 'paper' && opponentChoice === 'rock') ||
    (playerChoice === 'scissors' && opponentChoice === 'paper')
  ) {
    return 'win';
  }

  return 'lose';
};

export const getCellLabel = (
  ui: {
    cell_corridor: string;
    cell_door: string;
    cell_monster: string;
    cell_center: string;
    cell_start: string;
    cell_hidden: string;
  },
  type: keyof AssetConfig['cells']
) => {
  switch (type) {
    case 'corridor':
      return ui.cell_corridor;
    case 'door':
      return ui.cell_door;
    case 'monster':
      return ui.cell_monster;
    case 'center':
      return ui.cell_center;
    case 'start':
      return ui.cell_start;
    case 'hidden':
      return ui.cell_hidden;
    default:
      return type;
  }
};
