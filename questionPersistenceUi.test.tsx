import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import TeacherQuestionEditor from './components/TeacherQuestionEditor';
import QuestionBankViews from './components/QuestionBankViews';
import QuestionExcelImportExport from './components/QuestionExcelImportExport';
import { createQuestionWorkbook, workbookToArrayBuffer } from './questionExcel';
import { createQuestionBankExport } from './questionBank';
import { persistQuestionBankChanges, QuestionBankSession, resetQuestionBank } from './questionStorage';
import { getTeacherEditorText } from './teacherEditorUi';
import { EditableQuestion, Language } from './types';

// Shallow-render real handlers without a DOM or new test dependencies.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as Array<() => void | (() => void)> }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: <T,>(initial: T | (() => T)) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [hooks.slots[index] as T, (value: T | ((previous: T) => T)) => {
      hooks.slots[index] = typeof value === 'function' ? (value as (previous: T) => T)(hooks.slots[index] as T) : value;
    }];
  },
  useEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect); },
  useMemo: <T,>(compute: () => T) => compute(),
  useRef: <T,>(current: T) => ({ current }),
}));

interface ElementNode { type: unknown; props: Record<string, unknown> }
const nodes = (value: unknown): ElementNode[] => {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (typeof value !== 'object' || value === null || !('props' in value)) return [];
  const node = value as ElementNode;
  return [node, ...nodes(node.props.children)];
};
const textOf = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join('');
  return nodes(value).filter((node) => node.type === 'p').map((node) => textOf(node.props.children)).join(' ');
};
const find = (tree: unknown, predicate: (node: ElementNode) => boolean): ElementNode => {
  const result = nodes(tree).find(predicate);
  if (!result) throw new Error('Expected element not found');
  return result;
};
const button = (tree: unknown, label: string) => find(tree, (node) => node.type === 'button' && textOf(node.props.children) === label);
const click = (node: ElementNode) => (node.props.onClick as () => void)();
const render = (component: () => unknown): unknown => { hooks.cursor = 0; hooks.effects = []; return component(); };

const question: EditableQuestion = { id: 'ui-question', language: Language.EN, question: 'Question?', options: ['A', 'B'], correctIndex: 0, enabled: true };
const text = getTeacherEditorText(Language.EN);

