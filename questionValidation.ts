import { EditableQuestion, Language, QuestionDifficulty } from './types';
import { isQuestionSubject } from './questionSubjects';
import { isSupportedGrade } from './grades';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ParseEditableQuestionOptions {
  allowLegacySubject?: boolean;
}

const SUPPORTED_DIFFICULTIES: QuestionDifficulty[] = [1, 2, 3];

export const isSupportedLanguage = (language: unknown): language is Language =>
  Object.values(Language).includes(language as Language);

export const normalizeOptionalImageId = (imageId: string | undefined): string | undefined => {
  const trimmedImageId = imageId?.trim();
  return trimmedImageId ? trimmedImageId : undefined;
};

export const normalizeOptionImageIds = (
  optionImageIds: Array<string | null> | undefined,
  optionCount: number
): Array<string | null> | undefined => {
  if (!optionImageIds) return undefined;

  return Array.from({ length: optionCount }, (_, index) => {
    const imageId = optionImageIds[index];
    if (typeof imageId !== 'string') return null;
    return imageId.trim() || null;
  });
};

export const validateQuestion = (
  question: EditableQuestion,
  existingQuestions: EditableQuestion[] = []
): ValidationResult => {
  const errors: string[] = [];
  const trimmedId = question.id.trim();
  const trimmedQuestion = question.question.trim();
  const trimmedOptions = question.options.map((option) => option.trim());

  if (!trimmedId) {
    errors.push('Question id is required.');
  }

  const hasDuplicateId = existingQuestions.some((existing) => existing.id === trimmedId && existing !== question);
  if (hasDuplicateId) {
    errors.push('Question id must be unique.');
  }

  if (!isSupportedLanguage(question.language)) {
    errors.push('Question language is not supported.');
  }

  if (!trimmedQuestion) {
    errors.push('Question text is required.');
  }

  if (trimmedOptions.length < 2) {
    errors.push('At least two answer options are required.');
  }

  if (trimmedOptions.some((option) => option.length === 0)) {
    errors.push('Answer options cannot be empty.');
  }

  if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= trimmedOptions.length) {
    errors.push('Correct answer must point to an existing option.');
  }

  if (question.grade !== undefined && !isSupportedGrade(question.grade)) {
    errors.push('Grade must be 1, 2, 3, or 4.');
  }

  if (question.difficulty !== undefined && !SUPPORTED_DIFFICULTIES.includes(question.difficulty)) {
    errors.push('Difficulty must be 1, 2, or 3.');
  }

  if (question.subject !== undefined && !isQuestionSubject(question.subject)) {
    errors.push('Question subject is not supported.');
  }

  if (question.questionImageId !== undefined && typeof question.questionImageId !== 'string') {
    errors.push('Question image id must be a string.');
  }

  if (question.explanationImageId !== undefined && typeof question.explanationImageId !== 'string') {
    errors.push('Explanation image id must be a string.');
  }

  if (
    question.optionImageIds !== undefined &&
    (!Array.isArray(question.optionImageIds) ||
      question.optionImageIds.some((imageId) => imageId !== null && typeof imageId !== 'string'))
  ) {
    errors.push('Option image ids must be strings or null.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const normalizeQuestion = (question: EditableQuestion): EditableQuestion => {
  const normalized: EditableQuestion = {
    ...question,
    id: question.id.trim(),
    question: question.question.trim(),
    options: question.options.map((option) => option.trim()),
    correctIndex: question.correctIndex,
    enabled: question.enabled,
  };

  if (question.subject !== undefined) normalized.subject = question.subject;
  if (question.topic !== undefined) normalized.topic = question.topic.trim();
  if (question.explanation !== undefined) normalized.explanation = question.explanation.trim();
  normalized.questionImageId = normalizeOptionalImageId(question.questionImageId);
  normalized.optionImageIds = normalizeOptionImageIds(question.optionImageIds, normalized.options.length);
  normalized.explanationImageId = normalizeOptionalImageId(question.explanationImageId);

  return normalized;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseEditableQuestion = (
  value: unknown,
  parseOptions: ParseEditableQuestionOptions = {}
): EditableQuestion | null => {
  if (!isRecord(value)) return null;

  const options = value.options;
  if (!Array.isArray(options) || !options.every((option) => typeof option === 'string')) return null;
  if (
    typeof value.id !== 'string' ||
    !isSupportedLanguage(value.language) ||
    typeof value.question !== 'string' ||
    typeof value.correctIndex !== 'number' ||
    typeof value.enabled !== 'boolean'
  ) {
    return null;
  }

  const question: EditableQuestion = {
    id: value.id,
    language: value.language,
    question: value.question,
    options,
    correctIndex: value.correctIndex,
    enabled: value.enabled,
  };

  if (typeof value.subject === 'string') {
    if (isQuestionSubject(value.subject)) {
      question.subject = value.subject;
    } else if (!parseOptions.allowLegacySubject) {
      return null;
    }
  } else if (value.subject !== undefined) {
    return null;
  }
  if (typeof value.topic === 'string') question.topic = value.topic;
  if (typeof value.grade === 'number') question.grade = value.grade;
  if (value.difficulty === 1 || value.difficulty === 2 || value.difficulty === 3) question.difficulty = value.difficulty;
  if (typeof value.explanation === 'string') question.explanation = value.explanation;
  if (typeof value.questionImageId === 'string') {
    question.questionImageId = value.questionImageId;
  } else if (value.questionImageId !== undefined) {
    return null;
  }

  if (typeof value.explanationImageId === 'string') {
    question.explanationImageId = value.explanationImageId;
  } else if (value.explanationImageId !== undefined) {
    return null;
  }
  if (
    Array.isArray(value.optionImageIds) &&
    value.optionImageIds.every((imageId) => imageId === null || typeof imageId === 'string')
  ) {
    question.optionImageIds = value.optionImageIds;
  } else if (value.optionImageIds !== undefined) {
    return null;
  }

  return question;
};
