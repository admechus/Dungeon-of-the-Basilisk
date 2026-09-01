import * as XLSX from 'xlsx';
import { mergeQuestionBanks } from './questionBank';
import { QUESTION_SUBJECT_LABELS, QUESTION_SUBJECTS, isQuestionSubject } from './questionSubjects';
import { normalizeQuestion, validateQuestion, isSupportedLanguage } from './questionValidation';
import { EditableQuestion, Language, QuestionDifficulty } from './types';
import { isSupportedGrade, SUPPORTED_GRADES } from './grades';

export const QUESTIONS_SHEET_NAME = 'Questions';
export const REFERENCE_SHEET_NAME = 'Reference';

export const EXCEL_QUESTION_HEADERS = [
  'id',
  'language',
  'subject',
  'topic',
  'grade',
  'difficulty',
  'question',
  'option1',
  'option2',
  'option3',
  'option4',
  'correct',
  'explanation',
  'enabled',
  'questionImageId',
  'option1ImageId',
  'option2ImageId',
  'option3ImageId',
  'option4ImageId',
  'explanationImageId',
] as const;

export type ExcelQuestionHeader = typeof EXCEL_QUESTION_HEADERS[number];

export type ExcelQuestionRow = Partial<Record<ExcelQuestionHeader, string | number | boolean>>;

export interface ExcelImportProblem {
  rowNumber: number;
  questionId?: string;
  questionText?: string;
  message: string;
}

export interface ExcelParseSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  generatedIdCount: number;
}

export interface ExcelParseResult {
  isValid: boolean;
  summary: ExcelParseSummary;
  validQuestions: EditableQuestion[];
  problems: ExcelImportProblem[];
}

export interface ExcelPreviewResult extends ExcelParseResult {
  conflictCount: number;
}

interface ExcelParseOptions {
  now?: () => number;
}

const MAX_EXCEL_OPTIONS = 4;

const getCellText = (value: unknown): string =>
  value === undefined || value === null ? '' : String(value).trim();

const getOptionalText = (value: unknown): string | undefined => {
  const text = getCellText(value);
  return text ? text : undefined;
};

const getOptionalNumber = (value: unknown): number | undefined => {
  const text = getCellText(value);
  if (!text) return undefined;
  const number = Number(text);
  return Number.isInteger(number) ? number : Number.NaN;
};

export const questionToExcelRow = (question: EditableQuestion): ExcelQuestionRow => {
  const normalizedQuestion = normalizeQuestion(question);

  return {
    id: normalizedQuestion.id,
    language: normalizedQuestion.language,
    subject: normalizedQuestion.subject,
    topic: normalizedQuestion.topic,
    grade: normalizedQuestion.grade,
    difficulty: normalizedQuestion.difficulty,
    question: normalizedQuestion.question,
    option1: normalizedQuestion.options[0],
    option2: normalizedQuestion.options[1],
    option3: normalizedQuestion.options[2],
    option4: normalizedQuestion.options[3],
    correct: normalizedQuestion.correctIndex + 1,
    explanation: normalizedQuestion.explanation,
    enabled: normalizedQuestion.enabled ? 'TRUE' : 'FALSE',
    questionImageId: normalizedQuestion.questionImageId,
    option1ImageId: normalizedQuestion.optionImageIds?.[0] ?? undefined,
    option2ImageId: normalizedQuestion.optionImageIds?.[1] ?? undefined,
    option3ImageId: normalizedQuestion.optionImageIds?.[2] ?? undefined,
    option4ImageId: normalizedQuestion.optionImageIds?.[3] ?? undefined,
    explanationImageId: normalizedQuestion.explanationImageId,
  };
};

const parseEnabled = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;

  const text = getCellText(value).toLowerCase();
  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;
  return null;
};

const parseOptions = (row: ExcelQuestionRow): { options: string[]; errors: string[] } => {
  const optionValues = [row.option1, row.option2, row.option3, row.option4].map(getCellText);
  const errors: string[] = [];
  const firstEmptyIndex = optionValues.findIndex((option) => !option);
  const optionLimit = firstEmptyIndex === -1 ? optionValues.length : firstEmptyIndex;

  optionValues.forEach((option, index) => {
    if (index > optionLimit && option) {
      errors.push(`option${index + 1} is filled after an empty option column.`);
    }
  });

  return {
    options: optionValues.slice(0, optionLimit),
    errors,
  };
};

