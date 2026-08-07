import { QUESTIONS_DB } from './dictionary';
import { EditableQuestion, Language, QuizQuestion } from './types';
import { normalizeQuestion, parseEditableQuestion, validateQuestion } from './questionValidation';

export const QUESTION_BANK_FORMAT = 'dungeon-of-the-basilisk-question-bank';
export const QUESTION_BANK_VERSION = 1;

export interface QuestionBankExport {
  format: typeof QUESTION_BANK_FORMAT;
  version: typeof QUESTION_BANK_VERSION;
  exportedAt: string;
  questions: EditableQuestion[];
}

export interface ImportValidationResult {
  isValid: boolean;
  validQuestions: EditableQuestion[];
  invalidCount: number;
  errors: string[];
}

export interface MergeResult {
  questions: EditableQuestion[];
  addedCount: number;
  conflictCount: number;
  skippedConflictIds: string[];
}

interface QuestionBankParseOptions {
  allowLegacySubject?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createBuiltInQuestionBank = (): EditableQuestion[] =>
  QUESTIONS_DB.flatMap((question) =>
    Object.values(Language).map((language) => ({
      id: `builtin-${question.id}-${language}`,
      language,
      question: question.question[language],
      options: question.options[language],
      correctIndex: question.correctIndex,
      enabled: true,
    }))
  );

export const createQuestionBankExport = (
  questions: EditableQuestion[],
  exportedAt: string = new Date().toISOString()
): QuestionBankExport => ({
  format: QUESTION_BANK_FORMAT,
  version: QUESTION_BANK_VERSION,
  exportedAt,
  questions: questions.map(normalizeQuestion),
});

export const validateQuestionBankImport = (
  value: unknown,
  options: QuestionBankParseOptions = {}
): ImportValidationResult => {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      isValid: false,
      validQuestions: [],
      invalidCount: 0,
      errors: ['Import file must contain a JSON object.'],
    };
  }

  if (value.format !== QUESTION_BANK_FORMAT) {
    errors.push('Import format is not supported.');
  }

  if (value.version !== QUESTION_BANK_VERSION) {
    errors.push('Import version is not supported.');
  }

  if (!Array.isArray(value.questions)) {
    errors.push('Import file must contain a questions array.');
  }

  if (errors.length > 0 || !Array.isArray(value.questions)) {
    return {
      isValid: false,
      validQuestions: [],
      invalidCount: Array.isArray(value.questions) ? value.questions.length : 0,
      errors,
    };
  }

  const seenIds = new Set<string>();
  const validQuestions: EditableQuestion[] = [];
  let invalidCount = 0;

  value.questions.forEach((rawQuestion) => {
    const parsedQuestion = parseEditableQuestion(rawQuestion, {
      allowLegacySubject: options.allowLegacySubject,
    });
    if (!parsedQuestion) {
      invalidCount += 1;
      return;
    }

    const normalizedQuestion = normalizeQuestion(parsedQuestion);
    const result = validateQuestion(normalizedQuestion);
    if (!result.isValid || seenIds.has(normalizedQuestion.id)) {
      invalidCount += 1;
      return;
    }

    seenIds.add(normalizedQuestion.id);
    validQuestions.push(normalizedQuestion);
  });

  return {
    isValid: validQuestions.length > 0 && invalidCount === 0,
    validQuestions,
    invalidCount,
    errors,
  };
};

export const parseQuestionBankJson = (
  json: string,
  options: QuestionBankParseOptions = {}
): ImportValidationResult => {
  try {
    return validateQuestionBankImport(JSON.parse(json) as unknown, options);
  } catch {
    return {
      isValid: false,
      validQuestions: [],
      invalidCount: 0,
      errors: ['Import file is not valid JSON.'],
    };
  }
};

export const replaceQuestionBank = (incomingQuestions: EditableQuestion[]): EditableQuestion[] =>
  incomingQuestions.map(normalizeQuestion);

export const mergeQuestionBanks = (
  currentQuestions: EditableQuestion[],
  incomingQuestions: EditableQuestion[]
): MergeResult => {
  const existingIds = new Set(currentQuestions.map((question) => question.id));
  const mergedQuestions = [...currentQuestions];
  const skippedConflictIds: string[] = [];
  let addedCount = 0;

  incomingQuestions.forEach((question) => {
    const normalizedQuestion = normalizeQuestion(question);
    if (existingIds.has(normalizedQuestion.id)) {
      skippedConflictIds.push(normalizedQuestion.id);
      return;
    }

    existingIds.add(normalizedQuestion.id);
    mergedQuestions.push(normalizedQuestion);
    addedCount += 1;
  });

  return {
    questions: mergedQuestions,
    addedCount,
    conflictCount: skippedConflictIds.length,
    skippedConflictIds,
  };
};

export const getEnabledQuestionsForLanguage = (
  questions: EditableQuestion[],
  language: Language
): EditableQuestion[] =>
  questions.filter((question) => question.enabled && question.language === language);

export const toQuizQuestion = (question: EditableQuestion): QuizQuestion => {
  const numericId = Math.abs(
    Array.from(question.id).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) | 0, 0)
  );
  const localizedQuestion = Object.values(Language).reduce(
    (record, language) => ({ ...record, [language]: question.question }),
    {} as Record<Language, string>
  );
  const localizedOptions = Object.values(Language).reduce(
    (record, language) => ({ ...record, [language]: question.options }),
    {} as Record<Language, string[]>
  );

  return {
    id: numericId,
    question: localizedQuestion,
    options: localizedOptions,
    correctIndex: question.correctIndex,
    questionImageId: question.questionImageId,
    optionImageIds: question.optionImageIds,
    explanationImageId: question.explanationImageId,
  };
};

export const pickQuestionFromBank = (
  questions: EditableQuestion[],
  language: Language,
  fallbackQuestions: QuizQuestion[],
  random: () => number = Math.random
): QuizQuestion => {
  const enabledQuestions = getEnabledQuestionsForLanguage(questions, language);

  if (enabledQuestions.length > 0) {
    return toQuizQuestion(enabledQuestions[Math.floor(random() * enabledQuestions.length)]);
  }

  const localizedFallbackQuestions = fallbackQuestions.filter((question) => Boolean(question.question[language]));
  const fallbackPool = localizedFallbackQuestions.length > 0 ? localizedFallbackQuestions : fallbackQuestions;
  return fallbackPool[Math.floor(random() * fallbackPool.length)];
};
