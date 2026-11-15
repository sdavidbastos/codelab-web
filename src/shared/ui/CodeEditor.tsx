import { useEffect, useLayoutEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

export function CodeEditor({
  value,
  onChange,
  onRun,
  ariaLabel = 'Editor de código Python',
  describedBy = 'editor-keyboard-help',
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  ariaLabel?: string;
  describedBy?: string;
  readOnly?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const initial = useRef(value);
  const editable = useRef(new Compartment());
  const callbacks = useRef({ onChange, onRun });
  useLayoutEffect(() => {
    callbacks.current = { onChange, onRun };
  }, [onChange, onRun]);
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          basicSetup,
          editable.current.of([
            EditorState.readOnly.of(readOnly),
            EditorView.editable.of(!readOnly),
          ]),
          python(),
          oneDark,
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  if (!callbacks.current.onRun) return false;
                  callbacks.current.onRun();
                  return true;
                },
              },
              indentWithTab,
            ]),
          ),
          EditorView.contentAttributes.of({
            'aria-label': ariaLabel,
            'aria-describedby': describedBy,
            spellcheck: 'false',
          }),
          EditorView.theme(
            {
              '&': { height: '100%', backgroundColor: '#15181c', fontSize: '14px' },
              '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--mono)', lineHeight: '1.85' },
              '.cm-content': { padding: '18px 0', minHeight: '100%' },
              '.cm-gutters': { backgroundColor: '#15181c', borderRight: '0', color: '#606975' },
              '.cm-lineNumbers .cm-gutterElement': { minWidth: '45px', paddingRight: '14px' },
              '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#ffffff03' },
              '&.cm-focused': { outline: 'none' },
              '.cm-line': { paddingLeft: '6px' },
            },
            { dark: true },
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);
  useEffect(() => {
    view.current?.dispatch({
      effects: editable.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ]),
    });
  }, [readOnly]);
  return <div className="code-editor" ref={host} />;
}
