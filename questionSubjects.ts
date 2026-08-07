import { EditableQuestion, Language, QuestionSubject } from './types';

export const QUESTION_SUBJECTS: QuestionSubject[] = [
  'language',
  'geography',
  'nature',
  'mathematics',
  'history',
];

export const QUESTION_SUBJECT_LABELS: Record<Language, Record<QuestionSubject, string>> = {
  [Language.EN]: {
    language: 'Language',
    geography: 'Geography',
    nature: 'Nature',
    mathematics: 'Mathematics',
    history: 'History',
  },
  [Language.PL]: {
    language: 'Językowe',
    geography: 'Geografia',
    nature: 'Przyroda',
    mathematics: 'Matematyka',
    history: 'Historia',
  },
  [Language.UA]: {
    language: 'Мовні',
    geography: 'Географія',
    nature: 'Природа',
    mathematics: 'Математика',
    history: 'Історія',
  },
  [Language.RU]: {
    language: 'Языковые',
    geography: 'География',
    nature: 'Природа',
    mathematics: 'Математика',
    history: 'История',
  },
  [Language.JA]: {
    language: '言語',
    geography: '地理',
    nature: '自然',
    mathematics: '数学',
    history: '歴史',
  },
};

export const isQuestionSubject = (value: unknown): value is QuestionSubject =>
  typeof value === 'string' && QUESTION_SUBJECTS.includes(value as QuestionSubject);

export const getQuestionSubjectLabel = (subject: QuestionSubject, language: Language): string =>
  QUESTION_SUBJECT_LABELS[language][subject];

export const filterQuestionsForTeacher = (
  questions: EditableQuestion[],
  filters: {
    language: Language | 'all';
    subject: QuestionSubject | 'all';
    searchText: string;
  }
): EditableQuestion[] => {
  const normalizedSearch = filters.searchText.trim().toLowerCase();

  return questions.filter((question) => {
    const matchesLanguage = filters.language === 'all' || question.language === filters.language;
    const matchesSubject = filters.subject === 'all' || question.subject === filters.subject;
    const matchesSearch = !normalizedSearch || question.question.toLowerCase().includes(normalizedSearch);

    return matchesLanguage && matchesSubject && matchesSearch;
  });
};
