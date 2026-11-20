import { useState, type FormEvent } from 'react';
import { useQuery } from '../auth/hooks';
import { Pagination } from '../../shared/ui/Pagination';
import { Icon } from '../../shared/ui/Icon';
import { parseQuestions } from './api';
export function QuestionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState({ search: '', status: '' });
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '12',
    ...(query.search ? { search: query.search } : {}),
    ...(query.status ? { status: query.status } : {}),
  });
  const resource = useQuery('/api/questions?' + params, parseQuestions);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery({ search: search.trim(), status: filter });
    resource.refresh();
  }
  return (
    <main className="learning-main">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ESPAÇO DO PROFESSOR</span>
          <h1>Meus exercícios</h1>
          <p className="muted">Prepare desafios e preserve cada publicação no histórico.</p>
        </div>
        <a className="button primary" href="#/exercicios/novo">
          <Icon name="plus" />
          Novo exercício
        </a>
      </div>
      <form className="question-search" role="search" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="question-search">
          Buscar exercício
        </label>
        <div className="search-form">
          <Icon name="search" />
          <input
            id="question-search"
            placeholder="Buscar pelo título do exercício"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Estado do exercício"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="PUBLISHED">Publicados</option>
        </select>
        <button className="button secondary">Buscar</button>
      </form>
      {resource.state.phase === 'loading' && (
        <p className="query-state" role="status">
          Carregando exercícios…
        </p>
      )}
      {resource.state.phase === 'error' && (
        <div className="query-state">
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button className="button secondary" onClick={resource.refresh}>
            Consultar exercícios novamente
          </button>
        </div>
      )}
      {resource.state.phase === 'ready' && (
        <>
          <p className="muted small">
            {resource.state.data.total}{' '}
            {resource.state.data.total === 1 ? 'exercício' : 'exercícios'}
          </p>
          {resource.state.data.items.length === 0 ? (
            <section className="empty-state">
              <span className="empty-icon">
                <Icon name="file" />
              </span>
              <h2>
                {query.search || query.status
                  ? 'Nenhum exercício encontrado'
                  : 'Seu próximo desafio começa aqui'}
              </h2>
              <p>
                {query.search || query.status
                  ? 'Ajuste a busca para consultar seus exercícios.'
                  : 'Crie um rascunho, adicione casos públicos e publique quando estiver pronto.'}
              </p>
            </section>
          ) : (
            <div className="classroom-grid">
              {resource.state.data.items.map((item) => (
                <article className="classroom-card question-card" key={item.id}>
                  <div className="card-top">
                    <span className="feature-icon">
                      <Icon name="file" />
                    </span>
                    <span
                      className={`question-status ${item.status === 'DRAFT' ? 'draft' : 'published'}`}
                    >
                      {item.status === 'DRAFT' ? 'Rascunho' : 'Publicado'}
                    </span>
                  </div>
                  <h2>
                    <a href={`#/exercicios/${item.id}`}>{item.title}</a>
                  </h2>
                  <p className="muted">
                    Python 3 · {item.testCaseCount}{' '}
                    {item.testCaseCount === 1 ? 'caso de teste' : 'casos de teste'}
                  </p>
                  <div className="card-bottom">
                    <span className="small muted">
                      {item.latestVersionNumber
                        ? `Última publicação: v${item.latestVersionNumber}`
                        : 'Ainda não publicado'}
                    </span>
                    <a
                      className="text-link"
                      href={`#/exercicios/${item.id}`}
                      aria-label={`Abrir exercício ${item.title}`}
                    >
                      Abrir <Icon name="arrow" />
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
    </main>
  );
}
