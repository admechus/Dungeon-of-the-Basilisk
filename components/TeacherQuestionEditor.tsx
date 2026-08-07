import React, { useEffect, useMemo, useRef, useState } from 'react';
import ImageAssetLibrary from './ImageAssetLibrary';
import ImageAssetPicker from './ImageAssetPicker';
import QuestionBankViews from './QuestionBankViews';
import { createQuestionBankExport, mergeQuestionBanks, parseQuestionBankJson, replaceQuestionBank } from '../questionBank';
import { filterQuestionsForTeacher, getQuestionSubjectLabel, QUESTION_SUBJECTS } from '../questionSubjects';
import { normalizeQuestion, validateQuestion } from '../questionValidation';
import { resetQuestionBank, saveQuestionBank } from '../questionStorage';
import { EditableQuestion, Language, QuestionDifficulty, QuestionSubject } from '../types';
import {
  formatTeacherText,
  getTeacherEditorText,
  loadTeacherEditorUiPreferences,
  localizeTeacherEditorMessage,
  saveTeacherEditorUiPreferences,
  sortQuestionsForTeacher,
  TeacherEditorSortDirection,
  TeacherEditorSortMode,
  TeacherEditorViewMode,
} from '../teacherEditorUi';

interface TeacherQuestionEditorProps {
  questions: EditableQuestion[];
  language: Language;
  onQuestionsChange: (questions: EditableQuestion[]) => void;
  onClose: () => void;
}

const createBlankQuestion = (language: Language): EditableQuestion => ({
  id: `local-${Date.now()}`,
  language,
  question: '',
  options: ['', ''],
  correctIndex: 0,
  enabled: true,
  subject: 'language',
});

const createDuplicateQuestion = (question: EditableQuestion): EditableQuestion => ({
  ...question,
  id: `${question.id}-copy-${Date.now()}`,
});

