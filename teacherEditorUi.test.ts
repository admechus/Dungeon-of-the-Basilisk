import { describe, expect, it } from 'vitest';
import { filterQuestionsForTeacher } from './questionSubjects';
import {
  DEFAULT_TEACHER_EDITOR_UI_PREFERENCES,
  getTeacherEditorText,
  loadTeacherEditorUiPreferences,
  localizeTeacherEditorMessage,
  saveTeacherEditorUiPreferences,
  sortQuestionsForTeacher,
  TEACHER_EDITOR_UI_STORAGE_KEY,
  TeacherEditorUiStorage,
} from './teacherEditorUi';
import { EditableQuestion, Language } from './types';

const createQuestion = (overrides: Partial<EditableQuestion> = {}): EditableQuestion => ({
  id: 'q-1',
  language: Language.EN,
  question: 'Default question',
  options: ['A', 'B'],
  correctIndex: 0,
  enabled: true,
  subject: 'language',
  ...overrides,
});

class MemoryStorage implements TeacherEditorUiStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('teacher editor shared filtering', () => {
  const questions = [
    createQuestion({ id: 'math-en', language: Language.EN, subject: 'mathematics', question: 'Multiplication table' }),
    createQuestion({ id: 'math-pl', language: Language.PL, subject: 'mathematics', question: 'Multiplication table' }),
    createQuestion({ id: 'geo-en', language: Language.EN, subject: 'geography', question: 'Mountain map' }),
    createQuestion({ id: 'legacy-en', language: Language.EN, subject: undefined, question: 'Multiplication legacy' }),
  ];

  it('combines language, subject, and search filters in one pipeline', () => {
    const result = filterQuestionsForTeacher(questions, {
      language: Language.EN,
      subject: 'mathematics',
      searchText: 'multiplication',
    });

    expect(result.map((question) => question.id)).toEqual(['math-en']);
  });
});

describe('teacher editor sorting', () => {
  const questions = [
    createQuestion({ id: 'b', language: Language.PL, subject: 'history', question: 'Beta', grade: 3 }),
    createQuestion({ id: 'a', language: Language.EN, subject: 'geography', question: 'Alpha', grade: 1 }),
    createQuestion({ id: 'c', language: Language.JA, subject: 'mathematics', question: 'Gamma', grade: 2 }),
  ];

  it('sorts questions by question text', () => {
    expect(sortQuestionsForTeacher(questions, 'question', 'asc').map((question) => question.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts questions by language', () => {
    expect(sortQuestionsForTeacher(questions, 'language', 'asc').map((question) => question.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts questions by subject', () => {
    expect(sortQuestionsForTeacher(questions, 'subject', 'asc').map((question) => question.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts questions by grade and direction', () => {
    expect(sortQuestionsForTeacher(questions, 'grade', 'desc').map((question) => question.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('teacher editor UI preferences', () => {
  it('uses list view by default when no preferences are saved', () => {
    expect(loadTeacherEditorUiPreferences(new MemoryStorage())).toEqual(DEFAULT_TEACHER_EDITOR_UI_PREFERENCES);
  });

  it('saves and loads the selected view mode and sort settings', () => {
    const storage = new MemoryStorage();

    saveTeacherEditorUiPreferences({ viewMode: 'grid', sortMode: 'subject', sortDirection: 'desc' }, storage);

    expect(loadTeacherEditorUiPreferences(storage)).toEqual({
      viewMode: 'grid',
      sortMode: 'subject',
      sortDirection: 'desc',
    });
  });

  it('falls back safely when stored preferences are corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem(TEACHER_EDITOR_UI_STORAGE_KEY, '{"viewMode":"cards","sortMode":"topic","sortDirection":"sideways"}');

    expect(loadTeacherEditorUiPreferences(storage)).toEqual(DEFAULT_TEACHER_EDITOR_UI_PREFERENCES);
  });
});

describe('teacher editor localization', () => {
  it('provides localized UI labels for the editor controls', () => {
    const englishText = getTeacherEditorText(Language.EN);
    const russianText = getTeacherEditorText(Language.RU);
    const japaneseText = getTeacherEditorText(Language.JA);

    expect(russianText.title).not.toBe(englishText.title);
    expect(russianText.imageRequirements).not.toBe(englishText.imageRequirements);
    expect(japaneseText.viewGrid).not.toBe(englishText.viewGrid);
  });

  it('localizes validation and import messages for editor display', () => {
    expect(localizeTeacherEditorMessage('Question text is required.', Language.RU)).toBe('Текст вопроса обязателен.');
    expect(localizeTeacherEditorMessage('Import format is not supported.', Language.JA)).not.toBe('Import format is not supported.');
    expect(localizeTeacherEditorMessage('photo.bmp: Unsupported image format. Use PNG, JPEG, or WebP.', Language.RU))
      .toContain('Формат изображения не поддерживается.');
  });
});
