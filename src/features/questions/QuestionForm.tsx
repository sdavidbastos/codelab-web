import { lazy, Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMutation } from '../auth/hooks';
import { RequestError } from '../../shared/api/http';
import { useLeaveGuard } from '../../shared/ui/useLeaveGuard';
import { Icon } from '../../shared/ui/Icon';
import { COMPARISON_POLICY, parseQuestion, type Question, type Visibility } from './api';
import { ComparisonRule } from './ComparisonRule';
import { CaseCounts } from './CaseCounts';
import { PublishQuestion, DeleteQuestion } from './QuestionActions';

const CodeEditor = lazy(async () => ({
  default: (await import('../../shared/ui/CodeEditor')).CodeEditor,
}));
type CaseInput = {
  key: string;
  stdin: string;
  expectedOutput: string;
  explanation: string;
  visibility: Visibility;
};
interface FormData {
  title: string;
  statement: string;
  learningObjective: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string;
  starterCode: string;
  cpuTimeLimitSeconds: string;
  wallTimeLimitSeconds: string;
  memoryLimitKb: string;
  testCases: CaseInput[];
}
function initialForm(question?: Question): FormData {
  return {
    title: question?.title ?? '',
    statement: question?.statement ?? '',
    learningObjective: question?.learningObjective ?? '',
    inputDescription: question?.inputDescription ?? '',
    outputDescription: question?.outputDescription ?? '',
    constraints: question?.constraints ?? '',
    starterCode: question?.starterCode ?? '',
    cpuTimeLimitSeconds: String(question?.cpuTimeLimitSeconds ?? 2),
    wallTimeLimitSeconds: String(question?.wallTimeLimitSeconds ?? 5),
    memoryLimitKb: String(question?.memoryLimitKb ?? 128000),
    testCases:
      question?.testCases.map((item) => ({
        key: item.id,
        stdin: item.stdin,
        expectedOutput: item.expectedOutput,
        explanation: item.explanation,
        visibility: item.visibility,
      })) ?? [],
  };
}
function payload(form: FormData) {
  const cpu = Number(form.cpuTimeLimitSeconds);
  const wall = Number(form.wallTimeLimitSeconds);
  const memory = Number(form.memoryLimitKb);
  if (
    !Number.isInteger(cpu) ||
    cpu < 1 ||
    cpu > 2 ||
    !Number.isInteger(wall) ||
    wall < cpu ||
    wall > 5 ||
    !Number.isInteger(memory) ||
    memory < 16384 ||
    memory > 128000
  )
    throw new RequestError(
      400,
      'Confira os limites: CPU de 1 a 2 s; tempo de parede entre a CPU e 5 s; memória de 16.384 a 128.000 KB.',
    );
  if (form.title.trim().length < 3 || form.statement.trim().length < 10)
    throw new RequestError(
      400,
      'Informe um título com pelo menos 3 caracteres e um enunciado com pelo menos 10.',
    );
  const inputs = new Set(form.testCases.map((item) => item.stdin));
  if (inputs.size !== form.testCases.length)
    throw new RequestError(400, 'Não repita a mesma entrada em dois casos de teste.');
  const body = {
    title: form.title.trim(),
    statement: form.statement,
    learningObjective: form.learningObjective,
    inputDescription: form.inputDescription,
    outputDescription: form.outputDescription,
    constraints: form.constraints,
    starterCode: form.starterCode,
    language: 'python3',
    comparisonPolicy: COMPARISON_POLICY,
    cpuTimeLimitSeconds: cpu,
    wallTimeLimitSeconds: wall,
    memoryLimitKb: memory,
    testCases: form.testCases.map((item) => ({
      stdin: item.stdin,
      expectedOutput: item.expectedOutput,
      explanation: item.explanation,
      visibility: item.visibility,
    })),
  };
  if ([...form.starterCode].length > 20000)
    throw new RequestError(400, 'O código inicial pode ter até 20.000 caracteres.');
  if (new TextEncoder().encode(JSON.stringify(body)).length > 100 * 1024)
    throw new RequestError(
      400,
      'O exercício excedeu o tamanho permitido. Reduza os textos ou a quantidade de casos.',
    );
  return body;
}

