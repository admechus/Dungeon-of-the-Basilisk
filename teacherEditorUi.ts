import { EditableQuestion, Language, QuestionSubject } from './types';
import { getQuestionSubjectLabel } from './questionSubjects';

export type TeacherEditorViewMode = 'list' | 'table' | 'grid';
export type TeacherEditorSortMode = 'bank' | 'question' | 'language' | 'subject' | 'grade';
export type TeacherEditorSortDirection = 'asc' | 'desc';

type TeacherEditorSystemMessage =
  | 'Question id is required.'
  | 'Question id must be unique.'
  | 'Question language is not supported.'
  | 'Question text is required.'
  | 'At least two answer options are required.'
  | 'Answer options cannot be empty.'
  | 'Correct answer must point to an existing option.'
  | 'Grade must be a positive integer.'
  | 'Difficulty must be 1, 2, or 3.'
  | 'Question subject is not supported.'
  | 'Question image id must be a string.'
  | 'Explanation image id must be a string.'
  | 'Option image ids must be strings or null.'
  | 'Import format is not supported.'
  | 'Import version is not supported.'
  | 'Import file must contain a questions array.'
  | 'Unsupported image format. Use PNG, JPEG, or WebP.'
  | 'Image file is larger than 2 MB.'
  | 'Image dimensions could not be read.'
  | 'Image width is larger than 2048 pixels.'
  | 'Image height is larger than 2048 pixels.'
  | 'Image name is required.'
  | 'Image file could not be decoded.'
  | 'Image file is corrupted or cannot be decoded.';

const TEACHER_EDITOR_SYSTEM_MESSAGES: readonly TeacherEditorSystemMessage[] = [
  'Question id is required.',
  'Question id must be unique.',
  'Question language is not supported.',
  'Question text is required.',
  'At least two answer options are required.',
  'Answer options cannot be empty.',
  'Correct answer must point to an existing option.',
  'Grade must be a positive integer.',
  'Difficulty must be 1, 2, or 3.',
  'Question subject is not supported.',
  'Question image id must be a string.',
  'Explanation image id must be a string.',
  'Option image ids must be strings or null.',
  'Import format is not supported.',
  'Import version is not supported.',
  'Import file must contain a questions array.',
  'Unsupported image format. Use PNG, JPEG, or WebP.',
  'Image file is larger than 2 MB.',
  'Image dimensions could not be read.',
  'Image width is larger than 2048 pixels.',
  'Image height is larger than 2048 pixels.',
  'Image name is required.',
  'Image file could not be decoded.',
  'Image file is corrupted or cannot be decoded.',
];

const isTeacherEditorSystemMessage = (message: string): message is TeacherEditorSystemMessage =>
  (TEACHER_EDITOR_SYSTEM_MESSAGES as readonly string[]).includes(message);

export interface TeacherEditorUiPreferences {
  viewMode: TeacherEditorViewMode;
  sortMode: TeacherEditorSortMode;
  sortDirection: TeacherEditorSortDirection;
}

export interface TeacherEditorUiStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const TEACHER_EDITOR_UI_STORAGE_KEY = 'dungeon-of-the-basilisk.teacher-editor-ui.v1';

export const DEFAULT_TEACHER_EDITOR_UI_PREFERENCES: TeacherEditorUiPreferences = {
  viewMode: 'list',
  sortMode: 'bank',
  sortDirection: 'asc',
};

