import { DiceFace } from './types';

export const MAX_PLAYERS = 6;
export const PATH_LENGTH = 3; // 3 cells between start and center
export const CENTER_INDEX = 4; // Start(0) -> 1 -> 2 -> 3 -> Center(4)

export const DICE_FACES: DiceFace[] = [
  'corridor', 'corridor', 'corridor',
  'door', 'door',
  'monster'
];

export const PLAYER_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
];