beforeEach(() => {
  hooks.slots = [];
  hooks.cursor = 0;
  vi.stubGlobal('requestAnimationFrame', () => 0);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('question persistence UI contracts (shallow handler tests)', () => {
  it('shows recovery controls, not save success, after failure; retry clears the warning', () => {
    let session: QuestionBankSession = { questions: [question], hasUnsavedChanges: false };
    let canWrite = false;
    const editor = () => TeacherQuestionEditor({
      ...session, language: Language.EN, onClose: () => undefined, onReset: () => false,
      onQuestionsChange: (questions: EditableQuestion[]) => {
        const result = persistQuestionBankChanges(questions, () => canWrite);
        session = result.session;
        return result.persisted;
      },
    });
    let tree = render(editor);
    (find(tree, (node) => node.type === QuestionBankViews).props.onEdit as (question: EditableQuestion) => void)(question);
    tree = render(editor);
    click(button(tree, text.save));
    tree = render(editor);
    expect(textOf(tree)).toContain(text.unsavedWarning);
    expect(textOf(tree)).not.toContain(text.saved);
    expect(button(tree, text.exportUnsavedJson)).toBeDefined();
    canWrite = true;
    click(button(tree, text.retrySave));
    tree = render(editor);
    expect(textOf(tree)).toContain(text.saved);
    expect(textOf(tree)).not.toContain(text.unsavedWarning);
    expect(session.hasUnsavedChanges).toBe(false);
  });

  it('does not reset a recoverable bank without explicit confirmation', () => {
    vi.stubGlobal('window', { confirm: vi.fn(() => false) });
    const onReset = vi.fn(() => true);
    const tree = render(() => TeacherQuestionEditor({
      questions: [question], hasUnsavedChanges: true, language: Language.EN,
      onClose: () => undefined, onQuestionsChange: () => false, onReset,
    }));
    click(button(tree, text.reset));
    expect(window.confirm).toHaveBeenCalledWith(text.confirmResetUnsaved);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('downloads the in-memory bank as JSON without marking it saved', async () => {
    let downloaded: Blob | undefined;
    const link = { href: '', download: '', click: vi.fn() };
    vi.stubGlobal('document', { createElement: () => link });
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => { downloaded = blob as Blob; return 'blob:recovery'; });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const props = {
      questions: [question], hasUnsavedChanges: true, language: Language.EN,
      onClose: () => undefined, onQuestionsChange: vi.fn(() => false), onReset: () => false,
    };
    click(button(render(() => TeacherQuestionEditor(props)), text.exportUnsavedJson));
    expect(link.click).toHaveBeenCalledOnce();
    expect(JSON.parse(await downloaded!.text())).toMatchObject({ version: 1, questions: [question] });
    expect(props.onQuestionsChange).not.toHaveBeenCalled();
    expect(textOf(render(() => TeacherQuestionEditor(props)))).toContain(text.recoveryExported);
    expect(button(render(() => TeacherQuestionEditor(props)), text.retrySave)).toBeDefined();
  });

  it.each([text.importReplace, text.importMerge])('does not claim successful JSON persistence for %s', (importLabel) => {
    vi.stubGlobal('window', { confirm: () => true });
    vi.stubGlobal('FileReader', class {
      result = JSON.stringify(createQuestionBankExport([question]));
      onload: (() => void) | null = null;
      readAsText() { this.onload?.(); }
    });
    let session: QuestionBankSession = { questions: [], hasUnsavedChanges: false };
    const editor = () => TeacherQuestionEditor({
      ...session, language: Language.EN, onClose: () => undefined, onReset: () => false,
      onQuestionsChange: (questions: EditableQuestion[]) => {
        const result = persistQuestionBankChanges(questions, () => false);
        session = result.session;
        return result.persisted;
      },
    });
    const tree = render(editor);
    click(button(tree, importLabel));
    const input = find(tree, (node) => node.type === 'input' && node.props.accept === 'application/json,.json');
    (input.props.onChange as (event: unknown) => void)({ target: { files: [{}] }, currentTarget: { value: 'bank.json' } });
    const preview = render(editor);
    expect(session.questions).toEqual([]);
    click(button(preview, importLabel === text.importReplace ? text.applyReplace : text.applyMerge));
    const result = render(editor);
    expect(session.questions).toEqual([question]);
    expect(session.hasUnsavedChanges).toBe(true);
    expect(textOf(result)).toContain(text.unsavedWarning);
    expect(textOf(result)).not.toContain(text.importReplaced);
    expect(textOf(result)).not.toContain('Merged 1');
  });

  it('keeps recovery visible and reports reset failure instead of reset success', () => {
    vi.stubGlobal('window', { confirm: () => true });
    let session: QuestionBankSession = { questions: [question], hasUnsavedChanges: true };
    const editor = () => TeacherQuestionEditor({
      ...session, language: Language.EN, onClose: () => undefined, onQuestionsChange: () => false,
      onReset: () => {
        const result = resetQuestionBank(session, () => false);
        session = result.session;
        return result.persisted;
      },
    });
    click(button(render(editor), text.reset));
    const tree = render(editor);
    expect(textOf(tree)).toContain(text.resetFailed);
    expect(textOf(tree)).not.toContain(text.restored);
    expect(button(tree, text.exportUnsavedJson)).toBeDefined();
    expect(session.questions).toEqual([question]);
  });

  it.each([text.applyReplace, text.applyMerge])('does not claim successful Excel persistence for %s', async (applyLabel) => {
    const onApply = vi.fn(() => false);
    const component = () => QuestionExcelImportExport({ questions: [], language: Language.EN, text, onApply });
    const tree = render(component);
    const input = find(tree, (node) => node.type === 'input' && node.props.type === 'file');
    const buffer = workbookToArrayBuffer(createQuestionWorkbook([question]));
    (input.props.onChange as (event: unknown) => void)({
      target: { files: [{ arrayBuffer: async () => buffer }] }, currentTarget: { value: 'questions.xlsx' },
    });
    await Promise.resolve();
    click(button(render(component), applyLabel));
    expect(onApply).toHaveBeenCalled();
    const result = render(component);
    expect(textOf(result)).not.toContain(text.excelImportApplied);
  });

  it('keeps the unsaved bank and status in App when the editor is closed and reopened', () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('Storage denied'); } });
    let tree = render(() => App({}));
    click(button(tree, 'Teacher Question Bank'));
    tree = render(() => App({}));
    let editor = find(tree, (node) => node.type === TeacherQuestionEditor);
    expect((editor.props.onQuestionsChange as (questions: EditableQuestion[]) => boolean)([question])).toBe(false);
    tree = render(() => App({}));
    editor = find(tree, (node) => node.type === TeacherQuestionEditor);
    (editor.props.onClose as () => void)();
    tree = render(() => App({}));
    click(button(tree, 'Teacher Question Bank'));
    editor = find(render(() => App({})), (node) => node.type === TeacherQuestionEditor);
    expect(editor.props.questions).toEqual([question]);
    expect(editor.props.hasUnsavedChanges).toBe(true);
  });

  it('registers an unload warning for unsaved work and cleans up the listener', () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('Storage denied'); } });
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', { addEventListener, removeEventListener });
    click(button(render(() => App({})), 'Teacher Question Bank'));
    const editor = find(render(() => App({})), (node) => node.type === TeacherQuestionEditor);
    (editor.props.onQuestionsChange as (questions: EditableQuestion[]) => boolean)([question]);
    render(() => App({}));
    const cleanups = hooks.effects.map((effect) => effect());
    expect(addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    const listener = addEventListener.mock.calls[0][1] as (event: { preventDefault: () => void; returnValue: string }) => void;
    const event = { preventDefault: vi.fn(), returnValue: 'initial' };
    listener(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.returnValue).toBe('');
    cleanups.forEach((cleanup) => { if (cleanup) cleanup(); });
    expect(removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
  });
});

