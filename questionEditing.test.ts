import { describe, expect, it } from 'vitest';
import { removeQuestionOption } from './questionEditing';
import { createQuestionBankExport, parseQuestionBankJson } from './questionBank';
import { createQuestionWorkbook, parseQuestionWorkbook } from './questionExcel';
import { validateQuestion } from './questionValidation';
import { EditableQuestion, Language } from './types';

const createQuestion = (overrides: Partial<EditableQuestion> = {}): EditableQuestion => ({
  id: 'question-1',
  language: Language.EN,
  question: 'Choose B',
  options: ['A', 'B', 'C', 'D'],
  optionImageIds: ['image-a', 'image-b', null, 'image-d'],
  correctIndex: 1,
  enabled: true,
  ...overrides,
});

describe('removeQuestionOption', () => {
  it('preserves the correct answer and image when deleting an earlier option', () => {
    const result = removeQuestionOption(createQuestion(), 0);

    expect(result.options).toEqual(['B', 'C', 'D']);
    expect(result.optionImageIds).toEqual(['image-b', null, 'image-d']);
    expect(result.correctIndex).toBe(0);
    expect(result.options[result.correctIndex]).toBe('B');
    expect(result.optionImageIds?.[result.correctIndex]).toBe('image-b');
    expect(validateQuestion(result).isValid).toBe(true);
  });

  it('preserves the correct answer and image when deleting a later option', () => {
    const result = removeQuestionOption(createQuestion(), 2);

    expect(result.options).toEqual(['A', 'B', 'D']);
    expect(result.optionImageIds).toEqual(['image-a', 'image-b', 'image-d']);
    expect(result.correctIndex).toBe(1);
    expect(result.options[result.correctIndex]).toBe('B');
    expect(result.optionImageIds?.[result.correctIndex]).toBe('image-b');
    expect(validateQuestion(result).isValid).toBe(true);
  });

  it.each([0, 1, 3])('requires a new correct answer when deleting correct option %i', (index) => {
    const original = createQuestion({ correctIndex: index });
    const result = removeQuestionOption(original, index);

    expect(result.correctIndex).toBe(-1);
    expect(result.options).toEqual(original.options.filter((_, optionIndex) => optionIndex !== index));
    expect(result.optionImageIds).toEqual(original.optionImageIds?.filter((_, optionIndex) => optionIndex !== index));
    expect(validateQuestion(result).errors).toContain('Correct answer must point to an existing option.');
    expect(validateQuestion(result).isValid).toBe(false);
  });

  it('keeps the answer unselected through another deletion and an added option', () => {
    const withoutCorrect = removeQuestionOption(createQuestion(), 1);
    const afterAnotherDeletion = removeQuestionOption(withoutCorrect, 0);
    const afterAddition = { ...afterAnotherDeletion, options: [...afterAnotherDeletion.options, 'E'] };

    expect(afterAddition.correctIndex).toBe(-1);
    expect(validateQuestion(afterAddition).isValid).toBe(false);
  });

  it('allows saving again after the teacher explicitly chooses a remaining answer', () => {
    const result = removeQuestionOption(createQuestion(), 1);
    const corrected = { ...result, correctIndex: 1 };

    expect(corrected.options[corrected.correctIndex]).toBe('C');
    expect(validateQuestion(corrected).isValid).toBe(true);
  });

  it('supports legacy questions without option images', () => {
    const result = removeQuestionOption(createQuestion({ optionImageIds: undefined }), 0);

    expect(result.correctIndex).toBe(0);
    expect(result.optionImageIds).toBeUndefined();
    expect(validateQuestion(result).isValid).toBe(true);
  });

  it('does not mutate the existing question or option arrays', () => {
    const original = createQuestion();
    const snapshot = createQuestion();
    const result = removeQuestionOption(original, 0);

    expect(original).toEqual(snapshot);
    expect(result).not.toBe(original);
    expect(result.options).not.toBe(original.options);
    expect(result.optionImageIds).not.toBe(original.optionImageIds);
  });

  it('preserves the corrected answer and images through JSON and Excel round trips', () => {
    const result = removeQuestionOption(createQuestion(), 0);
    const jsonResult = parseQuestionBankJson(JSON.stringify(createQuestionBankExport([result])));
    const excelResult = parseQuestionWorkbook(createQuestionWorkbook([result]));

    for (const imported of [jsonResult, excelResult]) {
      expect(imported.isValid).toBe(true);
      expect(imported.validQuestions[0]).toMatchObject({
        options: ['B', 'C', 'D'],
        optionImageIds: ['image-b', null, 'image-d'],
        correctIndex: 0,
      });
    }
  });
});
