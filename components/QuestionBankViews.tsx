import React from 'react';
import { getQuestionSubjectLabel } from '../questionSubjects';
import { EditableQuestion, Language } from '../types';
import { formatTeacherText, getQuestionImageSummary, TeacherEditorText, TeacherEditorViewMode } from '../teacherEditorUi';
import ImageAssetPreview from './ImageAssetPreview';

interface QuestionBankViewsProps {
  questions: EditableQuestion[];
  language: Language;
  editingId: string | null;
  text: TeacherEditorText;
  viewMode: TeacherEditorViewMode;
  onEdit: (question: EditableQuestion) => void;
  onDuplicate: (question: EditableQuestion) => void;
  onDelete: (questionId: string) => void;
  onToggle: (questionId: string) => void;
}

const QuestionActions: React.FC<{
  question: EditableQuestion;
  text: TeacherEditorText;
  onEdit: (question: EditableQuestion) => void;
  onDuplicate: (question: EditableQuestion) => void;
  onDelete: (questionId: string) => void;
}> = ({ question, text, onEdit, onDuplicate, onDelete }) => (
  <div className="flex flex-wrap gap-2">
    <button onClick={() => onEdit(question)} className="vn-button px-3 py-2 text-xs">{text.edit}</button>
    <button onClick={() => onDuplicate(question)} className="vn-button px-3 py-2 text-xs">{text.duplicate}</button>
    <button onClick={() => onDelete(question.id)} className="vn-button px-3 py-2 text-xs">{text.delete}</button>
  </div>
);

const QuestionBadges: React.FC<{
  question: EditableQuestion;
  language: Language;
  text: TeacherEditorText;
  onToggle: (questionId: string) => void;
}> = ({ question, language, text, onToggle }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-[10px] uppercase tracking-widest text-amber-500">{question.language}</span>
    {question.subject && (
      <span className="text-[10px] uppercase tracking-widest text-stone-400 border border-stone-800 px-2 py-1">
        {getQuestionSubjectLabel(question.subject, language)}
      </span>
    )}
    {question.topic && <span className="text-[10px] uppercase tracking-widest text-stone-500">{question.topic}</span>}
    {getQuestionImageSummary(question) && (
      <span className="text-[10px] uppercase tracking-widest text-blue-300 border border-blue-900 px-2 py-1">{text.hasImages}</span>
    )}
    <button
      onClick={() => onToggle(question.id)}
      className={`text-[10px] uppercase tracking-widest border px-2 py-1 ${question.enabled ? 'border-green-800 text-green-300' : 'border-stone-700 text-stone-500'}`}
    >
      {question.enabled ? text.enabled : text.disabled}
    </button>
  </div>
);

const ListView: React.FC<QuestionBankViewsProps> = (props) => (
  <div className="space-y-2">
    {props.questions.map((question) => (
      <article
        key={question.id}
        className={`border bg-stone-950/70 p-3 ${props.editingId === question.id ? 'border-amber-500' : 'border-stone-800'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <QuestionBadges question={question} language={props.language} text={props.text} onToggle={props.onToggle} />
            <h2 className="font-serif text-stone-200 mt-2 break-words">{question.question || props.text.emptyQuestion}</h2>
            <p className="text-xs text-stone-500 mt-1">{question.id}</p>
          </div>
          <QuestionActions question={question} text={props.text} onEdit={props.onEdit} onDuplicate={props.onDuplicate} onDelete={props.onDelete} />
        </div>
      </article>
    ))}
  </div>
);

const TableView: React.FC<QuestionBankViewsProps> = (props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[920px] border-collapse text-sm">
      <thead className="text-xs uppercase tracking-widest text-stone-500">
        <tr className="border-b border-stone-800">
          <th className="text-left p-2">{props.text.question}</th>
          <th className="text-left p-2">{props.text.sortLanguage}</th>
          <th className="text-left p-2">{props.text.subject}</th>
          <th className="text-left p-2">{props.text.topic}</th>
          <th className="text-left p-2">{props.text.grade}</th>
          <th className="text-left p-2">{props.text.difficulty}</th>
          <th className="text-left p-2">{props.text.enabled}</th>
          <th className="text-left p-2">{props.text.tableImages}</th>
          <th className="text-left p-2">{props.text.tableActions}</th>
        </tr>
      </thead>
      <tbody>
        {props.questions.map((question) => (
          <tr key={question.id} className={`border-b border-stone-900 ${props.editingId === question.id ? 'bg-amber-950/20' : ''}`}>
            <td className="p-2 max-w-[280px] truncate" title={question.question}>{question.question}</td>
            <td className="p-2">{question.language}</td>
            <td className="p-2">{question.subject ? getQuestionSubjectLabel(question.subject, props.language) : ''}</td>
            <td className="p-2">{question.topic ?? ''}</td>
            <td className="p-2">{question.grade ?? ''}</td>
            <td className="p-2">{question.difficulty ?? ''}</td>
            <td className="p-2">
              <button onClick={() => props.onToggle(question.id)} className="text-xs border border-stone-700 px-2 py-1">
                {question.enabled ? props.text.enabled : props.text.disabled}
              </button>
            </td>
            <td className="p-2">{getQuestionImageSummary(question) ? props.text.hasImages : props.text.noImages}</td>
            <td className="p-2">
              <QuestionActions question={question} text={props.text} onEdit={props.onEdit} onDuplicate={props.onDuplicate} onDelete={props.onDelete} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GridView: React.FC<QuestionBankViewsProps> = (props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    {props.questions.map((question) => (
      <article
        key={question.id}
        className={`border bg-stone-950/70 p-3 ${props.editingId === question.id ? 'border-amber-500' : 'border-stone-800'}`}
      >
        {question.questionImageId && (
          <ImageAssetPreview
            assetId={question.questionImageId}
            alt=""
            className="w-full aspect-video object-cover border border-stone-800 bg-black mb-3"
            missingLabel={props.text.imageUnavailable}
            loadingLabel={props.text.loadingImage}
          />
        )}
        <QuestionBadges question={question} language={props.language} text={props.text} onToggle={props.onToggle} />
        <h2 className="font-serif text-stone-200 mt-2 line-clamp-3 break-words">{question.question || props.text.emptyQuestion}</h2>
        <p className="text-xs text-stone-500 mt-2">{formatTeacherText(props.text.optionsCount, { count: question.options.length })}</p>
        <QuestionActions question={question} text={props.text} onEdit={props.onEdit} onDuplicate={props.onDuplicate} onDelete={props.onDelete} />
      </article>
    ))}
  </div>
);

const QuestionBankViews: React.FC<QuestionBankViewsProps> = (props) => {
  if (props.viewMode === 'table') return <TableView {...props} />;
  if (props.viewMode === 'grid') return <GridView {...props} />;
  return <ListView {...props} />;
};

export default QuestionBankViews;