describe('safe JSON import preview and application', () => {
  const incoming = { ...question, id: 'new-question', questionImageId: 'image-1', optionImageIds: ['image-2', null] };
  const json = (questions: unknown[]) => JSON.stringify({ ...createQuestionBankExport([]), questions });

  const prepare = (content: string, mode: 'replace' | 'merge' = 'replace', persist = true, confirm = true) => {
    const confirmImport = vi.fn(() => confirm);
    vi.stubGlobal('window', { confirm: confirmImport });
    vi.stubGlobal('FileReader', class {
      result = content;
      onload: (() => void) | null = null;
      readAsText() { this.onload?.(); }
    });
    let session: QuestionBankSession = { questions: [question], hasUnsavedChanges: false };
    const onQuestionsChange = vi.fn((questions: EditableQuestion[]) => {
      const result = persistQuestionBankChanges(questions, () => persist);
      session = result.session;
      return result.persisted;
    });
    const editor = () => TeacherQuestionEditor({
      ...session, language: Language.EN, onClose: () => undefined, onReset: () => false, onQuestionsChange,
    });
    const tree = render(editor);
    click(button(tree, mode === 'replace' ? text.importReplace : text.importMerge));
    const input = find(tree, (node) => node.type === 'input' && node.props.accept === 'application/json,.json');
    (input.props.onChange as (event: unknown) => void)({ target: { files: [{}] }, currentTarget: { value: 'bank.json' } });
    return { editor, onQuestionsChange, confirmImport, session: () => session };
  };

  it('previews a valid Replace without writing, then replaces only after confirmation', () => {
    const test = prepare(json([incoming]));
    const preview = render(test.editor);
    expect(textOf(preview)).toContain(`${text.jsonTotalQuestions}: 1`);
    expect(textOf(preview)).toContain(`${text.valid}: 1`);
    expect(textOf(preview)).toContain(`${text.invalid}: 0`);
    expect(test.onQuestionsChange).not.toHaveBeenCalled();
    expect(test.confirmImport).not.toHaveBeenCalled();
    expect(button(preview, text.applyReplace).props.disabled).toBe(false);
    click(button(preview, text.applyReplace));
    expect(test.confirmImport).toHaveBeenCalledWith(text.confirmReplace);
    expect(test.onQuestionsChange).toHaveBeenCalledOnce();
    expect(test.session().questions).toEqual([incoming]);
    expect(test.session().hasUnsavedChanges).toBe(false);
    expect(textOf(render(test.editor))).toContain(text.importReplaced);
  });

  it('blocks partial Replace and shows counts plus every validation error', () => {
    const test = prepare(json([incoming, { ...incoming, id: 'bad', question: '', correctIndex: 9 }]));
    const preview = render(test.editor);
    expect(textOf(preview)).toContain(`${text.jsonTotalQuestions}: 2`);
    expect(textOf(preview)).toContain(`${text.valid}: 1`);
    expect(textOf(preview)).toContain(`${text.invalid}: 1`);
    expect(textOf(preview)).toContain('Question text is required.');
    expect(textOf(preview)).toContain('Correct answer must point to an existing option.');
    expect(textOf(preview)).toContain(text.jsonReplaceBlocked);
    expect(button(preview, text.applyReplace).props.disabled).toBe(true);
    click(button(preview, text.applyReplace));
    expect(test.confirmImport).not.toHaveBeenCalled();
    expect(test.onQuestionsChange).not.toHaveBeenCalled();
    expect(test.session()).toEqual({ questions: [question], hasUnsavedChanges: false });
  });

  it.each([
    ['all invalid', json([{ ...incoming, correctIndex: 99 }])],
    ['empty bank', json([])],
    ['empty file', ''],
    ['malformed JSON', '{broken'],
    ['wrong format', JSON.stringify({ format: 'other', version: 1, questions: [incoming] })],
  ])('rejects %s without writing or asking to replace', (_label, content) => {
    const test = prepare(content);
    const preview = render(test.editor);
    expect(button(preview, text.applyReplace).props.disabled).toBe(true);
    click(button(preview, text.applyReplace));
    expect(test.confirmImport).not.toHaveBeenCalled();
    expect(test.onQuestionsChange).not.toHaveBeenCalled();
    expect(test.session().questions).toEqual([question]);
  });

  it('leaves the bank unchanged when the user declines confirmation or cancels preview', () => {
    const test = prepare(json([incoming]), 'replace', true, false);
    click(button(render(test.editor), text.applyReplace));
    expect(test.confirmImport).toHaveBeenCalledOnce();
    expect(test.onQuestionsChange).not.toHaveBeenCalled();
    const preview = find(render(test.editor), (node) => node.props['aria-label'] === text.jsonPreviewTitle);
    click(button(preview, text.cancel));
    expect(textOf(render(test.editor))).toContain(text.importCancelled);
    expect(test.session().questions).toEqual([question]);
  });

  it('keeps partial Merge semantics, skipping invalid records and existing ID conflicts', () => {
    const test = prepare(json([{ ...question, question: 'conflicting text' }, incoming, { ...incoming, id: 'bad', correctIndex: 99 }]), 'merge');
    const preview = render(test.editor);
    expect(textOf(preview)).toContain(`${text.invalid}: 1`);
    expect(button(preview, text.applyMerge).props.disabled).toBe(false);
    click(button(preview, text.applyMerge));
    expect(test.confirmImport).toHaveBeenCalledWith(text.confirmMerge);
    expect(test.session().questions).toEqual([question, incoming]);
    expect(textOf(render(test.editor))).toContain('Merged 1; skipped 1 conflicts.');
  });

  it('keeps the intended replacement recoverable through H2 after a storage failure', () => {
    const test = prepare(json([incoming]), 'replace', false);
    click(button(render(test.editor), text.applyReplace));
    expect(test.session()).toEqual({ questions: [incoming], hasUnsavedChanges: true });
    const result = render(test.editor);
    expect(textOf(result)).toContain(text.unsavedWarning);
    expect(textOf(result)).not.toContain(text.importReplaced);
    expect(button(result, text.retrySave)).toBeDefined();
    expect(button(result, text.exportUnsavedJson)).toBeDefined();
  });
});
