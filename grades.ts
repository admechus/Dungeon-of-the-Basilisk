export const SUPPORTED_GRADES = [1, 2, 3, 4] as const;

export type SupportedGrade = typeof SUPPORTED_GRADES[number];

export const DEFAULT_PLAYER_GRADE: SupportedGrade = SUPPORTED_GRADES[0];

export const isSupportedGrade = (value: unknown): value is SupportedGrade =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  SUPPORTED_GRADES.includes(value as SupportedGrade);