const getOptionImageIds = (row: ExcelQuestionRow, optionCount: number): Array<string | null> | undefined => {
  const imageIds = [row.option1ImageId, row.option2ImageId, row.option3ImageId, row.option4ImageId]
    .slice(0, optionCount)
    .map((value) => getOptionalText(value) ?? null);

  return imageIds.some((imageId) => imageId !== null) ? imageIds : undefined;
};

export const excelRowToQuestionCandidate = (
  row: ExcelQuestionRow,
  rowNumber: number,
  existingQuestions: EditableQuestion[] = [],
  options: ExcelParseOptions = {}
): { question: EditableQuestion | null; errors: string[]; generatedId: boolean } => {
  const errors: string[] = [];
  const { options: answerOptions, errors: optionErrors } = parseOptions(row);
  errors.push(...optionErrors);

  const idText = getCellText(row.id);
  const generatedId = !idText;
  const id = idText || `local-excel-${options.now?.() ?? Date.now()}-${rowNumber}`;
  const language = getCellText(row.language);
  const subject = getOptionalText(row.subject);
  const grade = getOptionalNumber(row.grade);
  const difficulty = getOptionalNumber(row.difficulty);
  const correct = getOptionalNumber(row.correct);
  const enabled = getCellText(row.enabled) ? parseEnabled(row.enabled) : true;

  if (!isSupportedLanguage(language)) errors.push(`Unsupported language: ${language || '(empty)'}.`);
  if (subject !== undefined && !isQuestionSubject(subject)) errors.push(`Unsupported subject: ${subject}.`);
  if (grade !== undefined && !isSupportedGrade(grade)) errors.push(`Unsupported grade: ${getCellText(row.grade)}.`);
  if (difficulty !== undefined && difficulty !== 1 && difficulty !== 2 && difficulty !== 3) {
    errors.push(`Unsupported difficulty: ${getCellText(row.difficulty)}.`);
  }
  if (correct === undefined) {
    errors.push('Correct answer is required.');
  } else if (!Number.isInteger(correct) || correct < 1 || correct > MAX_EXCEL_OPTIONS) {
    errors.push(`Unsupported correct value: ${getCellText(row.correct)}.`);
  } else if (correct > answerOptions.length) {
    errors.push(`correct=${correct} but only ${answerOptions.length} answers exist.`);
  }
  if (enabled === null) errors.push(`Unsupported enabled value: ${getCellText(row.enabled)}.`);

  const question: EditableQuestion = {
    id,
    language: isSupportedLanguage(language) ? language : Language.EN,
    question: getCellText(row.question),
    options: answerOptions,
    correctIndex: correct === undefined ? -1 : correct - 1,
    enabled: enabled ?? true,
  };

  if (subject !== undefined && isQuestionSubject(subject)) question.subject = subject;
  const topic = getOptionalText(row.topic);
  if (topic !== undefined) question.topic = topic;
  if (grade !== undefined && isSupportedGrade(grade)) question.grade = grade;
  if (difficulty === 1 || difficulty === 2 || difficulty === 3) question.difficulty = difficulty as QuestionDifficulty;
  const explanation = getOptionalText(row.explanation);
  if (explanation !== undefined) question.explanation = explanation;
  const questionImageId = getOptionalText(row.questionImageId);
  if (questionImageId !== undefined) question.questionImageId = questionImageId;
  const optionImageIds = getOptionImageIds(row, answerOptions.length);
  if (optionImageIds !== undefined) question.optionImageIds = optionImageIds;
  const explanationImageId = getOptionalText(row.explanationImageId);
  if (explanationImageId !== undefined) question.explanationImageId = explanationImageId;

  const validation = validateQuestion(question, existingQuestions);
  errors.push(...validation.errors);

  return {
    question: errors.length === 0 ? normalizeQuestion(question) : null,
    errors,
    generatedId,
  };
};

const isEmptyRow = (row: unknown[]): boolean =>
  row.every((cell) => !getCellText(cell));

const readQuestionsSheetRows = (workbook: XLSX.WorkBook): { rows: ExcelQuestionRow[]; rowNumbers: number[]; error?: string } => {
  const worksheet = workbook.Sheets[QUESTIONS_SHEET_NAME];
  if (!worksheet) return { rows: [], rowNumbers: [], error: 'Questions sheet not found.' };

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '', raw: true });
  const headerRow = rawRows[0] ?? [];
  const headers = headerRow.map((header) => getCellText(header));
  const rows: ExcelQuestionRow[] = [];
  const rowNumbers: number[] = [];

  rawRows.slice(1).forEach((rawRow, index) => {
    if (isEmptyRow(rawRow)) return;
    const row: ExcelQuestionRow = {};

    headers.forEach((header, headerIndex) => {
      if (EXCEL_QUESTION_HEADERS.includes(header as ExcelQuestionHeader)) {
        row[header as ExcelQuestionHeader] = rawRow[headerIndex] as string | number | boolean;
      }
    });

    rows.push(row);
    rowNumbers.push(index + 2);
  });

  return { rows, rowNumbers };
};

