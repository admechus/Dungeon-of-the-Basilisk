import { describe, expect, it } from 'vitest';
import { createQuestionBankExport, mergeQuestionBanks, parseQuestionBankJson, pickQuestionFromBank, validateQuestionBankImport } from './questionBank';
import { filterQuestionsForTeacher, getQuestionSubjectLabel, QUESTION_SUBJECTS } from './questionSubjects';
import { loadQuestionBank, QuestionStorage, saveQuestionBank } from './questionStorage';
import { normalizeOptionImageIds, normalizeQuestion, validateQuestion } from './questionValidation';
import { EditableQuestion, Language, QuizQuestion } from './types';

const createQuestion = (overrides: Partial<EditableQuestion> = {}): EditableQuestion => ({
  id: 'q-1',
  language: Language.EN,
  question: 'What opens the door?',
  options: ['A key', 'A stone'],
  correctIndex: 0,
  enabled: true,
  ...overrides,
});

const fallbackQuestion: QuizQuestion = {
  id: 1,
  question: {
    [Language.EN]: 'Fallback EN',
    [Language.PL]: 'Fallback PL',
    [Language.UA]: 'Fallback UA',
    [Language.RU]: 'Fallback RU',
    [Language.JA]: 'Fallback JA',
  },
  options: {
    [Language.EN]: ['Yes', 'No'],
    [Language.PL]: ['Yes', 'No'],
    [Language.UA]: ['Yes', 'No'],
    [Language.RU]: ['Yes', 'No'],
    [Language.JA]: ['Yes', 'No'],
  },
  correctIndex: 0,
};

class MemoryStorage implements QuestionStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('validateQuestion', () => {
  it('accepts a valid question', () => {
    expect(validateQuestion(createQuestion()).isValid).toBe(true);
  });

  it('rejects an empty question text', () => {
    const result = validateQuestion(createQuestion({ question: '   ' }));

    expect(result.isValid).toBe(false);
  });

  it('rejects fewer than two options', () => {
    const result = validateQuestion(createQuestion({ options: ['Only one'] }));

    expect(result.isValid).toBe(false);
  });

  it('rejects an empty option', () => {
    const result = validateQuestion(createQuestion({ options: ['A key', '   '] }));

    expect(result.isValid).toBe(false);
  });

  it('rejects an invalid correctIndex', () => {
    const result = validateQuestion(createQuestion({ correctIndex: 2 }));

    expect(result.isValid).toBe(false);
  });

  it('rejects an unsupported difficulty', () => {
    const result = validateQuestion({
      ...createQuestion(),
      difficulty: 4 as 1,
    });

    expect(result.isValid).toBe(false);
  });

  it('rejects an invalid grade', () => {
    const result = validateQuestion(createQuestion({ grade: 0 }));

    expect(result.isValid).toBe(false);
  });

  it('accepts an old question without image fields', () => {
    expect(validateQuestion(createQuestion()).isValid).toBe(true);
  });

  it('accepts a question with questionImageId', () => {
    expect(validateQuestion(createQuestion({ questionImageId: 'image-1' })).isValid).toBe(true);
  });

  it('accepts a question with optionImageIds', () => {
    expect(validateQuestion(createQuestion({ optionImageIds: ['image-1', null] })).isValid).toBe(true);
  });

  it('rejects an invalid questionImageId type', () => {
    const result = validateQuestion({
      ...createQuestion(),
      questionImageId: 12,
    } as unknown as EditableQuestion);

    expect(result.isValid).toBe(false);
  });

  it('rejects invalid optionImageIds', () => {
    const result = validateQuestion({
      ...createQuestion(),
      optionImageIds: ['image-1', 12],
    } as unknown as EditableQuestion);

    expect(result.isValid).toBe(false);
  });

  it('allows null inside optionImageIds', () => {
    expect(validateQuestion(createQuestion({ optionImageIds: [null, 'image-2'] })).isValid).toBe(true);
  });

  it('normalizes optionImageIds when option count changes', () => {
    expect(normalizeOptionImageIds(['image-1', null, 'image-3'], 2)).toEqual(['image-1', null]);
    expect(normalizeOptionImageIds(['image-1'], 3)).toEqual(['image-1', null, null]);
  });

  it('normalizes empty image ids away', () => {
    expect(normalizeQuestion(createQuestion({
      questionImageId: '   ',
      explanationImageId: ' image-3 ',
      optionImageIds: [' image-1 ', ''],
    }))).toMatchObject({
      questionImageId: undefined,
      explanationImageId: 'image-3',
      optionImageIds: ['image-1', null],
    });
  });

  it('accepts all five supported subjects', () => {
    QUESTION_SUBJECTS.forEach((subject) => {
      expect(validateQuestion(createQuestion({ subject })).isValid).toBe(true);
    });
  });

  it('accepts a legacy question without subject', () => {
    expect(validateQuestion(createQuestion({ subject: undefined })).isValid).toBe(true);
  });

  it('rejects an unsupported subject value', () => {
    const result = validateQuestion({
      ...createQuestion(),
      subject: 'physics',
    } as unknown as EditableQuestion);

    expect(result.isValid).toBe(false);
  });
});