export interface TeacherEditorText {
  title: string;
  questionsTab: string;
  imagesTab: string;
  back: string;
  add: string;
  duplicate: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  exportJson: string;
  importReplace: string;
  importMerge: string;
  reset: string;
  search: string;
  allLanguages: string;
  allSubjects: string;
  enabledOnly: string;
  disabled: string;
  enabled: string;
  id: string;
  question: string;
  answers: string;
  addOption: string;
  correct: string;
  subject: string;
  topic: string;
  grade: string;
  difficulty: string;
  explanation: string;
  questionImage: string;
  optionImage: string;
  explanationImage: string;
  empty: string;
  confirmDelete: string;
  confirmReset: string;
  confirmReplace: string;
  confirmMerge: string;
  saved: string;
  deleted: string;
  duplicated: string;
  updated: string;
  exported: string;
  restored: string;
  importChecked: string;
  importReplaced: string;
  importMerged: string;
  viewList: string;
  viewTable: string;
  viewGrid: string;
  sortBy: string;
  sortBank: string;
  sortQuestion: string;
  sortLanguage: string;
  sortSubject: string;
  sortGrade: string;
  ascending: string;
  descending: string;
  shownCount: string;
  tableImages: string;
  tableActions: string;
  optionsCount: string;
  hasImages: string;
  noImages: string;
  missingImage: string;
  imageLibraryUnavailable: string;
  imagePickerEmpty: string;
  clear: string;
  selected: string;
  loadingImage: string;
  imageUnavailable: string;
  uploadImages: string;
  refresh: string;
  clearLibrary: string;
  openPreview: string;
  close: string;
  imageLibraryEmpty: string;
  imageRequirements: string;
  imageSaveFailed: string;
  emptyQuestion: string;
  confirmDeleteImage: string;
  confirmClearImages: string;
  imagesUploaded: string;
  imageRenamed: string;
  imageDeleted: string;
  imagesCleared: string;
}

const EN: TeacherEditorText = {
  title: 'Teacher Question Bank',
  questionsTab: 'Questions',
  imagesTab: 'Images',
  back: 'Back to game',
  add: 'Add question',
  duplicate: 'Duplicate',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save changes',
  cancel: 'Cancel',
  exportJson: 'Export JSON',
  importReplace: 'Import replace',
  importMerge: 'Import merge',
  reset: 'Restore defaults',
  search: 'Search question text',
  allLanguages: 'All languages',
  allSubjects: 'All subjects',
  enabledOnly: 'Enabled',
  disabled: 'Disabled',
  enabled: 'Enabled',
  id: 'ID',
  question: 'Question',
  answers: 'Answers',
  addOption: 'Add option',
  correct: 'Correct answer',
  subject: 'Subject',
  topic: 'Topic',
  grade: 'Grade',
  difficulty: 'Difficulty',
  explanation: 'Explanation',
  questionImage: 'Question image',
  optionImage: 'Option image',
  explanationImage: 'Explanation image',
  empty: 'No questions match the current filters.',
  confirmDelete: 'Delete this question?',
  confirmReset: 'Replace the local question bank with built-in questions?',
  confirmReplace: 'Replace the current question bank with imported questions?',
  confirmMerge: 'Merge imported questions into the current question bank and skip conflicts?',
  saved: 'Question bank saved locally.',
  deleted: 'Question deleted.',
  duplicated: 'Question duplicated.',
  updated: 'Question updated.',
  exported: 'Question bank exported.',
  restored: 'Built-in questions restored.',
  importChecked: 'Import checked: {valid} valid, {invalid} invalid. {details}',
  importReplaced: 'Current bank replaced.',
  importMerged: 'Merged {added}; skipped {conflicts} conflicts.',
  viewList: 'List',
  viewTable: 'Table',
  viewGrid: 'Grid',
  sortBy: 'Sort by',
  sortBank: 'Bank order',
  sortQuestion: 'Question',
  sortLanguage: 'Language',
  sortSubject: 'Subject',
  sortGrade: 'Grade',
  ascending: 'Ascending',
  descending: 'Descending',
  shownCount: 'Shown {shown} of {total}',
  tableImages: 'Images',
  tableActions: 'Actions',
  optionsCount: '{count} answers',
  hasImages: 'Images',
  noImages: 'No images',
  missingImage: 'Selected image is missing.',
  imageLibraryUnavailable: 'Image library is unavailable.',
  imagePickerEmpty: 'No images in the library. Add them on the Images tab.',
  clear: 'Clear',
  selected: 'Selected: {name}',
  loadingImage: 'Loading image',
  imageUnavailable: 'Image unavailable',
  uploadImages: 'Upload images',
  refresh: 'Refresh',
  clearLibrary: 'Clear library',
  openPreview: 'Open preview',
  close: 'Close',
  imageLibraryEmpty: 'No images saved yet.',
  imageRequirements: 'PNG, JPEG, WebP. Max {size} and {dimension}px.',
  imageSaveFailed: 'Image could not be saved.',
  emptyQuestion: '(empty question)',
  confirmDeleteImage: 'Delete this image asset?',
  confirmClearImages: 'Delete all image assets from the local library?',
  imagesUploaded: 'Uploaded {count} image(s).',
  imageRenamed: 'Image renamed.',
  imageDeleted: 'Image deleted.',
  imagesCleared: 'Image library cleared.',
};

