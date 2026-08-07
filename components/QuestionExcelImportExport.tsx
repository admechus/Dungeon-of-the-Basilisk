import React, { useRef, useState } from 'react';
import { mergeQuestionBanks, replaceQuestionBank } from '../questionBank';
import {
  ExcelPreviewResult,
  createQuestionTemplateWorkbook,
  createQuestionWorkbook,
  parseQuestionWorkbookArrayBuffer,
  workbookToArrayBuffer,
} from '../questionExcel';
import { EditableQuestion, Language } from '../types';
import { formatTeacherText, localizeTeacherEditorMessage, TeacherEditorText } from '../teacherEditorUi';

interface QuestionExcelImportExportProps {
  questions: EditableQuestion[];
  language: Language;
  text: TeacherEditorText;
  onApply: (questions: EditableQuestion[], message: string) => void;
}

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const downloadWorkbook = (arrayBuffer: ArrayBuffer, filename: string) => {
  const blob = new Blob([arrayBuffer], { type: EXCEL_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getPreviewStatusText = (
  preview: ExcelPreviewResult,
  language: Language,
  text: TeacherEditorText
): string => {
  const workbookProblem = preview.problems.find((problem) => problem.rowNumber === 0);
  if (workbookProblem) return localizeTeacherEditorMessage(workbookProblem.message, language);
  if (preview.summary.invalidCount > 0) {
    return `${text.invalid}: ${preview.summary.invalidCount}. ${text.valid}: ${preview.summary.validCount}.`;
  }
  if (preview.validQuestions.length === 0) return text.invalidWorkbook;
  return text.excelImportReady;
};

const getPreviewReadinessText = (
  preview: ExcelPreviewResult,
  language: Language,
  text: TeacherEditorText
): string => {
  const workbookProblem = preview.problems.find((problem) => problem.rowNumber === 0);
  if (workbookProblem) return localizeTeacherEditorMessage(workbookProblem.message, language);
  if (preview.summary.invalidCount > 0) return `${text.invalid}: ${preview.summary.invalidCount}`;
  if (preview.validQuestions.length === 0) return text.invalidWorkbook;
  return text.readyToImport;
};

const QuestionExcelImportExport: React.FC<QuestionExcelImportExportProps> = ({
  questions,
  language,
  text,
  onApply,
}) => {
  const [preview, setPreview] = useState<ExcelPreviewResult | null>(null);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportExcel = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadWorkbook(
      workbookToArrayBuffer(createQuestionWorkbook(questions)),
      `dungeon-of-the-basilisk-questions-${date}.xlsx`
    );
    setStatusText(text.excelExported);
  };

  const downloadTemplate = () => {
    downloadWorkbook(
      workbookToArrayBuffer(createQuestionTemplateWorkbook()),
      'dungeon-of-the-basilisk-questions-template.xlsx'
    );
    setStatusText(text.excelTemplateExported);
  };

  const importExcel = async (file: File) => {
    try {
      const result = parseQuestionWorkbookArrayBuffer(await file.arrayBuffer());
      const mergeResult = mergeQuestionBanks(questions, result.validQuestions);
      setPreview({
        ...result,
        conflictCount: mergeResult.conflictCount,
      });
      setStatusText(getPreviewStatusText({ ...result, conflictCount: mergeResult.conflictCount }, language, text));
    } catch {
      setPreview({
        isValid: false,
        summary: { totalRows: 0, validCount: 0, invalidCount: 0, generatedIdCount: 0 },
        validQuestions: [],
        problems: [{ rowNumber: 0, message: 'Invalid workbook.' }],
        conflictCount: 0,
      });
      setStatusText(text.invalidWorkbook);
    }
  };

  const applyReplace = () => {
    if (!preview || preview.summary.invalidCount > 0 || preview.validQuestions.length === 0) {
      setStatusText(text.excelReplaceBlocked);
      return;
    }

    onApply(replaceQuestionBank(preview.validQuestions), text.excelImportApplied);
    setPreview(null);
    setStatusText(text.excelImportApplied);
  };

  const applyMerge = () => {
    if (!preview || preview.validQuestions.length === 0) {
      setStatusText(text.importCancelled);
      return;
    }

    const mergeResult = mergeQuestionBanks(questions, preview.validQuestions);
    onApply(
      mergeResult.questions,
      formatTeacherText(text.importMerged, { added: mergeResult.addedCount, conflicts: mergeResult.conflictCount })
    );
    setPreview(null);
    setStatusText(text.excelImportApplied);
  };

  return (
    <div className="border border-stone-800 bg-stone-950/50 p-3">
      <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">{text.excelTools}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="vn-button px-3 py-2 text-xs">{text.importExcel}</button>
        <button onClick={exportExcel} className="vn-button px-3 py-2 text-xs">{text.exportExcel}</button>
        <button onClick={downloadTemplate} className="vn-button px-3 py-2 text-xs">{text.downloadExcelTemplate}</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importExcel(file);
            event.currentTarget.value = '';
          }}
        />
      </div>

      {statusText && <p className="text-xs text-amber-300 border border-amber-900/50 bg-amber-950/20 p-2 mt-3">{statusText}</p>}

      {preview && (
        <div className="mt-3 border border-stone-800 bg-black/30 p-3">
          <h3 className="font-serif text-stone-100 mb-2">{text.excelPreviewTitle}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-300 mb-3">
            <p>{text.totalRows}: {preview.summary.totalRows}</p>
            <p>{text.valid}: {preview.summary.validCount}</p>
            <p>{text.invalid}: {preview.summary.invalidCount}</p>
            <p>{text.conflicts}: {preview.conflictCount}</p>
            <p>{text.generatedIds}: {preview.summary.generatedIdCount}</p>
            <p>{getPreviewReadinessText(preview, language, text)}</p>
          </div>
          {preview.summary.generatedIdCount > 0 && (
            <p className="text-xs text-stone-500 mb-3">{text.excelGeneratedIdsHint}</p>
          )}

          {preview.problems.length === 0 ? (
            <p className="text-xs text-stone-500 border border-stone-800 p-2 mb-3">{text.excelNoProblems}</p>
          ) : (
            <div className="max-h-44 overflow-y-auto border border-stone-800 mb-3">
              <table className="w-full min-w-[420px] text-xs">
                <thead className="text-stone-500 uppercase tracking-widest">
                  <tr className="border-b border-stone-800">
                    <th className="text-left p-2">{text.row}</th>
                    <th className="text-left p-2">{text.question}</th>
                    <th className="text-left p-2">{text.error}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.problems.map((problem, index) => (
                    <tr key={`${problem.rowNumber}-${index}`} className="border-b border-stone-900">
                      <td className="p-2">{problem.rowNumber || '-'}</td>
                      <td className="p-2">{problem.questionId || problem.questionText || '-'}</td>
                      <td className="p-2">{localizeTeacherEditorMessage(problem.message, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={applyReplace}
              disabled={preview.summary.invalidCount > 0 || preview.validQuestions.length === 0}
              className="vn-button px-3 py-2 text-xs disabled:opacity-40"
            >
              {text.applyReplace}
            </button>
            <button
              onClick={applyMerge}
              disabled={preview.validQuestions.length === 0}
              className="vn-button px-3 py-2 text-xs disabled:opacity-40"
            >
              {text.applyMerge}
            </button>
            <button onClick={() => { setPreview(null); setStatusText(text.importCancelled); }} className="vn-button px-3 py-2 text-xs">
              {text.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionExcelImportExport;
