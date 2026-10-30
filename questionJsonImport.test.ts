import { describe, expect, it } from 'vitest';
import { canReplaceQuestionBank, createQuestionBankExport, mergeQuestionBanks, parseQuestionBankJson } from './questionBank';
import { getTeacherEditorText, localizeTeacherEditorMessage } from './teacherEditorUi';
import { EditableQuestion, Language } from './types';

const question: EditableQuestion = {
  id: 'json-test', language: Language.EN, question: 'Question?', options: ['A', 'B'], correctIndex: 0, enabled: true,
  questionImageId: 'question-image', optionImageIds: [null, 'option-image'], explanationImageId: 'explanation-image',
};
const json = (questions: unknown[]) => JSON.stringify({ ...createQuestionBankExport([]), questions });

describe('JSON import validation preview', () => {
  it('allows fully valid non-empty banks and preserves the schema and image IDs', () => {
    const payload = createQuestionBankExport([question]);
    const result = parseQuestionBankJson(JSON.stringify(payload));
    expect(payload.format).toBe('dungeon-of-the-basilisk-question-bank');
    expect(payload.version).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.validQuestions).toEqual([question]);
    expect(result.invalidCount).toBe(0);
    expect(result.questionErrors).toEqual([]);
    expect(canReplaceQuestionBank(result)).toBe(true);
  });

  it('counts a question with several errors once while preserving every diagnostic', () => {
    const result = parseQuestionBankJson(json([question, { ...question, id: 'bad', question: '', correctIndex: 8 }]));
    expect(result.totalCount).toBe(2);
    expect(result.validQuestions).toEqual([question]);
    expect(result.invalidCount).toBe(1);
    expect(result.questionErrors).toEqual([{ questionNumber: 2, messages: ['Question text is required.', 'Correct answer must point to an existing option.'] }]);
    expect(canReplaceQuestionBank(result)).toBe(false);
  });

  it('reports duplicate IDs and structural errors without changing the valid subset for Merge', () => {
    const result = parseQuestionBankJson(json([question, question, null]));
    expect(result.totalCount).toBe(3);
    expect(result.invalidCount).toBe(2);
    expect(result.questionErrors).toEqual([
      { questionNumber: 2, messages: ['Question id must be unique.'] },
      { questionNumber: 3, messages: ['Question fields are invalid.'] },
    ]);
    expect(canReplaceQuestionBank(result)).toBe(false);
    expect(mergeQuestionBanks([], result.validQuestions).questions).toEqual([question]);
  });

  it.each([
    ['all invalid', json([{ ...question, correctIndex: 99 }])],
    ['empty bank', json([])],
    ['empty file', ''],
    ['malformed JSON', '{bad'],
    ['not an object', 'null'],
    ['array', '[]'],
    ['missing questions', JSON.stringify({ format: 'dungeon-of-the-basilisk-question-bank', version: 1 })],
    ['wrong version', JSON.stringify({ format: 'dungeon-of-the-basilisk-question-bank', version: 99, questions: [question] })],
  ])('rejects Replace for %s', (_label, content) => {
    expect(canReplaceQuestionBank(parseQuestionBankJson(content))).toBe(false);
  });

  it('keeps legacy questions without optional grade or image fields compatible', () => {
    const legacy = { id: 'legacy', language: Language.EN, question: 'Legacy?', options: ['A', 'B'], correctIndex: 1, enabled: true };
    const result = parseQuestionBankJson(json([legacy]));
    expect(canReplaceQuestionBank(result)).toBe(true);
    expect(result.validQuestions).toEqual([legacy]);
  });

  it.each(Object.values(Language))('localizes JSON preview controls and new errors in %s', (language) => {
    const text = getTeacherEditorText(language);
    const english = getTeacherEditorText(Language.EN);
    for (const key of ['jsonPreviewTitle', 'jsonTotalQuestions', 'jsonQuestionNumber', 'jsonReplaceBlocked', 'jsonReadFailed'] as const) {
      expect(text[key].length).toBeGreaterThan(0);
      if (language !== Language.EN) expect(text[key]).not.toBe(english[key]);
    }
    for (const message of ['Import file is not valid JSON.', 'Import file must contain a JSON object.', 'Question fields are invalid.']) {
      if (language !== Language.EN) expect(localizeTeacherEditorMessage(message, language)).not.toBe(localizeTeacherEditorMessage(message, Language.EN));
    }
  });
});