export const TEACHER_EDITOR_TEXT: Record<Language, TeacherEditorText> = {
  [Language.EN]: EN,
  [Language.PL]: {
    ...EN,
    title: 'Bank pytań nauczyciela',
    questionsTab: 'Pytania',
    imagesTab: 'Obrazy',
    back: 'Wróć do gry',
    add: 'Dodaj pytanie',
    duplicate: 'Duplikuj',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz zmiany',
    cancel: 'Anuluj',
    exportJson: 'Eksport JSON',
    importReplace: 'Import zastąp',
    importMerge: 'Import połącz',
    reset: 'Przywróć domyślne',
    search: 'Szukaj w treści pytania',
    allLanguages: 'Wszystkie języki',
    allSubjects: 'Wszystkie przedmioty',
    question: 'Pytanie',
    answers: 'Odpowiedzi',
    correct: 'Poprawna odpowiedź',
    subject: 'Przedmiot',
    topic: 'Temat',
    grade: 'Klasa',
    difficulty: 'Trudność',
    explanation: 'Wyjaśnienie',
    empty: 'Brak pytań dla wybranych filtrów.',
    viewList: 'Lista',
    viewTable: 'Tabela',
    viewGrid: 'Siatka',
    sortBy: 'Sortuj według',
    shownCount: 'Pokazano {shown} z {total}',
    imageRequirements: 'PNG, JPEG, WebP. Maks. {size} i {dimension}px.',
    imageSaveFailed: 'Nie mozna zapisac obrazu.',
    emptyQuestion: '(puste pytanie)',
  },
  [Language.UA]: {
    ...EN,
    title: 'Банк питань учителя',
    questionsTab: 'Питання',
    imagesTab: 'Зображення',
    back: 'Назад до гри',
    add: 'Додати питання',
    save: 'Зберегти зміни',
    cancel: 'Скасувати',
    delete: 'Видалити',
    duplicate: 'Дублювати',
    search: 'Пошук у тексті питання',
    allLanguages: 'Усі мови',
    allSubjects: 'Усі предмети',
    question: 'Питання',
    answers: 'Відповіді',
    correct: 'Правильна відповідь',
    subject: 'Предмет',
    topic: 'Тема',
    grade: 'Клас',
    difficulty: 'Складність',
    explanation: 'Пояснення',
    empty: 'Немає питань для вибраних фільтрів.',
    viewList: 'Список',
    viewTable: 'Таблиця',
    viewGrid: 'Сітка',
    sortBy: 'Сортувати за',
    shownCount: 'Показано {shown} з {total}',
    imageRequirements: 'PNG, JPEG, WebP. Макс. {size} і {dimension}px.',
    imageSaveFailed: 'Не вдалося зберегти зображення.',
    emptyQuestion: '(порожнє питання)',
  },
  [Language.RU]: {
    ...EN,
    title: 'Банк вопросов учителя',
    questionsTab: 'Вопросы',
    imagesTab: 'Изображения',
    back: 'Назад к игре',
    add: 'Добавить вопрос',
    save: 'Сохранить изменения',
    cancel: 'Отмена',
    delete: 'Удалить',
    duplicate: 'Дублировать',
    search: 'Поиск по тексту вопроса',
    allLanguages: 'Все языки',
    allSubjects: 'Все предметы',
    question: 'Вопрос',
    answers: 'Ответы',
    correct: 'Правильный ответ',
    subject: 'Предмет',
    topic: 'Тема',
    grade: 'Класс',
    difficulty: 'Сложность',
    explanation: 'Пояснение',
    empty: 'Нет вопросов для выбранных фильтров.',
    viewList: 'Список',
    viewTable: 'Таблица',
    viewGrid: 'Сетка',
    sortBy: 'Сортировать по',
    shownCount: 'Показано {shown} из {total}',
    imageRequirements: 'PNG, JPEG, WebP. Макс. {size} и {dimension}px.',
    imageSaveFailed: 'Не удалось сохранить изображение.',
    emptyQuestion: '(пустой вопрос)',
  },
  [Language.JA]: {
    ...EN,
    title: '教師用質問バンク',
    questionsTab: '質問',
    imagesTab: '画像',
    back: 'ゲームに戻る',
    add: '質問を追加',
    save: '変更を保存',
    cancel: 'キャンセル',
    delete: '削除',
    duplicate: '複製',
    search: '質問文を検索',
    allLanguages: 'すべての言語',
    allSubjects: 'すべての科目',
    question: '質問',
    answers: '回答',
    correct: '正解',
    subject: '科目',
    topic: 'トピック',
    grade: '学年',
    difficulty: '難易度',
    explanation: '説明',
    empty: '選択した条件に一致する質問はありません。',
    viewList: 'リスト',
    viewTable: '表',
    viewGrid: 'グリッド',
    sortBy: '並び替え',
    shownCount: '{total}件中{shown}件を表示',
    imageRequirements: 'PNG, JPEG, WebP. 最大 {size}、{dimension}px。',
    imageSaveFailed: '画像を保存できませんでした。',
    emptyQuestion: '(空の質問)',
  },
};

