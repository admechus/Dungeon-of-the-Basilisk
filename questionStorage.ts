import { EditableQuestion } from './types';
import { createBuiltInQuestionBank, parseQuestionBankJson } from './questionBank';

export const QUESTION_BANK_STORAGE_KEY = 'dungeon-of-the-basilisk.question-bank.v1';

export interface QuestionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadQuestionBankResult {
  questions: EditableQuestion[];
  usedFallback: boolean;
}

export const loadQuestionBank = (storage: QuestionStorage | undefined = globalThis.localStorage): LoadQuestionBankResult => {
  const builtInQuestions = createBuiltInQuestionBank();

  if (!storage) {
    return {
      questions: builtInQuestions,
      usedFallback: true,
    };
  }

  try {
    const storedValue = storage.getItem(QUESTION_BANK_STORAGE_KEY);
    if (!storedValue) {
      storage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify({ questions: builtInQuestions }));
      return {
        questions: builtInQuestions,
        usedFallback: false,
      };
    }

    const parsedQuestions = parseStoredQuestionBank(storedValue);
    if (!parsedQuestions) {
      return {
        questions: builtInQuestions,
        usedFallback: true,
      };
    }

    return {
      questions: parsedQuestions,
      usedFallback: false,
    };
  } catch {
    return {
      questions: builtInQuestions,
      usedFallback: true,
    };
  }
};

export const saveQuestionBank = (
  questions: EditableQuestion[],
  storage?: QuestionStorage
): boolean => {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    target.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify({ questions }));
    return true;
  } catch {
    return false;
  }
};

export interface QuestionBankSession {
  questions: EditableQuestion[];
  hasUnsavedChanges: boolean;
}

export interface QuestionBankWriteResult {
  session: QuestionBankSession;
  persisted: boolean;
}

export type QuestionBankWriter = (questions: EditableQuestion[]) => boolean;

export const persistQuestionBankChanges = (
  questions: EditableQuestion[],
  write: QuestionBankWriter = saveQuestionBank
): QuestionBankWriteResult => {
  let persisted = false;
  try {
    persisted = write(questions) === true;
  } catch {
    // A failed write must leave the intended bank available for recovery.
  }
  return { session: { questions, hasUnsavedChanges: !persisted }, persisted };
};

export const resetQuestionBank = (
  currentSession: QuestionBankSession,
  write: QuestionBankWriter = saveQuestionBank
): QuestionBankWriteResult => {
  const result = persistQuestionBankChanges(createBuiltInQuestionBank(), write);
  // Reset is atomic: do not replace recoverable work when defaults cannot be stored.
  return result.persisted ? result : { session: currentSession, persisted: false };
};

const parseStoredQuestionBank = (storedValue: string): EditableQuestion[] | null => {
  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (Array.isArray(parsed)) {
      const wrappedResult = parseQuestionBankJson(
        JSON.stringify({
          format: 'dungeon-of-the-basilisk-question-bank',
          version: 1,
          exportedAt: '',
          questions: parsed,
        }),
        { allowLegacySubject: true }
      );
      return wrappedResult.validQuestions.length > 0 ? wrappedResult.validQuestions : null;
    }

    if (typeof parsed === 'object' && parsed !== null && 'questions' in parsed) {
      const wrappedResult = parseQuestionBankJson(
        JSON.stringify({
          format: 'dungeon-of-the-basilisk-question-bank',
          version: 1,
          exportedAt: '',
          questions: (parsed as { questions: unknown }).questions,
        }),
        { allowLegacySubject: true }
      );
      return wrappedResult.validQuestions.length > 0 ? wrappedResult.validQuestions : null;
    }

    return null;
  } catch {
    return null;
  }
};