describe('question bank import and merge', () => {
  it('rejects duplicate ids in an imported bank', () => {
    const payload = createQuestionBankExport([createQuestion(), createQuestion({ question: 'Duplicate id' })]);
    const result = validateQuestionBankImport(payload);

    expect(result.validQuestions).toHaveLength(1);
    expect(result.invalidCount).toBe(1);
    expect(result.isValid).toBe(false);
  });

  it('validates the import format and version', () => {
    const result = parseQuestionBankJson(JSON.stringify({
      format: 'other-format',
      version: 99,
      questions: [createQuestion()],
    }));

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Import format is not supported.');
    expect(result.errors).toContain('Import version is not supported.');
  });

  it('merges without conflicts', () => {
    const result = mergeQuestionBanks([createQuestion()], [createQuestion({ id: 'q-2' })]);

    expect(result.questions).toHaveLength(2);
    expect(result.addedCount).toBe(1);
    expect(result.conflictCount).toBe(0);
  });

  it('skips a conflicting id during merge', () => {
    const result = mergeQuestionBanks([createQuestion()], [createQuestion({ question: 'Conflict' })]);

    expect(result.questions).toHaveLength(1);
    expect(result.addedCount).toBe(0);
    expect(result.conflictCount).toBe(1);
    expect(result.skippedConflictIds).toEqual(['q-1']);
  });

  it('preserves image ids through JSON export and import', () => {
    const question = createQuestion({
      questionImageId: 'question-image',
      optionImageIds: ['option-image', null],
      explanationImageId: 'explanation-image',
    });
    const payload = createQuestionBankExport([question], '2026-08-07T00:00:00.000Z');
    const result = parseQuestionBankJson(JSON.stringify(payload));

    expect(result.validQuestions[0]).toMatchObject({
      questionImageId: 'question-image',
      optionImageIds: ['option-image', null],
      explanationImageId: 'explanation-image',
    });
  });

  it('rejects invalid imported image fields', () => {
    const payload = createQuestionBankExport([createQuestion()]);
    const result = validateQuestionBankImport({
      ...payload,
      questions: [{ ...createQuestion(), questionImageId: 12 }],
    });

    expect(result.validQuestions).toHaveLength(0);
    expect(result.invalidCount).toBe(1);
  });

  it('preserves subject through JSON export and import', () => {
    const payload = createQuestionBankExport([createQuestion({ subject: 'mathematics' })]);
    const result = parseQuestionBankJson(JSON.stringify(payload));

    expect(result.validQuestions[0].subject).toBe('mathematics');
  });

  it('rejects unsupported subject during import', () => {
    const payload = createQuestionBankExport([createQuestion()]);
    const result = validateQuestionBankImport({
      ...payload,
      questions: [{ ...createQuestion(), subject: 'Matematyka' }],
    });

    expect(result.validQuestions).toHaveLength(0);
    expect(result.invalidCount).toBe(1);
  });
});