export const parseQuestionWorkbook = (
  workbook: XLSX.WorkBook,
  options: ExcelParseOptions = {}
): ExcelParseResult => {
  const { rows, rowNumbers, error } = readQuestionsSheetRows(workbook);
  if (error) {
    return {
      isValid: false,
      summary: { totalRows: 0, validCount: 0, invalidCount: 0, generatedIdCount: 0 },
      validQuestions: [],
      problems: [{ rowNumber: 0, message: error }],
    };
  }

  const validQuestions: EditableQuestion[] = [];
  const problems: ExcelImportProblem[] = [];
  let generatedIdCount = 0;
  let invalidRowCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = rowNumbers[index];
    const result = excelRowToQuestionCandidate(row, rowNumber, validQuestions, options);
    if (result.generatedId) generatedIdCount += 1;

    if (result.question) {
      validQuestions.push(result.question);
    } else {
      invalidRowCount += 1;
      result.errors.forEach((message) => {
        problems.push({
          rowNumber,
          questionId: getOptionalText(row.id),
          questionText: getOptionalText(row.question),
          message,
        });
      });
    }
  });

  return {
    isValid: validQuestions.length > 0 && problems.length === 0,
    summary: {
      totalRows: rows.length,
      validCount: validQuestions.length,
      invalidCount: invalidRowCount,
      generatedIdCount,
    },
    validQuestions,
    problems,
  };
};

export const parseQuestionWorkbookArrayBuffer = (
  arrayBuffer: ArrayBuffer,
  options: ExcelParseOptions = {}
): ExcelParseResult => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return parseQuestionWorkbook(workbook, options);
  } catch {
    return {
      isValid: false,
      summary: { totalRows: 0, validCount: 0, invalidCount: 0, generatedIdCount: 0 },
      validQuestions: [],
      problems: [{ rowNumber: 0, message: 'Invalid workbook.' }],
    };
  }
};

const createQuestionsWorksheet = (questions: EditableQuestion[]): XLSX.WorkSheet =>
  XLSX.utils.json_to_sheet(questions.map(questionToExcelRow), {
    header: [...EXCEL_QUESTION_HEADERS],
  });

const createReferenceWorksheet = (): XLSX.WorkSheet => {
  const rows: Array<Array<string | number>> = [
    ['Languages'],
    ...Object.values(Language).map((language) => [language]),
    [],
    ['Subjects', 'Polish label'],
    ...QUESTION_SUBJECTS.map((subject) => [subject, QUESTION_SUBJECT_LABELS[Language.PL][subject]]),
    [],
    ['Difficulty'],
    [1],
    [2],
    [3],
    [],
    ['Grade'],
    ...SUPPORTED_GRADES.map((grade) => [grade]),
    ['empty = general question'],
    [],
    ['Enabled'],
    ['TRUE'],
    ['FALSE'],
    [],
    ['Correct'],
    ['1 = option1'],
    ['2 = option2'],
    ['3 = option3'],
    ['4 = option4'],
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

export const createQuestionWorkbook = (questions: EditableQuestion[]): XLSX.WorkBook => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createQuestionsWorksheet(questions), QUESTIONS_SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, createReferenceWorksheet(), REFERENCE_SHEET_NAME);
  return workbook;
};

export const createQuestionTemplateWorkbook = (): XLSX.WorkBook =>
  createQuestionWorkbook([
    {
      id: '',
      language: Language.PL,
      subject: 'mathematics',
      topic: 'example',
      grade: 4,
      difficulty: 1,
      question: 'Ile to jest 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      enabled: true,
    },
  ]);

export const workbookToArrayBuffer = (workbook: XLSX.WorkBook): ArrayBuffer =>
  XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

export const createExcelPreview = (
  workbook: XLSX.WorkBook,
  currentQuestions: EditableQuestion[],
  options: ExcelParseOptions = {}
): ExcelPreviewResult => {
  const parseResult = parseQuestionWorkbook(workbook, options);
  const mergeResult = mergeQuestionBanks(currentQuestions, parseResult.validQuestions);

  return {
    ...parseResult,
    conflictCount: mergeResult.conflictCount,
  };
};
