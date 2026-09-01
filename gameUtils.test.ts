import { describe, expect, it } from 'vitest';
import { DICE_FACES, PLAYER_COLORS } from './constants';
import {
  createInitialBoardState,
  createPlayers,
  getCellTypeFromDice,
  getNextPlayerIndex,
  resolveRpsRound,
} from './gameUtils';
import { Language } from './types';

describe('createPlayers', () => {
  it('creates the requested number of players with default gameplay state', () => {
    expect(createPlayers(2, Language.EN, PLAYER_COLORS)).toEqual([
      {
        id: 0,
        name: 'Player 1',
        grade: 1,
        color: PLAYER_COLORS[0],
        positionIndex: 0,
        hasFinished: false,
        isSkippingTurn: false,
        isEliminated: false,
      },
      {
        id: 1,
        name: 'Player 2',
        grade: 1,
        color: PLAYER_COLORS[1],
        positionIndex: 0,
        hasFinished: false,
        isSkippingTurn: false,
        isEliminated: false,
      },
    ]);
  });

  it('uses localized player labels', () => {
    const [player] = createPlayers(1, Language.PL, PLAYER_COLORS);

    expect(player.name).toBe('Gracz 1');
  });

  it('assigns per-player grades from setup', () => {
    const players = createPlayers(2, Language.EN, PLAYER_COLORS, [2, 4]);

    expect(players.map((player) => player.grade)).toEqual([2, 4]);
  });
});

describe('createInitialBoardState', () => {
  it('creates start and hidden cells for each player path', () => {
    expect(createInitialBoardState(2)).toEqual({
      '0-0': 'start',
      '0-1': 'hidden',
      '0-2': 'hidden',
      '0-3': 'hidden',
      '1-0': 'start',
      '1-1': 'hidden',
      '1-2': 'hidden',
      '1-3': 'hidden',
    });
  });

  it('returns an empty board state when there are no players', () => {
    expect(createInitialBoardState(0)).toEqual({});
  });
});

describe('getCellTypeFromDice', () => {
  it.each([
    ['corridor', 'corridor'],
    ['door', 'door'],
    ['monster', 'monster'],
  ] as const)('maps a %s dice result to a %s cell', (diceResult, expectedCellType) => {
    expect(getCellTypeFromDice(diceResult)).toBe(expectedCellType);
  });
});

describe('dice face distribution', () => {
  it('maps the six dice faces to the 3-2-1 game distribution', () => {
    expect(DICE_FACES.map((diceFace) => getCellTypeFromDice(diceFace))).toEqual([
      'corridor',
      'corridor',
      'corridor',
      'door',
      'door',
      'monster',
    ]);
  });
});

describe('getNextPlayerIndex', () => {
  it('moves to the next player', () => {
    expect(getNextPlayerIndex(1, 4)).toBe(2);
  });

  it('wraps back to the first player after the last player', () => {
    expect(getNextPlayerIndex(3, 4)).toBe(0);
  });
});

describe('resolveRpsRound', () => {
  it.each([
    ['rock', 'rock', 'draw'],
    ['paper', 'paper', 'draw'],
    ['scissors', 'scissors', 'draw'],
    ['rock', 'scissors', 'win'],
    ['paper', 'rock', 'win'],
    ['scissors', 'paper', 'win'],
    ['rock', 'paper', 'lose'],
    ['paper', 'scissors', 'lose'],
    ['scissors', 'rock', 'lose'],
  ] as const)('resolves %s against %s as %s', (playerChoice, opponentChoice, expectedResult) => {
    expect(resolveRpsRound(playerChoice, opponentChoice)).toBe(expectedResult);
  });
});
