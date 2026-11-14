import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useQuery } from './hooks';
import { Icon } from '../../shared/ui/Icon';
import { Pagination } from '../../shared/ui/Pagination';
import { ClassroomForm } from './ClassroomForm';
import { parseClassrooms } from './api';

export function ClassroomsPage() {
  const { state: auth } = useAuth();
  const teacher = auth.phase === 'authenticated' && auth.session.user.role === 'TEACHER';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '12',
    ...(query ? { search: query } : {}),
  });
  const resource = useQuery('/api/classrooms?' + params.toString(), parseClassrooms);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    if (search.trim() === query && page === 1) resource.refresh();
    else setQuery(search.trim());
  }
  return (
    <main className="learning-main">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{teacher ? 'ESPAÇO DO PROFESSOR' : 'ESPAÇO DO ALUNO'}</span>
          <h1>Minhas turmas</h1>
          <p className="muted">
            {teacher
              ? 'Organize suas turmas e mantenha seus alunos por perto.'
              : 'Seus espaços para aprender programação, juntos.'}
          </p>
        </div>
        {teacher && (
          <button className="button primary" onClick={() => setCreating(true)}>
            <Icon name="plus" />
            Nova turma
          </button>
        )}
      </div>
      <section className="classroom-collection" aria-label="Suas turmas">
        <div className="collection-toolbar">
          <form className="search-form" role="search" onSubmit={submit}>
            <Icon name="search" />
            <input
              aria-label="Buscar turma pelo nome"
              maxLength={100}
              placeholder="Buscar pelo nome da turma"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="button secondary">Buscar</button>
          </form>
          {resource.state.phase === 'ready' && (
            <span className="muted collection-count">
              {resource.state.data.total} {resource.state.data.total === 1 ? 'turma' : 'turmas'}
            </span>
          )}
        </div>
        {resource.state.phase === 'loading' && (
          <div className="query-state" role="status">
            <span className="spinner" />
            Carregando suas turmas…
          </div>
        )}
        {resource.state.phase === 'error' && (
          <div className="query-state">
            <p className="feedback warning" role="alert">
              {resource.state.message}
            </p>
            <button className="button secondary" onClick={resource.refresh}>
              Consultar novamente
            </button>
          </div>
        )}
        {resource.state.phase === 'ready' && (
          <>
            {resource.state.data.items.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="book" />
                </span>
                <h2>
                  {query
                    ? 'Nenhuma turma encontrada'
                    : teacher
                      ? 'Sua primeira turma começa aqui'
                      : 'Suas turmas aparecerão aqui'}
                </h2>
                <p>
                  {query
                    ? 'Tente outro nome ou limpe a busca para ver suas turmas.'
                    : teacher
                      ? 'Crie uma turma e matricule os alunos para começar.'
                      : 'Peça ao professor para matricular o e-mail da sua conta.'}
                </p>
                {query && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSearch('');
                      setQuery('');
                      setPage(1);
                    }}
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className="classroom-grid">
                {resource.state.data.items.map((classroom) => (
                  <article className="classroom-card" key={classroom.id}>
                    <div className="card-top">
                      <span className="feature-icon">
                        <Icon name="book" />
                      </span>
                      <span className="small muted">{teacher ? 'Sua turma' : 'Matriculado'}</span>
                    </div>
                    <h2>
                      <a href={`#/turmas/${classroom.id}`}>{classroom.name}</a>
                    </h2>
                    <p className="card-description">
                      {classroom.description || 'Um espaço para aprender e praticar programação.'}
                    </p>
                    <div className="card-bottom">
                      <span className="small muted">
                        {teacher ? 'Você é responsável' : classroom.teacher.name}
                      </span>
                      <a
                        className="text-link"
                        href={`#/turmas/${classroom.id}`}
                        aria-label={`Abrir turma ${classroom.name}`}
                      >
                        Ver turma <Icon name="arrow" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Pagination
              page={page}
              pageSize={resource.state.data.pageSize}
              total={resource.state.data.total}
              onPage={setPage}
            />
          </>
        )}
      </section>
      <aside className="practice-banner">
        <span className="feature-icon">
          <Icon name="code" />
        </span>
        <div>
          <h2>A prática também é livre.</h2>
          <p>Continue explorando os exemplos Python no editor.</p>
        </div>
        <a className="button secondary" href="#hello">
          Ir para a prática <Icon name="arrow" />
        </a>
      </aside>
      {creating && (
        <ClassroomForm
          onClose={() => setCreating(false)}
          onSaved={(classroom) => {
            window.location.hash = `/turmas/${classroom.id}`;
          }}
        />
      )}
    </main>
  );
}
