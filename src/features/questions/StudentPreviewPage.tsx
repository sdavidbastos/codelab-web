import { useQuery } from '../auth/hooks';
import { parseStudentVersion } from './api';
import { QuestionPreview } from './QuestionPreview';
import { formatDate } from './VersionsPanel';

export function StudentPreviewPage({ id, number }: { id: string; number: number }) {
  const resource = useQuery(`/api/questions/${id}/versions/${number}/preview`, parseStudentVersion);
  return (
    <main className="learning-main student-preview-page">
      <a className="text-link back-link" href={`#/exercicios/${id}/versoes/${number}`}>
        Voltar à versão docente
      </a>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando prévia do aluno…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <section className="learning-panel query-state">
          <h1>Prévia indisponível</h1>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar prévia novamente
          </button>
        </section>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">PRÉVIA DO ALUNO · VERSÃO {resource.state.data.number}</span>
              <h1>{resource.state.data.title}</h1>
              <p className="muted">Publicada em {formatDate(resource.state.data.publishedAt)}</p>
            </div>
            <span className="question-status published">Somente leitura</span>
          </div>
          <div className="feedback preview-notice" role="note">
            Esta prévia usa a versão publicada {number}. Alterações do rascunho só aparecem após
            outra publicação. A distribuição para turmas será feita pelas atividades.
          </div>
          <QuestionPreview content={resource.state.data} audience="student" />
        </>
      )}
    </main>
  );
}