const EN_SYSTEM_MESSAGES: Record<TeacherEditorSystemMessage, string> = {
  'Question id is required.': 'Question id is required.',
  'Question id must be unique.': 'Question id must be unique.',
  'Question language is not supported.': 'Question language is not supported.',
  'Question text is required.': 'Question text is required.',
  'At least two answer options are required.': 'At least two answer options are required.',
  'Answer options cannot be empty.': 'Answer options cannot be empty.',
  'Correct answer must point to an existing option.': 'Correct answer must point to an existing option.',
  'Grade must be a positive integer.': 'Grade must be a positive integer.',
  'Difficulty must be 1, 2, or 3.': 'Difficulty must be 1, 2, or 3.',
  'Question subject is not supported.': 'Question subject is not supported.',
  'Question image id must be a string.': 'Question image id must be a string.',
  'Explanation image id must be a string.': 'Explanation image id must be a string.',
  'Option image ids must be strings or null.': 'Option image ids must be strings or null.',
  'Import format is not supported.': 'Import format is not supported.',
  'Import version is not supported.': 'Import version is not supported.',
  'Import file must contain a questions array.': 'Import file must contain a questions array.',
  'Unsupported image format. Use PNG, JPEG, or WebP.': 'Unsupported image format. Use PNG, JPEG, or WebP.',
  'Image file is larger than 2 MB.': 'Image file is larger than 2 MB.',
  'Image dimensions could not be read.': 'Image dimensions could not be read.',
  'Image width is larger than 2048 pixels.': 'Image width is larger than 2048 pixels.',
  'Image height is larger than 2048 pixels.': 'Image height is larger than 2048 pixels.',
  'Image name is required.': 'Image name is required.',
  'Image file could not be decoded.': 'Image file could not be decoded.',
  'Image file is corrupted or cannot be decoded.': 'Image file is corrupted or cannot be decoded.',
};

