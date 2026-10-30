import { EditableQuestion } from './types';

export const removeQuestionOption = (question: EditableQuestion, index: number): EditableQuestion => ({
  ...question,
  options: question.options.filter((_, optionIndex) => optionIndex !== index),
  optionImageIds: question.optionImageIds?.filter((_, optionIndex) => optionIndex !== index),
  // -1 leaves the draft invalid until the teacher explicitly selects a replacement.
  correctIndex: question.correctIndex === index
    ? -1
    : question.correctIndex > index ? question.correctIndex - 1 : question.correctIndex,
});
