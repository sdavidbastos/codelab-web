import { useState, type FormEvent } from 'react';
import { useQuery } from '../auth/hooks';
import {
  parseQuestions,
  parseVersions,
  type QuestionSummary,
  type VersionSummary,
} from '../questions/api';
import { Pagination } from '../../shared/ui/Pagination';

function Versions({
  question,
  selected,
  onSelect,
}: {
  question: QuestionSummary;
  selected: VersionSummary | null;
  onSelect: (version: VersionSummary) => void;
}) {
  const [page, setPage] = useState(1);
  const resource = useQuery(
    `/api/questions/${question.id}/versions?page=${page}&pageSize=5`,
    parseVersions,
  );
  return (
    <section aria-label="Versões publicadas" className="version-picker">
      <h3>Versões de {question.title}</h3>
      <p className="muted small">
        A atividade preservará a versão escolhida, mesmo após novas publicações.
      </p>
      {resource.state.phase === 'loading' && <p role="status">Carregando versões…</p>}
      {resource.state.phase === 'error' && (
        <>
          <p role="alert" className="feedback warning">
            {resource.state.message}
          </p>
          <button type="button" className="button secondary" onClick={resource.refresh}>
            Consultar versões novamente
          </button>
        </>
      )}
      {resource.state.phase === 'ready' && (
        <>
          {resource.state.data.items.length === 0 && (
            <p>
              Nenhuma versão nesta página. Consulte outra página ou publique uma versão do
              exercício.
            </p>
          )}
          <div className="picker-options">
            {resource.state.data.items.map((version) => (
              <button
                type="button"
                key={version.id}
                className="picker-option"
                aria-pressed={selected?.id === version.id}
                onClick={() => onSelect(version)}
              >
                <strong>
                  Versão {version.number} · {version.title}
                </strong>
                <span>
                  Publicada em {new Date(version.publishedAt).toLocaleDateString('pt-BR')}
                </span>
              </button>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={resource.state.data.pageSize}
            total={resource.state.data.total}
            onPage={setPage}
          />
        </>
      )}
    </section>
  );
}
export function VersionPicker({
  selected,
  onSelect,
}: {
  selected: VersionSummary | null;
  onSelect: (version: VersionSummary | null) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState<QuestionSummary | null>(null);
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '5',
    ...(query ? { search: query } : {}),
  });
  const resource = useQuery('/api/questions?' + params, parseQuestions);
  function searchQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
    resource.refresh();
  }
  return (
    <section className="learning-panel" aria-labelledby="choose-version">
      <h2 id="choose-version">Exercício e versão</h2>
      <p className="muted">
        Escolha um exercício seu e depois uma publicação. Exercícios em revisão também preservam
        suas versões publicadas.
      </p>
      <form
        className="question-search"
        onSubmit={searchQuestions}
        role="search"
        aria-label="Buscar exercício para a atividade"
      >
        <label className="learning-field">
          Buscar exercício
          <input
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Título do exercício"
          />
        </label>
        <button className="button secondary">Buscar exercício</button>
      </form>
      {resource.state.phase === 'loading' && <p role="status">Carregando exercícios…</p>}
      {resource.state.phase === 'error' && (
        <>
          <p className="feedback warning" role="alert">
            {resource.state.message}
          </p>
          <button type="button" className="button secondary" onClick={resource.refresh}>
            Consultar exercícios novamente
          </button>
        </>
      )}
      {resource.state.phase === 'ready' && (
        <>
          {resource.state.data.items.length === 0 && (
            <p>
              Nenhum exercício nesta página. Ajuste a busca ou{' '}
              <a className="text-link" href="#/exercicios">
                prepare e publique um exercício
              </a>
              .
            </p>
          )}
          <div className="picker-options">
            {resource.state.data.items.map((item) => (
              <button
                type="button"
                className="picker-option"
                key={item.id}
                disabled={item.latestVersionNumber === 0}
                aria-pressed={question?.id === item.id}
                onClick={() => {
                  if (question?.id !== item.id) {
                    setQuestion(item);
                    onSelect(null);
                  }
                }}
              >
                <strong>{item.title}</strong>
                <span>
                  {item.latestVersionNumber
                    ? `Publicações disponíveis até v${item.latestVersionNumber}${item.status === 'DRAFT' ? ' · rascunho em revisão' : ''}`
                    : 'Publique uma versão para usar este exercício'}
                </span>
              </button>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={resource.state.data.pageSize}
            total={resource.state.data.total}
            onPage={setPage}
          />
        </>
      )}
      {question && (
        <Versions key={question.id} question={question} selected={selected} onSelect={onSelect} />
      )}
      {selected && (
        <p className="feedback good" role="status">
          Selecionada: {selected.title} · versão {selected.number}
        </p>
      )}
    </section>
  );
}
