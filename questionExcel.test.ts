import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { mergeQuestionBanks } from './questionBank';
import {
  createQuestionWorkbook,
  createQuestionTemplateWorkbook,
  excelRowToQuestionCandidate,
  parseQuestionWorkbook,
  parseQuestionWorkbookArrayBuffer,
  questionToExcelRow,
  workbookToArrayBuffer,
} from './questionExcel';
import { EditableQuestion, Language } from './types';

const createQuestion = (overrides: Partial<EditableQuestion> = {}): EditableQuestion => ({
  id: 'q-1',
  language: Language.EN,
  subject: 'language',
  question: 'What opens the door?',
  options: ['A key', 'A stone'],
  correctIndex: 0,
  enabled: true,
  ...overrides,
});

describe('question Excel rows', () => {
  it('exports a question to an Excel row', () => {
    expect(questionToExcelRow(createQuestion({
      correctIndex: 1,
      questionImageId: 'question-image',
      optionImageIds: ['option-image', null],
      explanationImageId: 'explanation-image',
    }))).toMatchObject({
      id: 'q-1',
      language: Language.EN,
      subject: 'language',
      option1: 'A key',
      option2: 'A stone',
      correct: 2,
      enabled: 'TRUE',
      questionImageId: 'question-image',
      option1ImageId: 'option-image',
      explanationImageId: 'explanation-image',
    });
  });

  it('imports an Excel row to a question', () => {
    const result = excelRowToQuestionCandidate({
      id: 'row-question',
      language: Language.PL,
      subject: 'mathematics',
      question: 'Ile to jest 2 + 2?',
      option1: '3',
      option2: '4',
      correct: 2,
      enabled: 'TRUE',
    }, 2);

    expect(result.question).toMatchObject({
      id: 'row-question',
      language: Language.PL,
      subject: 'mathematics',
      correctIndex: 1,
      enabled: true,
    });
  });

  it('maps correct 1 to correctIndex 0', () => {
    expect(excelRowToQuestionCandidate({
      id: 'correct-1',
      language: Language.EN,
      question: 'Pick A',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).question?.correctIndex).toBe(0);
  });

  it('maps correct 4 to correctIndex 3', () => {
    expect(excelRowToQuestionCandidate({
      id: 'correct-4',
      language: Language.EN,
      question: 'Pick D',
      option1: 'A',
      option2: 'B',
      option3: 'C',
      option4: 'D',
      correct: 4,
      enabled: true,
    }, 2).question?.correctIndex).toBe(3);
  });

  it('rejects invalid correct values', () => {
    expect(excelRowToQuestionCandidate({
      id: 'bad-correct',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      correct: 4,
      enabled: true,
    }, 2).errors).toContain('correct=4 but only 2 answers exist.');
  });

  it('accepts two options', () => {
    expect(excelRowToQuestionCandidate({
      id: 'two-options',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).question?.options).toEqual(['A', 'B']);
  });

  it('accepts four options', () => {
    expect(excelRowToQuestionCandidate({
      id: 'four-options',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      option3: 'C',
      option4: 'D',
      correct: 4,
      enabled: true,
    }, 2).question?.options).toEqual(['A', 'B', 'C', 'D']);
  });

  it('rejects leading gaps before option columns', () => {
    const result = excelRowToQuestionCandidate({
      id: 'leading-gap',
      language: Language.EN,
      question: 'Pick one',
      option1: '',
      option2: 'A',
      option3: 'B',
      correct: 2,
      enabled: true,
    }, 2);

    expect(result.question).toBeNull();
    expect(result.errors).toContain('option2 is filled after an empty option column.');
    expect(result.errors).toContain('option3 is filled after an empty option column.');
  });

  it('rejects middle gaps between option columns without shifting correct semantics', () => {
    const result = excelRowToQuestionCandidate({
      id: 'option-gap',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: '',
      option3: 'B',
      correct: 2,
      enabled: true,
    }, 2);

    expect(result.question).toBeNull();
    expect(result.errors).toContain('option3 is filled after an empty option column.');
    expect(result.errors).toContain('correct=2 but only 1 answers exist.');
  });

  it('allows trailing empty option columns', () => {
    expect(excelRowToQuestionCandidate({
      id: 'trailing-gap',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      option3: '',
      option4: '',
      correct: 2,
      enabled: true,
    }, 2).question?.options).toEqual(['A', 'B']);
  });

  it('rejects gaps between option columns', () => {
    expect(excelRowToQuestionCandidate({
      id: 'option-gap',
      language: Language.EN,
      question: 'Pick one',
      option1: 'A',
      option2: '',
      option3: 'C',
      correct: 1,
      enabled: true,
    }, 2).errors).toContain('option3 is filled after an empty option column.');
  });

  it('parses TRUE and FALSE enabled values', () => {
    expect(excelRowToQuestionCandidate({
      id: 'enabled-true',
      language: Language.EN,
      question: 'Enabled?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: 'TRUE',
    }, 2).question?.enabled).toBe(true);
    expect(excelRowToQuestionCandidate({
      id: 'enabled-false',
      language: Language.EN,
      question: 'Enabled?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: 'false',
    }, 2).question?.enabled).toBe(false);
  });

  it('parses 1 and 0 enabled values', () => {
    expect(excelRowToQuestionCandidate({
      id: 'enabled-one',
      language: Language.EN,
      question: 'Enabled?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: 1,
    }, 2).question?.enabled).toBe(true);
    expect(excelRowToQuestionCandidate({
      id: 'enabled-zero',
      language: Language.EN,
      question: 'Enabled?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: 0,
    }, 2).question?.enabled).toBe(false);
  });

  it('accepts valid languages and rejects invalid languages', () => {
    expect(excelRowToQuestionCandidate({
      id: 'valid-language',
      language: Language.JA,
      question: 'Question',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).question?.language).toBe(Language.JA);
    expect(excelRowToQuestionCandidate({
      id: 'invalid-language',
      language: 'Deutsch',
      question: 'Question',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).errors).toContain('Unsupported language: Deutsch.');
  });

  it('accepts valid subjects and rejects invalid subjects', () => {
    expect(excelRowToQuestionCandidate({
      id: 'valid-subject',
      language: Language.EN,
      subject: 'history',
      question: 'Question',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).question?.subject).toBe('history');
    expect(excelRowToQuestionCandidate({
      id: 'invalid-subject',
      language: Language.EN,
      subject: 'biology',
      question: 'Question',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2).errors).toContain('Unsupported subject: biology.');
  });

  it('rejects grades outside supported player grades', () => {
    const result = excelRowToQuestionCandidate({
      id: 'invalid-grade',
      language: Language.EN,
      grade: 5,
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2);

    expect(result.question).toBeNull();
    expect(result.errors).toContain('Unsupported grade: 5.');
  });

  it('keeps an empty Excel grade as a general question', () => {
    const result = excelRowToQuestionCandidate({
      id: 'general-grade',
      language: Language.EN,
      grade: '',
      question: 'Pick one',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 2);

    expect(result.question?.grade).toBeUndefined();
  });

  it('generates an id for empty id cells', () => {
    const result = excelRowToQuestionCandidate({
      language: Language.EN,
      question: 'Generated id?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 9, [], { now: () => 123 });

    expect(result.generatedId).toBe(true);
    expect(result.question?.id).toBe('local-excel-123-9');
  });

  it('rejects duplicate ids inside an import', () => {
    const existing = [createQuestion({ id: 'duplicate' })];

    expect(excelRowToQuestionCandidate({
      id: 'duplicate',
      language: Language.EN,
      question: 'Duplicate?',
      option1: 'A',
      option2: 'B',
      correct: 1,
      enabled: true,
    }, 3, existing).errors).toContain('Question id must be unique.');
  });
});

describe('question Excel workbooks', () => {
  it('preserves Polish, Ukrainian, Russian, and Japanese Unicode in a round-trip', () => {
    const questions = [
      createQuestion({ id: 'pl', language: Language.PL, question: 'Zażółć gęślą jaźń', options: ['Łódź', 'Gdańsk'] }),
      createQuestion({ id: 'ua', language: Language.UA, question: 'Українське питання', options: ['Так', 'Ні'] }),
      createQuestion({ id: 'ru', language: Language.RU, question: 'Русский вопрос', options: ['Да', 'Нет'] }),
      createQuestion({ id: 'ja', language: Language.JA, question: '日本語の質問', options: ['はい', 'いいえ'] }),
    ];

    const workbook = createQuestionWorkbook(questions);
    const parsed = parseQuestionWorkbookArrayBuffer(workbookToArrayBuffer(workbook));

    expect(parsed.validQuestions.map((question) => question.question)).toEqual([
      'Zażółć gęślą jaźń',
      'Українське питання',
      'Русский вопрос',
      '日本語の質問',
    ]);
  });

  it('round-trips through real XLSX serialization', () => {
    const workbook = createQuestionWorkbook([createQuestion({ id: 'round-trip', options: ['One', 'Two', 'Three'], correctIndex: 2 })]);
    const parsed = parseQuestionWorkbookArrayBuffer(workbookToArrayBuffer(workbook));

    expect(parsed.isValid).toBe(true);
    expect(parsed.validQuestions[0]).toMatchObject({
      id: 'round-trip',
      options: ['One', 'Two', 'Three'],
      correctIndex: 2,
    });
  });

  it('reports a workbook without a Questions sheet', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Only reference']]), 'Reference');

    expect(parseQuestionWorkbook(workbook).problems[0].message).toBe('Questions sheet not found.');
  });

  it('counts one invalid row once even when it has multiple problems', () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['id', 'language', 'subject', 'question', 'option1', 'option2', 'option3', 'correct', 'enabled'],
      ['bad-row', 'Deutsch', 'biology', '', '', 'A', 'B', 4, 'maybe'],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    const parsed = parseQuestionWorkbook(workbook);

    expect(parsed.summary.invalidCount).toBe(1);
    expect(parsed.problems.length).toBeGreaterThan(1);
    expect(parsed.problems.every((problem) => problem.rowNumber === 2)).toBe(true);
  });

  it('accepts missing optional columns', () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['id', 'language', 'question', 'option1', 'option2', 'correct'],
      ['minimal', Language.EN, 'Minimal?', 'A', 'B', 1],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    expect(parseQuestionWorkbook(workbook).validQuestions[0]).toMatchObject({
      id: 'minimal',
      enabled: true,
      options: ['A', 'B'],
    });
  });

  it('creates a template workbook with Questions and Reference sheets', () => {
    const workbook = createQuestionTemplateWorkbook();

    expect(workbook.SheetNames).toEqual(['Questions', 'Reference']);
  });

  it('reuses existing merge conflict rules for parsed questions', () => {
    const currentQuestions = [createQuestion({ id: 'existing' })];
    const workbook = createQuestionWorkbook([createQuestion({ id: 'existing' }), createQuestion({ id: 'new' })]);
    const parsed = parseQuestionWorkbook(workbook);
    const mergeResult = mergeQuestionBanks(currentQuestions, parsed.validQuestions);

    expect(mergeResult.addedCount).toBe(1);
    expect(mergeResult.conflictCount).toBe(1);
    expect(mergeResult.skippedConflictIds).toEqual(['existing']);
  });
});