describe('question bank storage and selection', () => {
  it('falls back to built-in questions when stored data is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem('dungeon-of-the-basilisk.question-bank.v1', '{not-json');

    const result = loadQuestionBank(storage);

    expect(result.usedFallback).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it('filters disabled questions when selecting for the game', () => {
    const question = pickQuestionFromBank(
      [createQuestion({ enabled: false })],
      Language.EN,
      [fallbackQuestion],
      () => 0
    );

    expect(question.question[Language.EN]).toBe('Fallback EN');
  });

  it('filters questions by language when selecting for the game', () => {
    const question = pickQuestionFromBank(
      [createQuestion({ language: Language.PL, question: 'Polish only' })],
      Language.EN,
      [fallbackQuestion],
      () => 0
    );

    expect(question.question[Language.EN]).toBe('Fallback EN');
  });

  it('loads saved local questions', () => {
    const storage = new MemoryStorage();
    const savedQuestion = createQuestion({ id: 'saved-question' });

    saveQuestionBank([savedQuestion], storage);

    expect(loadQuestionBank(storage).questions).toEqual([savedQuestion]);
  });

  it('keeps a missing image asset id on the selected game question', () => {
    const question = pickQuestionFromBank(
      [createQuestion({ questionImageId: 'missing-image-asset' })],
      Language.EN,
      [fallbackQuestion],
      () => 0
    );

    expect(question.questionImageId).toBe('missing-image-asset');
    expect(question.question[Language.EN]).toBe('What opens the door?');
  });

  it('selects text questions when the image library is unavailable', () => {
    const question = pickQuestionFromBank(
      [createQuestion({ questionImageId: 'unavailable-image-library' })],
      Language.EN,
      [fallbackQuestion],
      () => 0
    );

    expect(question.question[Language.EN]).toBe('What opens the door?');
    expect(question.correctIndex).toBe(0);
  });

  it('loads a legacy localStorage question with unknown subject as subjectless', () => {
    const storage = new MemoryStorage();
    saveQuestionBank([{ ...createQuestion(), subject: 'legacy-free-text' } as unknown as EditableQuestion], storage);

    const result = loadQuestionBank(storage);

    expect(result.usedFallback).toBe(false);
    expect(result.questions[0].subject).toBeUndefined();
  });
});

describe('teacher question filters and subject labels', () => {
  const filterQuestions = [
    createQuestion({ id: 'language-en', language: Language.EN, subject: 'language', question: 'Spelling task' }),
    createQuestion({ id: 'math-en', language: Language.EN, subject: 'mathematics', question: 'Multiplication task' }),
    createQuestion({ id: 'math-pl', language: Language.PL, subject: 'mathematics', question: 'Mnozenie' }),
    createQuestion({ id: 'legacy-en', language: Language.EN, subject: undefined, question: 'Legacy task' }),
  ];

  it('filters by language and subject together', () => {
    expect(filterQuestionsForTeacher(filterQuestions, {
      language: Language.EN,
      subject: 'mathematics',
      searchText: '',
    }).map((question) => question.id)).toEqual(['math-en']);
  });

  it('filters by search and subject together', () => {
    expect(filterQuestionsForTeacher(filterQuestions, {
      language: 'all',
      subject: 'mathematics',
      searchText: 'multiplication',
    }).map((question) => question.id)).toEqual(['math-en']);
  });

  it('does not include subjectless legacy questions in a specific subject filter', () => {
    expect(filterQuestionsForTeacher(filterQuestions, {
      language: 'all',
      subject: 'language',
      searchText: 'legacy',
    })).toEqual([]);
  });

  it('looks up localized subject labels', () => {
    expect(getQuestionSubjectLabel('mathematics', Language.PL)).toBe('Matematyka');
    expect(getQuestionSubjectLabel('history', Language.EN)).toBe('History');
  });
});