const LOCALIZED_SYSTEM_MESSAGES: Record<Language, Partial<Record<TeacherEditorSystemMessage, string>>> = {
  [Language.EN]: EN_SYSTEM_MESSAGES,
  [Language.PL]: {
    'Question id is required.': 'ID pytania jest wymagane.',
    'Question id must be unique.': 'ID pytania musi byc unikalne.',
    'Question language is not supported.': 'Jezyk pytania nie jest obslugiwany.',
    'Question text is required.': 'Tresc pytania jest wymagana.',
    'At least two answer options are required.': 'Wymagane sa co najmniej dwie odpowiedzi.',
    'Answer options cannot be empty.': 'Odpowiedzi nie moga byc puste.',
    'Correct answer must point to an existing option.': 'Poprawna odpowiedz musi wskazywac istniejaca opcje.',
    'Grade must be a positive integer.': 'Klasa musi byc dodatnia liczba calkowita.',
    'Difficulty must be 1, 2, or 3.': 'Trudnosc musi wynosic 1, 2 albo 3.',
    'Question subject is not supported.': 'Przedmiot pytania nie jest obslugiwany.',
    'Question image id must be a string.': 'ID obrazu pytania musi byc tekstem.',
    'Explanation image id must be a string.': 'ID obrazu wyjasnienia musi byc tekstem.',
    'Option image ids must be strings or null.': 'ID obrazow odpowiedzi musza byc tekstem albo null.',
    'Import format is not supported.': 'Format importu nie jest obslugiwany.',
    'Import version is not supported.': 'Wersja importu nie jest obslugiwana.',
    'Import file must contain a questions array.': 'Plik importu musi zawierac tablice questions.',
    'Unsupported image format. Use PNG, JPEG, or WebP.': 'Nieobslugiwany format obrazu. Uzyj PNG, JPEG albo WebP.',
    'Image file is larger than 2 MB.': 'Plik obrazu jest wiekszy niz 2 MB.',
    'Image dimensions could not be read.': 'Nie mozna odczytac wymiarow obrazu.',
    'Image width is larger than 2048 pixels.': 'Szerokosc obrazu przekracza 2048 pikseli.',
    'Image height is larger than 2048 pixels.': 'Wysokosc obrazu przekracza 2048 pikseli.',
    'Image name is required.': 'Nazwa obrazu jest wymagana.',
    'Image file could not be decoded.': 'Nie mozna odczytac pliku obrazu.',
    'Image file is corrupted or cannot be decoded.': 'Plik obrazu jest uszkodzony albo nie mozna go odczytac.',
  },
  [Language.UA]: {
    'Question id is required.': 'ID питання є обов’язковим.',
    'Question id must be unique.': 'ID питання має бути унікальним.',
    'Question language is not supported.': 'Мова питання не підтримується.',
    'Question text is required.': 'Текст питання є обов’язковим.',
    'At least two answer options are required.': 'Потрібно щонайменше два варіанти відповіді.',
    'Answer options cannot be empty.': 'Варіанти відповіді не можуть бути порожніми.',
    'Correct answer must point to an existing option.': 'Правильна відповідь має вказувати на наявний варіант.',
    'Grade must be a positive integer.': 'Клас має бути додатним цілим числом.',
    'Difficulty must be 1, 2, or 3.': 'Складність має бути 1, 2 або 3.',
    'Question subject is not supported.': 'Предмет питання не підтримується.',
    'Question image id must be a string.': 'ID зображення питання має бути рядком.',
    'Explanation image id must be a string.': 'ID зображення пояснення має бути рядком.',
    'Option image ids must be strings or null.': 'ID зображень варіантів мають бути рядками або null.',
    'Import format is not supported.': 'Формат імпорту не підтримується.',
    'Import version is not supported.': 'Версія імпорту не підтримується.',
    'Import file must contain a questions array.': 'Файл імпорту має містити масив questions.',
    'Unsupported image format. Use PNG, JPEG, or WebP.': 'Формат зображення не підтримується. Використайте PNG, JPEG або WebP.',
    'Image file is larger than 2 MB.': 'Файл зображення більший за 2 MB.',
    'Image dimensions could not be read.': 'Не вдалося прочитати розміри зображення.',
    'Image width is larger than 2048 pixels.': 'Ширина зображення перевищує 2048 пікселів.',
    'Image height is larger than 2048 pixels.': 'Висота зображення перевищує 2048 пікселів.',
    'Image name is required.': 'Назва зображення є обов’язковою.',
    'Image file could not be decoded.': 'Не вдалося декодувати файл зображення.',
    'Image file is corrupted or cannot be decoded.': 'Файл зображення пошкоджений або його не вдалося декодувати.',
  },
  [Language.RU]: {
    'Question id is required.': 'ID вопроса обязателен.',
    'Question id must be unique.': 'ID вопроса должен быть уникальным.',
    'Question language is not supported.': 'Язык вопроса не поддерживается.',
    'Question text is required.': 'Текст вопроса обязателен.',
    'At least two answer options are required.': 'Нужно минимум два варианта ответа.',
    'Answer options cannot be empty.': 'Варианты ответа не могут быть пустыми.',
    'Correct answer must point to an existing option.': 'Правильный ответ должен указывать на существующий вариант.',
    'Grade must be a positive integer.': 'Класс должен быть положительным целым числом.',
    'Difficulty must be 1, 2, or 3.': 'Сложность должна быть 1, 2 или 3.',
    'Question subject is not supported.': 'Предмет вопроса не поддерживается.',
    'Question image id must be a string.': 'ID изображения вопроса должен быть строкой.',
    'Explanation image id must be a string.': 'ID изображения пояснения должен быть строкой.',
    'Option image ids must be strings or null.': 'ID изображений вариантов должны быть строками или null.',
    'Import format is not supported.': 'Формат импорта не поддерживается.',
    'Import version is not supported.': 'Версия импорта не поддерживается.',
    'Import file must contain a questions array.': 'Файл импорта должен содержать массив questions.',
    'Unsupported image format. Use PNG, JPEG, or WebP.': 'Формат изображения не поддерживается. Используйте PNG, JPEG или WebP.',
    'Image file is larger than 2 MB.': 'Файл изображения больше 2 MB.',
    'Image dimensions could not be read.': 'Не удалось прочитать размеры изображения.',
    'Image width is larger than 2048 pixels.': 'Ширина изображения больше 2048 пикселей.',
    'Image height is larger than 2048 pixels.': 'Высота изображения больше 2048 пикселей.',
    'Image name is required.': 'Название изображения обязательно.',
    'Image file could not be decoded.': 'Не удалось декодировать файл изображения.',
    'Image file is corrupted or cannot be decoded.': 'Файл изображения повреждён или не декодируется.',
  },
  [Language.JA]: {
    'Question id is required.': '質問IDは必須です。',
    'Question id must be unique.': '質問IDは一意である必要があります。',
    'Question language is not supported.': '質問の言語はサポートされていません。',
    'Question text is required.': '質問文は必須です。',
    'At least two answer options are required.': '回答は少なくとも2つ必要です。',
    'Answer options cannot be empty.': '回答を空にすることはできません。',
    'Correct answer must point to an existing option.': '正解は既存の回答を指す必要があります。',
    'Grade must be a positive integer.': '学年は正の整数である必要があります。',
    'Difficulty must be 1, 2, or 3.': '難易度は1、2、3のいずれかです。',
    'Question subject is not supported.': '質問の科目はサポートされていません。',
    'Question image id must be a string.': '質問画像IDは文字列である必要があります。',
    'Explanation image id must be a string.': '解説画像IDは文字列である必要があります。',
    'Option image ids must be strings or null.': '回答画像IDは文字列またはnullである必要があります。',
    'Import format is not supported.': 'インポート形式はサポートされていません。',
    'Import version is not supported.': 'インポートバージョンはサポートされていません。',
    'Import file must contain a questions array.': 'インポートファイルにはquestions配列が必要です。',
    'Unsupported image format. Use PNG, JPEG, or WebP.': '画像形式はサポートされていません。PNG、JPEG、WebPを使用してください。',
    'Image file is larger than 2 MB.': '画像ファイルが2 MBを超えています。',
    'Image dimensions could not be read.': '画像サイズを読み取れませんでした。',
    'Image width is larger than 2048 pixels.': '画像の幅が2048ピクセルを超えています。',
    'Image height is larger than 2048 pixels.': '画像の高さが2048ピクセルを超えています。',
    'Image name is required.': '画像名は必須です。',
    'Image file could not be decoded.': '画像ファイルをデコードできませんでした。',
    'Image file is corrupted or cannot be decoded.': '画像ファイルが破損しているか、デコードできません。',
  },
};