const TeacherQuestionEditor: React.FC<TeacherQuestionEditorProps> = ({
  questions,
  language,
  onQuestionsChange,
  onClose,
}) => {
  const text = getTeacherEditorText(language);
  const [draft, setDraft] = useState<EditableQuestion>(createBlankQuestion(language));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [filterLanguage, setFilterLanguage] = useState<Language | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState<QuestionSubject | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [activeSection, setActiveSection] = useState<'questions' | 'images'>('questions');
  const [uiPreferences, setUiPreferences] = useState(() => loadTeacherEditorUiPreferences());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'replace' | 'merge'>('merge');
  const formRef = useRef<HTMLElement>(null);

  const filteredQuestions = useMemo(() => {
    return filterQuestionsForTeacher(questions, {
      language: filterLanguage,
      subject: filterSubject,
      searchText,
    });
  }, [filterLanguage, filterSubject, questions, searchText]);

  const displayedQuestions = useMemo(
    () => sortQuestionsForTeacher(filteredQuestions, uiPreferences.sortMode, uiPreferences.sortDirection),
    [filteredQuestions, uiPreferences.sortDirection, uiPreferences.sortMode]
  );

  useEffect(() => {
    saveTeacherEditorUiPreferences(uiPreferences);
  }, [uiPreferences]);

  const updateViewMode = (viewMode: TeacherEditorViewMode) => {
    setUiPreferences((current) => ({ ...current, viewMode }));
  };

  const updateSortMode = (sortMode: TeacherEditorSortMode) => {
    setUiPreferences((current) => ({ ...current, sortMode }));
  };

  const updateSortDirection = (sortDirection: TeacherEditorSortDirection) => {
    setUiPreferences((current) => ({ ...current, sortDirection }));
  };

  const persistQuestions = (nextQuestions: EditableQuestion[], message: string) => {
    onQuestionsChange(nextQuestions);
    saveQuestionBank(nextQuestions);
    setStatusText(message);
  };

  const startAdd = () => {
    setDraft(createBlankQuestion(language));
    setEditingId(null);
    setErrors([]);
  };

  const startEdit = (question: EditableQuestion) => {
    setDraft({ ...question, options: [...question.options] });
    setEditingId(question.id);
    setErrors([]);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const saveDraft = () => {
    const otherQuestions = questions.filter((question) => question.id !== editingId);
    const validation = validateQuestion(draft, otherQuestions);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const normalizedDraft = normalizeQuestion(draft);
    const nextQuestions = editingId
      ? questions.map((question) => (question.id === editingId ? normalizedDraft : question))
      : [...questions, normalizedDraft];

    persistQuestions(nextQuestions, text.saved);
    setDraft(normalizedDraft);
    setEditingId(normalizedDraft.id);
    setErrors([]);
  };

  const deleteQuestion = (questionId: string) => {
    if (!window.confirm(text.confirmDelete)) return;
    persistQuestions(
      questions.filter((question) => question.id !== questionId),
      text.deleted
    );
    if (editingId === questionId) startAdd();
  };

  const duplicateQuestion = (question: EditableQuestion) => {
    const duplicatedQuestion = createDuplicateQuestion(question);
    persistQuestions([...questions, duplicatedQuestion], text.duplicated);
    startEdit(duplicatedQuestion);
  };

  const toggleQuestion = (questionId: string) => {
    persistQuestions(
      questions.map((question) => (question.id === questionId ? { ...question, enabled: !question.enabled } : question)),
      text.updated
    );
  };

  const exportQuestions = () => {
    const payload = createQuestionBankExport(questions);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = payload.exportedAt.slice(0, 10);
    link.href = url;
    link.download = `dungeon-of-the-basilisk-questions-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusText(text.exported);
  };

  const requestImport = (mode: 'replace' | 'merge') => {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const importQuestions = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = parseQuestionBankJson(content);
      const localizedImportErrors = result.errors
        .map((error) => localizeTeacherEditorMessage(error, language))
        .join(' ');
      if (result.validQuestions.length === 0) {
        setStatusText(formatTeacherText(text.importChecked, { valid: 0, invalid: result.invalidCount, details: localizedImportErrors }));
        return;
      }

      if (importModeRef.current === 'replace') {
        if (!window.confirm(text.confirmReplace)) return;
        const nextQuestions = replaceQuestionBank(result.validQuestions);
        persistQuestions(
          nextQuestions,
            formatTeacherText(text.importChecked, { valid: result.validQuestions.length, invalid: result.invalidCount, details: text.importReplaced })
        );
        startAdd();
        return;
      }

      const mergeResult = mergeQuestionBanks(questions, result.validQuestions);
      if (!window.confirm(text.confirmMerge)) return;
      persistQuestions(
        mergeResult.questions,
        formatTeacherText(text.importChecked, {
          valid: result.validQuestions.length,
          invalid: result.invalidCount,
          details: formatTeacherText(text.importMerged, { added: mergeResult.addedCount, conflicts: mergeResult.conflictCount }),
        })
      );
      startAdd();
    };
    reader.readAsText(file);
  };

  const resetToBuiltIns = () => {
    if (!window.confirm(text.confirmReset)) return;
    const builtInQuestions = resetQuestionBank();
    onQuestionsChange(builtInQuestions);
    setDraft(createBlankQuestion(language));
    setEditingId(null);
    setStatusText(text.restored);
  };

  const updateOption = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    }));
  };

  const updateOptionImage = (index: number, assetId: string | null) => {
    setDraft((current) => {
      const nextOptionImageIds = Array.from({ length: current.options.length }, (_, optionIndex) =>
        current.optionImageIds?.[optionIndex] ?? null
      );
      nextOptionImageIds[index] = assetId;

      return {
        ...current,
        optionImageIds: nextOptionImageIds,
      };
    });
  };

  const removeOption = (index: number) => {
    setDraft((current) => {
      const nextOptions = current.options.filter((_, optionIndex) => optionIndex !== index);
      const nextOptionImageIds = current.optionImageIds?.filter((_, optionIndex) => optionIndex !== index);
      const nextCorrectIndex = Math.min(current.correctIndex, Math.max(0, nextOptions.length - 1));
      return {
        ...current,
        options: nextOptions,
        optionImageIds: nextOptionImageIds,
        correctIndex: nextCorrectIndex,
      };
    });
  };

  const updateDifficulty = (value: string) => {
    setDraft((current) => ({
      ...current,
      difficulty: value === '' ? undefined : Number(value) as QuestionDifficulty,
    }));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-4 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-stone-800 pb-4">
          <h1 className="text-3xl dungeon-font text-amber-500">{text.title}</h1>
          <button onClick={onClose} className="vn-button px-4 py-2">{text.back}</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveSection('questions')}
            className={`vn-button px-4 py-2 ${activeSection === 'questions' ? 'border-amber-500 text-amber-100' : ''}`}
          >
            {text.questionsTab}
          </button>
          <button
            onClick={() => setActiveSection('images')}
            className={`vn-button px-4 py-2 ${activeSection === 'images' ? 'border-amber-500 text-amber-100' : ''}`}
          >
            {text.imagesTab}
          </button>
        </div>

        {activeSection === 'images' && <ImageAssetLibrary language={language} text={text} />}

        {activeSection === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-4 items-start">
            <section className="border border-stone-800 bg-black/40 min-w-0">
              <div className="sticky top-0 z-10 bg-stone-950/95 border-b border-stone-800 p-4">
                <div className="flex flex-col xl:flex-row gap-2 mb-3">
                  <label className="sr-only" htmlFor="teacher-question-search">{text.search}</label>
                  <input
                    id="teacher-question-search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={text.search}
                    className="flex-1 bg-stone-900 border border-stone-700 px-3 py-2 text-sm outline-none focus:border-amber-600"
                  />
                  <select
                    value={filterLanguage}
                    aria-label={text.allLanguages}
                    onChange={(event) => setFilterLanguage(event.target.value === 'all' ? 'all' : event.target.value as Language)}
                    className="bg-stone-900 border border-stone-700 px-3 py-2 text-sm outline-none focus:border-amber-600"
                  >
                    <option value="all">{text.allLanguages}</option>
                    {Object.values(Language).map((optionLanguage) => (
                      <option key={optionLanguage} value={optionLanguage}>{optionLanguage}</option>
                    ))}
                  </select>
                  <select
                    value={filterSubject}
                    aria-label={text.allSubjects}
                    onChange={(event) => setFilterSubject(event.target.value === 'all' ? 'all' : event.target.value as QuestionSubject)}
                    className="bg-stone-900 border border-stone-700 px-3 py-2 text-sm outline-none focus:border-amber-600"
                  >
                    <option value="all">{text.allSubjects}</option>
                    {QUESTION_SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>{getQuestionSubjectLabel(subject, language)}</option>
                    ))}
                  </select>
                  <button onClick={startAdd} className="vn-button px-4 py-2">{text.add}</button>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateViewMode('list')} className={`vn-button px-3 py-2 text-xs ${uiPreferences.viewMode === 'list' ? 'border-amber-500 text-amber-100' : ''}`}>{text.viewList}</button>
                    <button onClick={() => updateViewMode('table')} className={`vn-button px-3 py-2 text-xs ${uiPreferences.viewMode === 'table' ? 'border-amber-500 text-amber-100' : ''}`}>{text.viewTable}</button>
                    <button onClick={() => updateViewMode('grid')} className={`vn-button px-3 py-2 text-xs ${uiPreferences.viewMode === 'grid' ? 'border-amber-500 text-amber-100' : ''}`}>{text.viewGrid}</button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs uppercase tracking-widest text-stone-500" htmlFor="teacher-sort-mode">{text.sortBy}</label>
                    <select
                      id="teacher-sort-mode"
                      value={uiPreferences.sortMode}
                      onChange={(event) => updateSortMode(event.target.value as TeacherEditorSortMode)}
                      className="bg-stone-900 border border-stone-700 px-3 py-2 text-sm outline-none focus:border-amber-600"
                    >
                      <option value="bank">{text.sortBank}</option>
                      <option value="question">{text.sortQuestion}</option>
                      <option value="language">{text.sortLanguage}</option>
                      <option value="subject">{text.sortSubject}</option>
                      <option value="grade">{text.sortGrade}</option>
                    </select>
                    <select
                      value={uiPreferences.sortDirection}
                      aria-label={text.sortBy}
                      onChange={(event) => updateSortDirection(event.target.value as TeacherEditorSortDirection)}
                      className="bg-stone-900 border border-stone-700 px-3 py-2 text-sm outline-none focus:border-amber-600"
                    >
                      <option value="asc">{text.ascending}</option>
                      <option value="desc">{text.descending}</option>
                    </select>
                    <span className="text-xs uppercase tracking-widest text-stone-500">
                      {formatTeacherText(text.shownCount, { shown: displayedQuestions.length, total: questions.length })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 max-h-[720px] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
                {displayedQuestions.length === 0 ? (
                  <p className="text-sm text-stone-500 border border-stone-800 p-4">{text.empty}</p>
                ) : (
                  <QuestionBankViews
                    questions={displayedQuestions}
                    language={language}
                    editingId={editingId}
                    text={text}
                    viewMode={uiPreferences.viewMode}
                    onEdit={startEdit}
                    onDuplicate={duplicateQuestion}
                    onDelete={deleteQuestion}
                    onToggle={toggleQuestion}
                  />
                )}
              </div>
            </section>

            <aside ref={formRef} className="border border-stone-800 bg-black/50 p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={exportQuestions} className="vn-button px-3 py-2 text-xs">{text.exportJson}</button>
                <button onClick={() => requestImport('replace')} className="vn-button px-3 py-2 text-xs">{text.importReplace}</button>
                <button onClick={() => requestImport('merge')} className="vn-button px-3 py-2 text-xs">{text.importMerge}</button>
                <button onClick={resetToBuiltIns} className="vn-button px-3 py-2 text-xs">{text.reset}</button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importQuestions(file);
                    event.currentTarget.value = '';
                  }}
                />
              </div>

              {statusText && <p className="text-sm text-amber-300 border border-amber-900/50 bg-amber-950/20 p-2 mb-4">{statusText}</p>}
              {errors.length > 0 && (
              <div className="text-sm text-red-300 border border-red-900/60 bg-red-950/30 p-2 mb-4">
                  {errors.map((error) => <p key={error}>{localizeTeacherEditorMessage(error, language)}</p>)}
              </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-stone-500">
                  {text.id}
                  <input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                </label>
                <label className="block text-xs uppercase tracking-widest text-stone-500">
                  {text.sortLanguage}
                  <select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value as Language })} className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200">
                    {Object.values(Language).map((optionLanguage) => (
                      <option key={optionLanguage} value={optionLanguage}>{optionLanguage}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs uppercase tracking-widest text-stone-500">
                  {text.question}
                  <textarea value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} className="mt-1 w-full min-h-24 bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                </label>
                <ImageAssetPicker
                  label={text.questionImage}
                  value={draft.questionImageId ?? null}
                  onChange={(assetId) => setDraft({ ...draft, questionImageId: assetId ?? undefined })}
                  text={text}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-widest text-stone-500">{text.answers}</span>
                    <button onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })} className="vn-button px-2 py-1 text-xs">{text.addOption}</button>
                  </div>
                  <div className="space-y-2">
                    {draft.options.map((option, index) => (
                      <div key={index} className="border border-stone-800 bg-stone-950/50 p-2">
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                          <input value={option} onChange={(event) => updateOption(index, event.target.value)} aria-label={`${text.answers} ${index + 1}`} className="flex-1 bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                          <button onClick={() => setDraft({ ...draft, correctIndex: index })} className={`border px-3 py-2 text-sm ${draft.correctIndex === index ? 'border-amber-500 text-amber-200' : 'border-stone-700 text-stone-500'}`}>{text.correct}</button>
                          <button onClick={() => removeOption(index)} className="vn-button px-3 py-2 text-xs">{text.delete}</button>
                        </div>
                        <ImageAssetPicker
                          label={`${text.optionImage} ${index + 1}`}
                          value={draft.optionImageIds?.[index] ?? null}
                          onChange={(assetId) => updateOptionImage(index, assetId)}
                          text={text}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-stone-300">
                  <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                  {text.enabledOnly}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block text-xs uppercase tracking-widest text-stone-500">
                    {text.subject}
                    <select
                      value={draft.subject ?? 'language'}
                      onChange={(event) => setDraft({ ...draft, subject: event.target.value as QuestionSubject })}
                      className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200"
                    >
                      {QUESTION_SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>{getQuestionSubjectLabel(subject, language)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs uppercase tracking-widest text-stone-500">
                    {text.topic}
                    <input value={draft.topic ?? ''} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                  </label>
                  <label className="block text-xs uppercase tracking-widest text-stone-500">
                    {text.grade}
                    <input value={draft.grade ?? ''} onChange={(event) => setDraft({ ...draft, grade: event.target.value === '' ? undefined : Number(event.target.value) })} type="number" min="1" className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                  </label>
                  <label className="block text-xs uppercase tracking-widest text-stone-500">
                    {text.difficulty}
                    <select value={draft.difficulty ?? ''} onChange={(event) => updateDifficulty(event.target.value)} className="mt-1 w-full bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200">
                      <option value=""></option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </label>
                </div>
                <label className="block text-xs uppercase tracking-widest text-stone-500">
                  {text.explanation}
                  <textarea value={draft.explanation ?? ''} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} className="mt-1 w-full min-h-20 bg-stone-900 border border-stone-700 px-3 py-2 text-sm text-stone-200" />
                </label>
                <ImageAssetPicker
                  label={text.explanationImage}
                  value={draft.explanationImageId ?? null}
                  onChange={(assetId) => setDraft({ ...draft, explanationImageId: assetId ?? undefined })}
                  text={text}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={saveDraft} className="vn-button px-4 py-3">{text.save}</button>
                  <button onClick={startAdd} className="vn-button px-4 py-3">{text.cancel}</button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuestionEditor;
