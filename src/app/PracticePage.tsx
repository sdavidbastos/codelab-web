import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Icon } from '../shared/ui/Icon';
import { exercises } from '../features/practice/exercises';
import { ProblemPanel } from '../features/practice/components/ProblemPanel';
import { ResultPanel } from '../features/practice/components/ResultPanel';
import { defaultDraft, loadDraft, loadRun, saveDraft } from '../features/practice/storage';
import type { Draft } from '../features/practice/storage';
import { useExecution } from '../features/practice/hooks/useExecution';
import type { Snapshot } from '../features/practice/api/executions';

const initialExercise = () =>
  exercises.find((item) => item.id === window.location.hash.slice(1)) ?? exercises[0];
const CodeEditor = lazy(async () => {
  const module = await import('../features/practice/components/CodeEditor');
  return { default: module.CodeEditor };
});
export function PracticePage() {
  const [exercise, setExercise] = useState(initialExercise);
  const [draft, setDraft] = useState<Draft>(() => loadDraft(initialExercise()));
  const [initialRun] = useState(() => loadRun(initialExercise().id));
  const [saved, setSaved] = useState(true);
  const [tab, setTab] = useState<'input' | 'result'>(initialRun ? 'result' : 'input');
  const [connection, setConnection] = useState<'checking' | 'up' | 'down'>('checking');
  const [validation, setValidation] = useState('');
  const help = useRef<HTMLDialogElement>(null);
  const runner = useExecution(initialRun);
  const snapshot: Snapshot = { exerciseId: exercise.id, ...draft };
  const previous = runner.state.phase === 'idle' ? null : runner.state.snapshot;
  const changed =
    previous !== null &&
    (previous.exerciseId !== exercise.id ||
      previous.sourceCode !== draft.sourceCode ||
      previous.stdin !== draft.stdin ||
      previous.compare !== draft.compare ||
      (draft.compare && previous.expectedOutput !== draft.expectedOutput));
  async function checkConnection(signal?: AbortSignal) {
    setConnection('checking');
    try {
      const response = await fetch('/api/health/ready', {
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
          : AbortSignal.timeout(5000),
      });
      const body: unknown = await response.json();
      if (!signal?.aborted)
        setConnection(
          response.ok &&
            typeof body === 'object' &&
            body !== null &&
            'status' in body &&
            body.status === 'ok' &&
            'database' in body &&
            body.database === 'up'
            ? 'up'
            : 'down',
        );
    } catch {
      if (!signal?.aborted) setConnection('down');
    }
  }
  useEffect(() => {
    const active = new AbortController();
    void checkConnection(active.signal);
    return () => active.abort();
  }, []);
  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaved(saveDraft(exercise.id, next));
    setValidation('');
  }
  function selectExercise(id: string) {
    if (runner.busy) return;
    const next = exercises.find((item) => item.id === id);
    if (!next) return;
    setExercise(next);
    setDraft(loadDraft(next));
    setValidation('');
    setTab(loadRun(id) ? 'result' : 'input');
    runner.reset(loadRun(id));
    window.history.replaceState(null, '', `#${id}`);
  }
  function useExample(index: number) {
    const example = exercise.examples[index];
    update({ stdin: example.input, expectedOutput: example.expected, compare: true });
    setTab('input');
  }
  function execute() {
    if (runner.busy) return;
    if (!draft.sourceCode.trim()) {
      setValidation('Escreva um código antes de executar.');
      return;
    }
    if (
      [...draft.sourceCode].length > 20000 ||
      [...draft.stdin].length > 10000 ||
      (draft.compare && [...draft.expectedOutput].length > 10000)
    ) {
      setValidation('Use até 20.000 caracteres no código e 10.000 em cada campo de teste.');
      return;
    }
    setValidation('');
    setTab('result');
    void runner.run({ ...snapshot });
  }
  function resume() {
    if ('id' in runner.state) void runner.resume(runner.state.id, runner.state.snapshot);
  }
  const index = exercises.indexOf(exercise);
  const activeExample = exercise.examples.findIndex(
    (item) => item.input === draft.stdin && item.expected === draft.expectedOutput && draft.compare,
  );
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="CodeLab, início">
          <span className="brand-mark">
            <Icon name="code" />
          </span>
          <span>
            Code<span className="brand-light">Lab</span>
          </span>
        </a>
        <span className="divider" />
        <div className="exercise-nav">
          <select
            aria-label="Selecionar exercício"
            value={exercise.id}
            disabled={runner.busy}
            onChange={(event) => selectExercise(event.target.value)}
          >
            {exercises.map((item) => (
              <option value={item.id} key={item.id}>
                {item.number}. {item.title}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label="Exercício anterior"
            disabled={runner.busy || index === 0}
            onClick={() => selectExercise(exercises[index - 1].id)}
          >
            <Icon name="left" />
          </button>
          <button
            className="icon-button"
            aria-label="Próximo exercício"
            disabled={runner.busy || index === exercises.length - 1}
            onClick={() => selectExercise(exercises[index + 1].id)}
          >
            <Icon name="right" />
          </button>
        </div>
        <div className="topbar-right">
          <a className="classrooms-link" href="#/turmas">
            Turmas <Icon name="users" />
          </a>
          <span className="practice-pill">Prática livre</span>
          <button
            className={`connection ${connection}`}
            onClick={() => void checkConnection()}
            title="Verificar a conexão com a API"
          >
            <span className="small-dot" />
            <span>
              {connection === 'up'
                ? 'API disponível'
                : connection === 'checking'
                  ? 'Conectando'
                  : 'API indisponível'}
            </span>
          </button>
          <span className="divider" />
          <button
            className="icon-button"
            aria-label="Como funciona"
            onClick={() => help.current?.showModal()}
          >
            <Icon name="help" />
          </button>
        </div>
      </header>
      <main className="workspace">
        <ProblemPanel exercise={exercise} onExample={useExample} />
        <div className="coding-column">
          <section className="panel editor-panel" aria-label="Código Python">
            <div className="editor-toolbar">
              <span className="panel-heading">
                <Icon name="code" className="green" />
                Código
              </span>
              <div className="editor-tools">
                <span className="language-pill">
                  <span className="python-dot" />
                  Python 3
                </span>
                <button
                  className="icon-button"
                  aria-label="Restaurar exemplo de código"
                  title="Restaurar exemplo"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Restaurar o código inicial? Seu rascunho atual será substituído.',
                      )
                    )
                      update({ sourceCode: defaultDraft(exercise).sourceCode });
                  }}
                >
                  <Icon name="reset" />
                </button>
              </div>
            </div>
            <div className="file-strip">
              <span className="file-name">
                <span className="python-icon">Py</span>main.py
              </span>
              <span>Exemplo editável</span>
            </div>
            <Suspense
              fallback={
                <div className="editor-loading" role="status">
                  Carregando o editor…
                </div>
              }
            >
              <CodeEditor
                value={draft.sourceCode}
                onChange={(sourceCode) => update({ sourceCode })}
                onRun={execute}
              />
            </Suspense>
            <footer className="editor-footer">
              <span>
                <span className="small-dot" />
                {saved
                  ? 'Rascunho salvo neste navegador'
                  : 'Não foi possível salvar neste navegador'}
              </span>
              <span>
                {draft.sourceCode.split('\n').length} linhas{' '}
                <span className="footer-separator">|</span> UTF-8
              </span>
            </footer>
          </section>
          <section className="panel console-panel" aria-label="Entrada e resultado">
            <div
              className="panel-tabs console-tabs"
              role="tablist"
              aria-label="Console de execução"
            >
              <button
                id="input-tab"
                role="tab"
                aria-selected={tab === 'input'}
                aria-controls="input-content"
                className={tab === 'input' ? 'tab active' : 'tab'}
                onClick={() => setTab('input')}
              >
                <Icon name="flask" className="amber" />
                Entrada de teste
              </button>
              <button
                id="result-tab"
                role="tab"
                aria-selected={tab === 'result'}
                aria-controls="result-content"
                className={tab === 'result' ? 'tab active' : 'tab'}
                onClick={() => setTab('result')}
              >
                <Icon name="terminal" className="blue" />
                Resultado{runner.busy && <span className="tab-dot" />}
              </button>
              <span className="console-caption">1 caso por execução</span>
            </div>
            <div
              id="input-content"
              className="console-body"
              role="tabpanel"
              aria-labelledby="input-tab"
              hidden={tab !== 'input'}
            >
              <div className="case-row">
                <div className="case-buttons">
                  {exercise.examples.map((_example, n) => (
                    <button
                      key={n}
                      className={activeExample === n ? 'case-button selected' : 'case-button'}
                      onClick={() => useExample(n)}
                    >
                      Caso {n + 1}
                    </button>
                  ))}
                </div>
                <span className="muted small">
                  {activeExample < 0 ? 'Entrada personalizada' : 'Exemplo público'}
                </span>
              </div>
              <div className="input-grid">
                <label className="field">
                  Entrada <span>(stdin)</span>
                  <textarea
                    aria-label="Entrada do programa"
                    spellCheck={false}
                    value={draft.stdin}
                    onChange={(event) => update({ stdin: event.target.value })}
                    placeholder={
                      exercise.id === 'hello'
                        ? 'Este programa não precisa de entrada.'
                        : 'Digite os valores da entrada…'
                    }
                  />
                </label>
                <label className={`field ${!draft.compare ? 'field-disabled' : ''}`}>
                  Saída esperada
                  <textarea
                    aria-label="Saída esperada do teste"
                    spellCheck={false}
                    disabled={!draft.compare}
                    value={draft.expectedOutput}
                    onChange={(event) => update({ expectedOutput: event.target.value })}
                    placeholder="Vazia também é uma saída válida."
                  />
                </label>
              </div>
              <div className="compare-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.compare}
                    onChange={(event) => update({ compare: event.target.checked })}
                  />
                  Comparar saída esperada
                </label>
                <span>
                  {draft.compare
                    ? 'O resultado será comparado com o valor informado.'
                    : 'Apenas executar, sem comparar a saída.'}
                </span>
              </div>
            </div>
            <div
              id="result-content"
              className="console-body result-body"
              role="tabpanel"
              aria-labelledby="result-tab"
              hidden={tab !== 'result'}
            >
              <ResultPanel state={runner.state} changed={changed} onResume={resume} />
            </div>
          </section>
          <div className="action-bar">
            <span id="editor-keyboard-help" className="keyboard-hint">
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para executar <span>·</span> Esc e Tab para sair do
              editor
            </span>
            <button className="button primary" disabled={runner.busy} onClick={execute}>
              {runner.busy ? <span className="spinner" /> : <Icon name="play" />}
              {runner.busy ? 'Executando…' : 'Executar código'}
            </button>
          </div>
          {validation && (
            <p className="validation" role="alert">
              {validation}
            </p>
          )}
        </div>
      </main>
      <dialog ref={help} className="help-dialog">
        <div className="dialog-heading">
          <span className="brand-mark">
            <Icon name="code" />
          </span>
          <h2>Seu espaço para praticar.</h2>
          <button
            className="icon-button"
            aria-label="Fechar ajuda"
            onClick={() => help.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>
          Escolha um exemplo, edite o código Python e clique em <strong>Executar código</strong>.
          Você pode usar os casos públicos ou criar sua própria entrada.
        </p>
        <ol>
          <li>Seu código é enviado pela API e executado com limites no Judge0.</li>
          <li>O resultado fica vinculado ao código enviado, mesmo se você continuar editando.</li>
          <li>Falhas de conexão não são tratadas como erro da sua solução.</li>
        </ol>
        <p>
          A prática livre usa exemplos locais, sem entrega ao professor ou bateria oculta. Acesse
          Turmas para entrar na sua conta e consultar seus vínculos.
        </p>
        <p className="muted">
          Os rascunhos ficam neste navegador. Tab indenta no editor; pressione Esc e depois Tab para
          mover o foco. Use Ctrl+Enter ou ⌘+Enter para executar.
        </p>
        <button className="button primary" onClick={() => help.current?.close()}>
          Vamos programar <Icon name="arrow" />
        </button>
      </dialog>
    </>
  );
}