export const getTeacherEditorText = (language: Language): TeacherEditorText =>
  TEACHER_EDITOR_TEXT[language];

export const localizeTeacherEditorMessage = (message: string, language: Language): string => {
  if (isTeacherEditorSystemMessage(message)) {
    return LOCALIZED_SYSTEM_MESSAGES[language][message] ?? EN_SYSTEM_MESSAGES[message];
  }

  return TEACHER_EDITOR_SYSTEM_MESSAGES.reduce((localizedMessage, systemMessage) => {
    const localizedSystemMessage = LOCALIZED_SYSTEM_MESSAGES[language][systemMessage] ?? EN_SYSTEM_MESSAGES[systemMessage];
    return localizedMessage.replaceAll(systemMessage, localizedSystemMessage);
  }, message);
};

export const formatTeacherText = (
  template: string,
  values: Record<string, string | number>
): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

const isViewMode = (value: unknown): value is TeacherEditorViewMode =>
  value === 'list' || value === 'table' || value === 'grid';

const isSortMode = (value: unknown): value is TeacherEditorSortMode =>
  value === 'bank' || value === 'question' || value === 'language' || value === 'subject' || value === 'grade';

const isSortDirection = (value: unknown): value is TeacherEditorSortDirection =>
  value === 'asc' || value === 'desc';

