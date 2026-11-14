export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1 && page === 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <span>
        Página {page} de {pages}
      </span>
      <div>
        <button className="button secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </button>
        <button
          className="button secondary"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