export function QuestionForm({
  question,
  onSaved,
}: {
  question?: Question;
  onSaved: (question: Question) => void;
}) {
  const { call } = useAuth();
  const mutation = useMutation();
  const [form, setForm] = useState(() => initialForm(question));
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  const [notice, setNotice] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;
  const allowNextNavigation = useLeaveGuard(dirty, mutation.pending);
  function text(name: Exclude<keyof FormData, 'testCases'>, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setNotice('');
  }
  function updateCase(
    key: string,
    field: 'stdin' | 'expectedOutput' | 'explanation',
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      testCases: current.testCases.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    }));
    setNotice('');
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    void mutation.run(
      async (signal) =>
        parseQuestion(
          await call(question ? `/api/questions/${question.id}` : '/api/questions', {
            method: question ? 'PATCH' : 'POST',
            body: payload(form),
            signal,
            messages: {
              409: 'O exercício mudou no servidor. Consulte a versão atual e a visibilidade dos casos antes de tentar novamente.',
            },
          }),
        ),
      (result) => {
        const saved = initialForm(result);
        setForm(saved);
        setBaseline(JSON.stringify(saved));
        setNotice('Rascunho salvo.');
        if (!question) allowNextNavigation();
        onSaved(result);
      },
    );
  }
  return (
    <form className="question-editor-layout" onSubmit={save}>
      <fieldset className="question-fields" disabled={mutation.pending}>
        <section className="learning-panel">
          <div className="form-section-heading">
            <span className="step-number">01</span>
            <div>
              <h2>Enunciado</h2>
              <p>O que o aluno precisa resolver?</p>
            </div>
          </div>
          <label className="learning-field">
            Título do exercício
            <input
              name="title"
              required
              minLength={3}
              maxLength={160}
              value={form.title}
              onChange={(e) => text('title', e.target.value)}
              placeholder="Ex.: Soma de dois números"
            />
          </label>
          <label className="learning-field">
            Enunciado
            <textarea
              name="statement"
              required
              minLength={10}
              maxLength={20000}
              rows={6}
              value={form.statement}
              onChange={(e) => text('statement', e.target.value)}
              placeholder="Descreva o problema e o comportamento esperado."
            />
          </label>
          <label className="learning-field">
            Objetivo de aprendizagem <span className="optional">opcional</span>
            <textarea
              maxLength={2000}
              rows={2}
              value={form.learningObjective}
              onChange={(e) => text('learningObjective', e.target.value)}
              placeholder="Que habilidade este exercício ajuda a praticar?"
            />
          </label>
        </section>
        <section className="learning-panel">
          <div className="form-section-heading">
            <span className="step-number">02</span>
            <div>
              <h2>Entrada e saída</h2>
              <p>Deixe claras as regras do programa.</p>
            </div>
          </div>
          <div className="question-two-columns">
            <label className="learning-field">
              Descrição da entrada
              <textarea
                maxLength={5000}
                rows={3}
                value={form.inputDescription}
                onChange={(e) => text('inputDescription', e.target.value)}
              />
            </label>
            <label className="learning-field">
              Descrição da saída
              <textarea
                maxLength={5000}
                rows={3}
                value={form.outputDescription}
                onChange={(e) => text('outputDescription', e.target.value)}
              />
            </label>
          </div>
          <label className="learning-field">
            Restrições do problema <span className="optional">opcional</span>
            <textarea
              maxLength={5000}
              rows={2}
              value={form.constraints}
              onChange={(e) => text('constraints', e.target.value)}
            />
          </label>
        </section>
        <section className="learning-panel">
          <div className="form-section-heading">
            <span className="step-number">03</span>
            <div>
              <h2>Código inicial</h2>
              <p>Um ponto de partida para a solução, se necessário.</p>
            </div>
            <span className="language-pill">Python 3</span>
          </div>
          <div className="starter-editor">
            <Suspense fallback={<p role="status">Carregando editor…</p>}>
              <CodeEditor
                value={form.starterCode}
                onChange={(value) => text('starterCode', value)}
                readOnly={mutation.pending}
                ariaLabel="Código inicial Python"
                describedBy="question-code-help"
              />
            </Suspense>
          </div>
          <p id="question-code-help" className="muted small">
            Tab indenta. Pressione Esc e depois Tab para sair do editor. Até 20.000 caracteres.
          </p>
        </section>
        <section className="learning-panel">
          <div className="form-section-heading">
            <span className="step-number">04</span>
            <div>
              <h2>Limites de execução</h2>
              <p>Estes valores ficam preservados na versão publicada.</p>
            </div>
          </div>
          <div className="limit-inputs">
            <label className="learning-field">
              CPU (segundos)
              <input
                type="number"
                required
                min={1}
                max={2}
                step={1}
                value={form.cpuTimeLimitSeconds}
                onChange={(e) => text('cpuTimeLimitSeconds', e.target.value)}
              />
            </label>
            <label className="learning-field">
              Tempo de parede (segundos)
              <input
                type="number"
                required
                min={1}
                max={5}
                step={1}
                value={form.wallTimeLimitSeconds}
                onChange={(e) => text('wallTimeLimitSeconds', e.target.value)}
              />
            </label>
            <label className="learning-field">
              Memória (KB)
              <input
                type="number"
                required
                min={16384}
                max={128000}
                step={1}
                value={form.memoryLimitKb}
                onChange={(e) => text('memoryLimitKb', e.target.value)}
              />
            </label>
          </div>
          <p className="muted small">O tempo de parede deve ser maior ou igual ao limite de CPU.</p>
          <ComparisonRule />
        </section>
        <section className="learning-panel" aria-labelledby="public-cases-title">
          <div className="section-heading">
            <div>
              <h2 id="public-cases-title">Casos de teste</h2>
              <p className="muted">
                Públicos mostram exemplos. Ocultos ficam restritos ao professor.
              </p>
            </div>
            <span className="count-pill">{form.testCases.length}/20</span>
          </div>
          <p className="case-counts" role="status">
            <CaseCounts cases={form.testCases} />
          </p>
          {form.testCases.length === 0 && (
            <p className="empty-state compact">
              Você pode salvar sem casos. Adicione pelo menos um caso público antes de publicar.
            </p>
          )}
          {form.testCases.map((item, index) => (
            <section
              className="public-case"
              key={item.key}
              aria-label={`Caso de teste ${index + 1}`}
            >
              <div className="section-heading">
                <h3>Caso {index + 1}</h3>
                <span
                  className={`case-visibility ${item.visibility === 'HIDDEN' ? 'hidden' : 'public'}`}
                >
                  {item.visibility === 'HIDDEN' ? 'Oculto' : 'Público'}
                </span>
                <button
                  type="button"
                  className="text-button danger"
                  aria-label={`Remover caso ${index + 1}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      testCases: current.testCases.filter((value) => value.key !== item.key),
                    }))
                  }
                >
                  Remover caso
                </button>
              </div>
              <label className="learning-field case-visibility-field">
                Visibilidade do caso {index + 1}
                <select
                  value={item.visibility}
                  onChange={(event) => {
                    const visibility = event.target.value;
                    if (visibility !== 'PUBLIC' && visibility !== 'HIDDEN') return;
                    setForm((current) => ({
                      ...current,
                      testCases: current.testCases.map((value) =>
                        value.key === item.key ? { ...value, visibility } : value,
                      ),
                    }));
                    setNotice('');
                  }}
                >
                  <option value="PUBLIC">Público — exemplo para o aluno</option>
                  <option value="HIDDEN">Oculto — apenas para o professor</option>
                </select>
              </label>
              <p className="muted small">
                {item.visibility === 'HIDDEN'
                  ? 'Entrada, saída esperada e explicação deste caso não aparecem na prévia do aluno.'
                  : 'Entrada, saída esperada e explicação deste caso aparecem na prévia do aluno.'}
              </p>
              <div className="question-two-columns">
                <label className="learning-field">
                  Entrada do caso {index + 1}
                  <textarea
                    className="mono-input"
                    maxLength={10000}
                    rows={3}
                    spellCheck={false}
                    value={item.stdin}
                    onChange={(e) => updateCase(item.key, 'stdin', e.target.value)}
                    placeholder="Pode ficar vazia."
                  />
                </label>
                <label className="learning-field">
                  Saída esperada do caso {index + 1}
                  <textarea
                    className="mono-input"
                    maxLength={10000}
                    rows={3}
                    spellCheck={false}
                    value={item.expectedOutput}
                    onChange={(e) => updateCase(item.key, 'expectedOutput', e.target.value)}
                    placeholder="Uma saída vazia também é válida."
                  />
                </label>
              </div>
              <label className="learning-field">
                Explicação do caso {index + 1} <span className="optional">opcional</span>
                <textarea
                  maxLength={2000}
                  rows={2}
                  value={item.explanation}
                  onChange={(e) => updateCase(item.key, 'explanation', e.target.value)}
                />
              </label>
            </section>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={form.testCases.length >= 20}
            onClick={() =>
              setForm((current) => ({
                ...current,
                testCases: [
                  ...current.testCases,
                  {
                    key: crypto.randomUUID(),
                    stdin: '',
                    expectedOutput: '',
                    explanation: '',
                    visibility: 'PUBLIC',
                  },
                ],
              }))
            }
          >
            <Icon name="plus" />
            Adicionar caso
          </button>
        </section>
      </fieldset>
      <aside className="question-save-panel learning-panel">
        <span className="question-status draft">Rascunho</span>
        <h2>Prepare, salve, publique.</h2>
        <p className="muted">
          Publicar preserva uma versão deste conteúdo. A revisão seguinte começa em outro rascunho.
        </p>
        <p className="save-state" role="status">
          {mutation.pending
            ? 'Salvando rascunho…'
            : dirty
              ? 'Alterações não salvas'
              : question
                ? 'Rascunho salvo'
                : 'Preencha o exercício para começar'}
        </p>
        {notice && (
          <p className="feedback good" role="status">
            {notice}
          </p>
        )}
        {mutation.error && (
          <p className="feedback warning" role="alert">
            {mutation.error}
          </p>
        )}
        <button type="submit" className="button primary full-width" disabled={mutation.pending}>
          {mutation.pending ? 'Salvando…' : 'Salvar rascunho'}
        </button>
        {question && (
          <>
            <button
              type="button"
              className="button secondary full-width"
              disabled={
                mutation.pending ||
                dirty ||
                !question.testCases.some((item) => item.visibility === 'PUBLIC')
              }
              onClick={() => setPublishing(true)}
            >
              Publicar versão {question.latestVersionNumber + 1}
            </button>
            <p className="muted small">
              {dirty
                ? 'Salve as alterações antes de publicar.'
                : !question.testCases.some((item) => item.visibility === 'PUBLIC')
                  ? 'Adicione e salve pelo menos um caso público para publicar.'
                  : 'Uma versão publicada não poderá ser editada.'}
            </p>
            {question.latestVersionNumber === 0 && (
              <button
                type="button"
                className="text-button danger"
                disabled={mutation.pending || dirty}
                onClick={() => setDeleting(true)}
              >
                Excluir rascunho
              </button>
            )}
          </>
        )}
        <a className="text-link" href="#/exercicios">
          Voltar aos exercícios
        </a>
      </aside>
      {question && publishing && (
        <PublishQuestion
          question={question}
          onClose={() => setPublishing(false)}
          onPublished={onSaved}
        />
      )}
      {question && deleting && (
        <DeleteQuestion question={question} onClose={() => setDeleting(false)} />
      )}
    </form>
  );
}
