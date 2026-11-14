import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { ClassroomsPage } from '../features/classrooms/ClassroomsPage';
import { ClassroomPage } from '../features/classrooms/ClassroomPage';
import { errorMessage, isUuid } from '../shared/api/http';
import { Icon } from '../shared/ui/Icon';
import { PracticePage } from './PracticePage';
import './learning.css';

function LearningHeader() {
  const { state, logout, pending } = useAuth();
  const [error, setError] = useState('');
  return (
    <>
      <header className="learning-header">
        <a className="brand" href="#hello" aria-label="CodeLab, início">
          <span className="brand-mark">
            <Icon name="code" />
          </span>
          <span>
            Code<span className="brand-light">Lab</span>
          </span>
        </a>
        <nav className="learning-nav" aria-label="Navegação principal">
          <a href="#hello">Prática livre</a>
          <a href="#/turmas" aria-current="page">
            Minhas turmas
          </a>
        </nav>
        {state.phase === 'authenticated' ? (
          <div className="account-menu">
            <span className="account-name">
              {state.session.user.name}
              <small>{state.session.user.role === 'TEACHER' ? 'Professor' : 'Aluno'}</small>
            </span>
            <button
              className="button secondary"
              disabled={!!pending}
              onClick={() => {
                setError('');
                void logout().catch((cause: unknown) => setError(errorMessage(cause)));
              }}
            >
              <Icon name="logout" />
              {pending === 'logout' ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        ) : (
          <span className="header-caption">Juntos, aprendemos mais.</span>
        )}
      </header>
      {error && (
        <p className="feedback warning header-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
function ProtectedArea({ id }: { id?: string }) {
  const auth = useAuth();
  useEffect(() => {
    if (auth.state.phase === 'unknown') void auth.restore();
  }, [auth.state.phase, auth.restore]);
  if (auth.state.phase === 'unknown' || auth.state.phase === 'checking')
    return (
      <main className="learning-main query-state" role="status">
        Verificando sua sessão…
      </main>
    );
  if (auth.state.phase === 'error')
    return (
      <main className="learning-main">
        <section className="learning-panel query-state">
          <h1>Não foi possível consultar sua sessão</h1>
          <p className="feedback warning" role="alert">
            {auth.state.message}
          </p>
          <button className="button secondary" onClick={() => void auth.restore()}>
            Consultar sessão novamente
          </button>
          <a className="text-link" href="#hello">
            Ir para a prática livre
          </a>
        </section>
      </main>
    );
  if (auth.state.phase === 'anonymous') return <LoginPage notice={auth.state.notice} />;
  return id ? (
    <ClassroomPage key={auth.state.session.user.id + id} id={id} />
  ) : (
    <ClassroomsPage key={auth.state.session.user.id} />
  );
}
function Router() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const change = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const learning = hash.startsWith('#/');
  const id = hash.slice('#/turmas/'.length);
  const valid = hash === '#/turmas' || (hash.startsWith('#/turmas/') && isUuid(id));
  if (!learning) return <PracticePage />;
  return (
    <>
      <LearningHeader />
      {valid ? (
        <ProtectedArea id={hash === '#/turmas' ? undefined : id} />
      ) : (
        <main className="learning-main query-state">
          <h1>Página não encontrada</h1>
          <a className="button secondary" href="#/turmas">
            Ir para minhas turmas
          </a>
        </main>
      )}
    </>
  );
}
export function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
