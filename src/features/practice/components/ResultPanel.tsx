import type { RunState } from '../hooks/useExecution';
import { Icon } from '../../../shared/ui/Icon';

export function ResultPanel({
  state,
  changed,
  onResume,
}: {
  state: RunState;
  changed: boolean;
  onResume: () => void;
}) {
  if (state.phase === 'idle')
    return (
      <div className="result-empty">
        <span className="empty-terminal">
          <Icon name="terminal" />
        </span>
        <h3>Da ideia ao resultado.</h3>
        <p>Execute seu código para ver a saída e aprender com cada teste.</p>
      </div>
    );
  if (state.phase === 'sending' || state.phase === 'polling')
    return (
      <div className="result-empty" role="status">
        <span className="spinner large" />
        <h3>
          {state.phase === 'sending'
            ? 'Enviando seu código…'
            : state.execution?.state === 'RUNNING'
              ? 'Executando seu programa…'
              : 'Aguardando o resultado…'}
        </h3>
        <p>Você pode continuar editando. Este resultado será do código enviado.</p>
      </div>
    );
  if (state.phase === 'unconfirmed' || state.phase === 'paused')
    return (
      <div className="notice warning" role="alert">
        <Icon name="help" />
        <div>
          <h3>{state.phase === 'paused' ? 'Vamos retomar a consulta?' : 'Envio não confirmado'}</h3>
          <p>{state.message}</p>
          {state.phase === 'paused' && (
            <button className="button secondary" onClick={onResume}>
              <Icon name="reset" />
              Consultar novamente
            </button>
          )}
          {state.phase === 'unconfirmed' && (
            <p className="fine-print">
              Não houve reenvio automático. Confira a conexão antes de iniciar uma nova execução.
            </p>
          )}
        </div>
      </div>
    );
  const execution = state.execution;
  const result = execution?.result;
  if (!execution || execution.state !== 'COMPLETED' || !result) {
    const uncertain = execution?.state === 'DISPATCH_UNCERTAIN';
    return (
      <div className="notice warning" role="alert">
        <Icon name="help" />
        <div>
          <h3>
            {uncertain ? 'O envio ficou sem confirmação' : 'Não foi possível concluir a execução'}
          </h3>
          <p>
            {uncertain
              ? 'O executor pode ter recebido seu código. Não fizemos outro envio automaticamente.'
              : 'Houve um problema no executor. Isso não significa que sua solução esteja errada.'}
          </p>
          <p className="fine-print">
            Seu rascunho foi preservado. Você pode iniciar uma nova execução quando desejar.
          </p>
        </div>
      </div>
    );
  }
  const id = result.status.id;
  const accepted = id === 3;
  const title = accepted
    ? state.snapshot.compare
      ? 'Saída confere'
      : 'Executado com sucesso'
    : id === 4
      ? 'Saída diferente'
      : id === 5
        ? 'Tempo limite excedido'
        : id === 6
          ? 'Erro de compilação'
          : 'Erro de execução';
  return (
    <div className="result-content">
      {changed && (
        <div className="snapshot-note">
          <Icon name="clock" />O código ou a entrada mudou. Este é o resultado da execução anterior.
        </div>
      )}
      <div className="result-heading">
        <div
          className={`verdict ${accepted ? 'success' : id === 4 || id === 5 ? 'amber' : 'error'}`}
        >
          <span className="verdict-icon">
            <Icon name={accepted ? 'check' : id === 5 ? 'clock' : 'close'} />
          </span>
          <div>
            <h3>{title}</h3>
            <p>
              {accepted
                ? state.snapshot.compare
                  ? 'O caso informado passou.'
                  : 'O programa terminou sem erro. Nenhuma saída esperada foi comparada.'
                : id === 4
                  ? 'Compare a saída do seu programa com o valor esperado.'
                  : 'Confira o diagnóstico abaixo e ajuste seu código.'}
            </p>
          </div>
        </div>
        <div className="metrics">
          <div>
            <span>Tempo</span>
            <strong>
              {result.time === null ? '—' : `${Math.round(Number(result.time) * 1000)} ms`}
            </strong>
          </div>
          <div>
            <span>Memória</span>
            <strong>
              {result.memory === null
                ? '—'
                : `${(result.memory / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`}
            </strong>
          </div>
        </div>
      </div>
      <div className="output-grid">
        <div className="output-block">
          <span>Saída do programa</span>
          <pre aria-label="Saída do programa">
            {result.stdout === null || result.stdout === '' ? '(saída vazia)' : result.stdout}
          </pre>
        </div>
        {state.snapshot.compare && (
          <div className="output-block">
            <span>Saída esperada</span>
            <pre aria-label="Saída esperada">
              {state.snapshot.expectedOutput || '(saída vazia)'}
            </pre>
          </div>
        )}
      </div>
      {result.stderr && (
        <div className="diagnostic">
          <span>Diagnóstico de execução</span>
          <pre>{result.stderr}</pre>
        </div>
      )}
      {result.compileOutput && (
        <div className="diagnostic">
          <span>Diagnóstico de compilação</span>
          <pre>{result.compileOutput}</pre>
        </div>
      )}
      {result.outputTruncated && <p className="muted">A saída foi limitada para exibição.</p>}
      <details className="execution-details">
        <summary>Detalhes da execução</summary>
        <p>
          {result.status.description} · status {id}
        </p>
        <p>
          ID: <code>{execution.id}</code>
        </p>
      </details>
    </div>
  );
}
