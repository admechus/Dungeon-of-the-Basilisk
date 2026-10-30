import { describe, expect, it } from 'vitest';
import { createBuiltInQuestionBank, createQuestionBankExport, mergeQuestionBanks, parseQuestionBankJson } from './questionBank';
import { createQuestionWorkbook, parseQuestionWorkbook, workbookToArrayBuffer, parseQuestionWorkbookArrayBuffer } from './questionExcel';
import {
  loadQuestionBank,
  persistQuestionBankChanges,
  QuestionBankSession,
  QuestionStorage,
  QUESTION_BANK_STORAGE_KEY,
  resetQuestionBank,
  saveQuestionBank,
} from './questionStorage';
import { getTeacherEditorText } from './teacherEditorUi';
import { EditableQuestion, Language } from './types';

const question: EditableQuestion = {
  id: 'recovery-question',
  language: Language.PL,
  question: 'Pytanie do odzyskania?',
  options: ['Tak', 'Nie'],
  correctIndex: 1,
  enabled: false,
  subject: 'nature',
  grade: 3,
  difficulty: 2,
  topic: 'topic',
  explanation: 'explanation',
  questionImageId: 'question-image',
  optionImageIds: ['answer-image', null],
  explanationImageId: 'explanation-image',
};

class MemoryStorage implements QuestionStorage {
  values = new Map<string, string>();
  rejectWrites = false;
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void {
    if (this.rejectWrites) throw new Error('QuotaExceededError');
    this.values.set(key, value);
  }
}

describe('question bank storage and recovery', () => {
  it('writes the existing storage key and format without changing question content', () => {
    const storage = new MemoryStorage();
    expect(saveQuestionBank([question], storage)).toBe(true);
    expect(JSON.parse(storage.getItem(QUESTION_BANK_STORAGE_KEY) ?? '')).toEqual({ questions: [question] });
    expect(loadQuestionBank(storage).questions).toEqual([question]);
    expect(storage.values.size).toBe(1);
  });

  it('returns false when the storage adapter throws and preserves the stored bank', () => {
    const storage = new MemoryStorage();
    saveQuestionBank([question], storage);
    storage.rejectWrites = true;
    expect(saveQuestionBank([], storage)).toBe(false);
    expect(loadQuestionBank(storage).questions).toEqual([question]);
  });

  it('reports a successful write as persisted with no unsaved state', () => {
    const result = persistQuestionBankChanges([question], () => true);
    expect(result.persisted).toBe(true);
    expect(result.session).toEqual({ questions: [question], hasUnsavedChanges: false });
  });

  it('never reports durable success when the writer returns false', () => {
    const questions = [question];
    const result = persistQuestionBankChanges(questions, () => false);
    expect(result.persisted).toBe(false);
    expect(result.session.hasUnsavedChanges).toBe(true);
    expect(result.session.questions).toBe(questions);
  });

  it('retains intended changes when an injected writer throws', () => {
    const result = persistQuestionBankChanges([question], () => { throw new Error('Storage denied'); });
    expect(result.persisted).toBe(false);
    expect(result.session).toEqual({ questions: [question], hasUnsavedChanges: true });
  });

  it('retries the in-memory bank and clears the warning only after a successful write', () => {
    const storage = new MemoryStorage();
    storage.rejectWrites = true;
    const write = (questions: EditableQuestion[]) => saveQuestionBank(questions, storage);
    const failed = persistQuestionBankChanges([question], write);
    const failedRetry = persistQuestionBankChanges(failed.session.questions, write);
    expect(failedRetry.session.hasUnsavedChanges).toBe(true);
    storage.rejectWrites = false;
    const retried = persistQuestionBankChanges(failedRetry.session.questions, write);
    expect(retried.persisted).toBe(true);
    expect(retried.session.hasUnsavedChanges).toBe(false);
    expect(loadQuestionBank(storage).questions).toEqual([question]);
  });

  it('exports the unsaved bank as compatible recovery JSON without clearing its status', () => {
    const { session } = persistQuestionBankChanges([question], () => false);
    const payload = createQuestionBankExport(session.questions, '2026-10-30T00:00:00.000Z');
    const recovered = parseQuestionBankJson(JSON.stringify(payload));
    expect(payload.format).toBe('dungeon-of-the-basilisk-question-bank');
    expect(payload.version).toBe(1);
    expect(recovered.isValid).toBe(true);
    expect(recovered.validQuestions).toEqual([question]);
    expect(session.hasUnsavedChanges).toBe(true);
  });

  it('keeps a recoverable unsaved bank unchanged when reset persistence fails', () => {
    const session: QuestionBankSession = { questions: [question], hasUnsavedChanges: true };
    const result = resetQuestionBank(session, () => false);
    expect(result.persisted).toBe(false);
    expect(result.session).toBe(session);
    expect(createQuestionBankExport(result.session.questions).questions).toEqual([question]);
  });

  it('keeps the old persisted bank unchanged when reset throws', () => {
    const session: QuestionBankSession = { questions: [question], hasUnsavedChanges: false };
    const result = resetQuestionBank(session, () => { throw new Error('QuotaExceededError'); });
    expect(result.persisted).toBe(false);
    expect(result.session).toBe(session);
  });

  it('commits defaults and clears unsaved status only after reset succeeds', () => {
    const storage = new MemoryStorage();
    const result = resetQuestionBank(
      { questions: [question], hasUnsavedChanges: true },
      (questions) => saveQuestionBank(questions, storage)
    );
    expect(result.persisted).toBe(true);
    expect(result.session.hasUnsavedChanges).toBe(false);
    expect(result.session.questions).toEqual(createBuiltInQuestionBank());
    expect(loadQuestionBank(storage).questions).toEqual(createBuiltInQuestionBank());
  });

  it.each(['replace', 'merge'] as const)('retains JSON %s imports in memory if persistence fails', (mode) => {
    const imported = parseQuestionBankJson(JSON.stringify(createQuestionBankExport([question])));
    const original = { ...question, id: 'original' };
    const intended = mode === 'replace' ? imported.validQuestions : mergeQuestionBanks([original], imported.validQuestions).questions;
    const result = persistQuestionBankChanges(intended, () => false);
    expect(result.persisted).toBe(false);
    expect(result.session.hasUnsavedChanges).toBe(true);
    expect(result.session.questions).toEqual(mode === 'replace' ? [question] : [original, question]);
  });

  it.each(['replace', 'merge'] as const)('retains Excel %s imports in memory if persistence fails', (mode) => {
    const imported = parseQuestionWorkbookArrayBuffer(workbookToArrayBuffer(createQuestionWorkbook([question])));
    const original = { ...question, id: 'original' };
    const intended = mode === 'replace' ? imported.validQuestions : mergeQuestionBanks([original], imported.validQuestions).questions;
    const result = persistQuestionBankChanges(intended, () => false);
    expect(imported.isValid).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.session.hasUnsavedChanges).toBe(true);
    expect(result.session.questions).toEqual(mode === 'replace' ? [question] : [original, question]);
    expect(parseQuestionWorkbook(createQuestionWorkbook(result.session.questions)).isValid).toBe(true);
  });

  it.each(Object.values(Language))('provides recovery messages and controls in %s', (language) => {
    const text = getTeacherEditorText(language);
    const english = getTeacherEditorText(Language.EN);
    for (const key of ['unsavedWarning', 'retrySave', 'exportUnsavedJson', 'recoveryExported', 'resetFailed', 'confirmResetUnsaved'] as const) {
      expect(text[key].length).toBeGreaterThan(0);
      if (language !== Language.EN) expect(text[key]).not.toBe(english[key]);
    }
  });
});
