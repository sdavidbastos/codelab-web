import { useQuery, useMutation } from '../auth/hooks';
import { useAuth } from '../auth/AuthProvider';
import { Icon } from '../../shared/ui/Icon';
import { useLeaveGuard } from '../../shared/ui/useLeaveGuard';
import { parseQuestion, parseVersion } from './api';
import { QuestionForm } from './QuestionForm';
import { QuestionPreview } from './QuestionPreview';
import { VersionsPanel, formatDate } from './VersionsPanel';

export function NewQuestionPage() {
  return (
    <main className="learning-main">
      <a className="text-link back-link" href="#/exercicios">
        <Icon name="left" />
        Meus exercícios
      </a>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUTORIA DOCENTE</span>
          <h1>Novo exercício</h1>
          <p className="muted">Um bom desafio começa com uma descrição clara.</p>
        </div>
      </div>
      <QuestionForm
        onSaved={(question) => {
          window.location.hash = `/exercicios/${question.id}`;
        }}
      />
    </main>
  );
}
export function QuestionPage({ id }: { id: string }) {
  const resource = useQuery(`/api/questions/${id}`, parseQuestion);
  const mutation = useMutation();
  useLeaveGuard(false, mutation.pending);
  const { call } = useAuth();
  return (
    <main className="learning-main">
      <a className="text-link back-link" href="#/exercicios">
        <Icon name="left" />
        Meus exercícios
      </a>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando exercício…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <section className="learning-panel query-state">
          <h1>Exercício indisponível</h1>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar exercício novamente
          </button>
        </section>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {resource.state.data.status === 'DRAFT'
                  ? 'EDIÇÃO DO RASCUNHO'
                  : `ÚLTIMA PUBLICAÇÃO · V${resource.state.data.latestVersionNumber}`}
              </span>
              <h1>{resource.state.data.title}</h1>
              <p className="muted">
                {resource.state.data.status === 'DRAFT'
                  ? 'Salve suas alterações antes de publicar.'
                  : 'Conteúdo preservado. Abra um novo rascunho para preparar uma revisão.'}
              </p>
            </div>
            {resource.state.data.status === 'PUBLISHED' && (
              <button
                className="button primary"
                disabled={mutation.pending}
                onClick={() =>
                  void mutation.run(
                    async (signal) =>
                      parseQuestion(
                        await call(`/api/questions/${id}/draft`, { method: 'POST', signal }),
                      ),
                    resource.replace,
                  )
                }
              >
                <Icon name="edit" />
                {mutation.pending ? 'Abrindo…' : 'Abrir novo rascunho'}
              </button>
            )}
          </div>
          {mutation.error && (
            <p className="feedback warning" role="alert">
              {mutation.error}
            </p>
          )}
          {resource.state.data.status === 'DRAFT' ? (
            <QuestionForm question={resource.state.data} onSaved={resource.replace} />
          ) : (
            <>
              <p className="feedback good" role="status">
                Versão {resource.state.data.latestVersionNumber} publicada e preservada.
              </p>
              <QuestionPreview content={resource.state.data} />
            </>
          )}
          <VersionsPanel key={resource.state.data.latestVersionNumber} id={id} />
        </>
      )}
    </main>
  );
}
export function VersionPage({ id, number }: { id: string; number: number }) {
  const resource = useQuery(`/api/questions/${id}/versions/${number}`, parseVersion);
  return (
    <main className="learning-main">
      <a className="text-link back-link" href={`#/exercicios/${id}`}>
        <Icon name="left" />
        Voltar ao exercício
      </a>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando versão…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <section className="learning-panel query-state">
          <h1>Versão indisponível</h1>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar versão novamente
          </button>
        </section>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">HISTÓRICO · VERSÃO {resource.state.data.number}</span>
              <h1>{resource.state.data.title}</h1>
              <p className="muted">Publicada em {formatDate(resource.state.data.publishedAt)}</p>
            </div>
            <span className="question-status published">Somente leitura</span>
          </div>
          <p className="feedback good">
            Esta versão permanece preservada, mesmo após novas revisões do exercício.
          </p>
          <QuestionPreview content={resource.state.data} />
        </>
      )}
    </main>
  );
}
