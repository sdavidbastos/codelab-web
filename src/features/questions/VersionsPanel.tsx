import { useState } from 'react';
import { useQuery } from '../auth/hooks';
import { Pagination } from '../../shared/ui/Pagination';
import { parseVersions } from './api';
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
export function VersionsPanel({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const resource = useQuery(`/api/questions/${id}/versions?page=${page}&pageSize=5`, parseVersions);
  return (
    <section className="learning-panel versions-panel" aria-label="Histórico de versões">
      <h2>Histórico de versões</h2>
      <p className="muted">Cada publicação preserva o conteúdo e os casos daquele momento.</p>
      {resource.state.phase === 'loading' && <p role="status">Consultando versões…</p>}
      {resource.state.phase === 'error' && (
        <>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar versões novamente
          </button>
        </>
      )}
      {resource.state.phase === 'ready' && (
        <>
          {resource.state.data.items.length === 0 ? (
            <p className="empty-state compact">Nenhuma versão publicada.</p>
          ) : (
            <ol className="version-list">
              {resource.state.data.items.map((version) => (
                <li key={version.id}>
                  <a
                    href={`#/exercicios/${id}/versoes/${version.number}`}
                    aria-label={`Consultar versão ${version.number}`}
                  >
                    <span className="version-number">v{version.number}</span>
                    <span>
                      <strong>{version.title}</strong>
                      <small>
                        {formatDate(version.publishedAt)} · {version.testCaseCount}{' '}
                        {version.testCaseCount === 1 ? 'caso de teste' : 'casos de teste'}
                      </small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
          <Pagination
            page={page}
            total={resource.state.data.total}
            pageSize={resource.state.data.pageSize}
            onPage={setPage}
          />
        </>
      )}
    </section>
  );
}