export const loadTeacherEditorUiPreferences = (
  storage: TeacherEditorUiStorage | undefined = globalThis.localStorage
): TeacherEditorUiPreferences => {
  if (!storage) return DEFAULT_TEACHER_EDITOR_UI_PREFERENCES;

  try {
    const stored = storage.getItem(TEACHER_EDITOR_UI_STORAGE_KEY);
    if (!stored) return DEFAULT_TEACHER_EDITOR_UI_PREFERENCES;
    const parsed = JSON.parse(stored) as Partial<TeacherEditorUiPreferences>;

    return {
      viewMode: isViewMode(parsed.viewMode) ? parsed.viewMode : DEFAULT_TEACHER_EDITOR_UI_PREFERENCES.viewMode,
      sortMode: isSortMode(parsed.sortMode) ? parsed.sortMode : DEFAULT_TEACHER_EDITOR_UI_PREFERENCES.sortMode,
      sortDirection: isSortDirection(parsed.sortDirection) ? parsed.sortDirection : DEFAULT_TEACHER_EDITOR_UI_PREFERENCES.sortDirection,
    };
  } catch {
    return DEFAULT_TEACHER_EDITOR_UI_PREFERENCES;
  }
};

export const saveTeacherEditorUiPreferences = (
  preferences: TeacherEditorUiPreferences,
  storage: TeacherEditorUiStorage | undefined = globalThis.localStorage
): boolean => {
  if (!storage) return false;

  try {
    storage.setItem(TEACHER_EDITOR_UI_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
};

const compareText = (left: string | undefined, right: string | undefined) =>
  (left ?? '').localeCompare(right ?? '');

const compareNumber = (left: number | undefined, right: number | undefined) =>
  (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);

export const sortQuestionsForTeacher = (
  questions: EditableQuestion[],
  sortMode: TeacherEditorSortMode,
  sortDirection: TeacherEditorSortDirection
): EditableQuestion[] => {
  if (sortMode === 'bank') return [...questions];

  const multiplier = sortDirection === 'asc' ? 1 : -1;
  return [...questions].sort((left, right) => {
    if (sortMode === 'question') return compareText(left.question, right.question) * multiplier;
    if (sortMode === 'language') return compareText(left.language, right.language) * multiplier;
    if (sortMode === 'subject') return compareText(left.subject, right.subject) * multiplier;
    return compareNumber(left.grade, right.grade) * multiplier;
  });
};

export const getQuestionImageSummary = (question: EditableQuestion): boolean =>
  Boolean(
    question.questionImageId ||
    question.explanationImageId ||
    question.optionImageIds?.some((imageId) => Boolean(imageId))
  );

export const getQuestionSubjectDisplay = (question: EditableQuestion, language: Language): string =>
  question.subject ? getQuestionSubjectLabel(question.subject, language) : '';
