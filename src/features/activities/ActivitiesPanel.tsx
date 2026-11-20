import { useState, type FormEvent } from 'react';
import { useQuery } from '../auth/hooks';
import { Icon } from '../../shared/ui/Icon';
import { Pagination } from '../../shared/ui/Pagination';
import { parseActivities, statusLabels } from './api';

export function ActivitiesPanel({
  classroomId,
  teacher,
}: {
  classroomId: string;
  teacher: boolean;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState({ search: '', status: '' });
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '6',
    ...(query.search ? { search: query.search } : {}),
    ...(query.status ? { status: query.status } : {}),
  });
  const resource = useQuery(`/api/classrooms/${classroomId}/activities?${params}`, parseActivities);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery({ search: search.trim(), status: filter });
    resource.refresh();
  }
  return (
    <section className="activities-panel" aria-labelledby="activities-title">
      <div className="section-heading">
        <div>
          <h2 id="activities-title">Atividades da turma</h2>
          <p className="muted">
            {teacher
              ? 'Organize os desafios e escolha quando disponibilizá-los.'
              : 'Consulte os desafios disponibilizados pelo professor.'}
          </p>
        </div>
        {teacher && (
          <a className="button primary" href={`#/turmas/${classroomId}/atividades/nova`}>
            <Icon name="plus" />
            Nova atividade
          </a>
        )}
      </div>
      <form
        className="question-search"
        role="search"
        aria-label="Buscar atividades"
        onSubmit={submit}
      >
        <label className="visually-hidden" htmlFor="activity-search">
          Buscar atividade
        </label>
        <div className="search-form">
          <Icon name="search" />
          <input
            id="activity-search"
            maxLength={100}
            placeholder="Buscar pelo título da atividade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Estado da atividade"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {teacher && <option value="DRAFT">Rascunhos</option>}
          <option value="OPEN">Abertas</option>
          <option value="CLOSED">Encerradas</option>
        </select>
        <button className="button secondary">Buscar</button>
      </form>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando atividades…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <div className="query-state">
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar atividades novamente
          </button>
        </div>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <p className="muted small">
            {resource.state.data.total}{' '}
            {resource.state.data.total === 1 ? 'atividade' : 'atividades'}
          </p>
          {resource.state.data.items.length === 0 ? (
            <div className="empty-state compact">
              <Icon name="file" />
              <h3>Nenhuma atividade nesta página</h3>
              <p>
                {query.search || query.status
                  ? 'Ajuste os filtros para consultar outras atividades.'
                  : teacher
                    ? 'Crie uma atividade com uma versão publicada de um exercício.'
                    : 'As atividades aparecerão aqui quando o professor disponibilizá-las.'}
              </p>
            </div>
          ) : (
            <div className="classroom-grid">
              {resource.state.data.items.map((item) => (
                <article className="classroom-card" key={item.id}>
                  <div className="card-top">
                    <span className="feature-icon">
                      <Icon name="file" />
                    </span>
                    <span className={`activity-status ${item.status.toLowerCase()}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <h3>
                    <a href={`#/atividades/${item.id}`}>{item.title}</a>
                  </h3>
                  <p className="card-description">{item.description}</p>
                  <p className="muted small">
                    {item.questionVersion.title} · v{item.questionVersion.number}
                  </p>
                  <div className="card-bottom">
                    <span className="small muted">Python 3</span>
                    <a
                      className="text-link"
                      href={`#/atividades/${item.id}`}
                      aria-label={`Abrir atividade ${item.title}`}
                    >
                      Ver atividade <Icon name="arrow" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
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
