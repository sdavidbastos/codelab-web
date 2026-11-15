import { useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { ClassroomsPage } from '../features/classrooms/ClassroomsPage';
import { ClassroomPage } from '../features/classrooms/ClassroomPage';
import { errorMessage, isUuid } from '../shared/api/http';
import { Icon } from '../shared/ui/Icon';
import { QuestionsPage } from '../features/questions/QuestionsPage';
import { QuestionPage, NewQuestionPage, VersionPage } from '../features/questions/QuestionPage';
import { LEAVE_EVENT } from '../shared/ui/useLeaveGuard';
import { PracticePage } from './PracticePage';
import './learning.css';
import './questions.css';

type LearningRoute =
  | { kind: 'classrooms'; id?: string }
  | { kind: 'questions'; id?: string; creating?: boolean; version?: number };
function parseRoute(hash: string): LearningRoute | null {
  if (hash === '#/turmas') return { kind: 'classrooms' };
  if (hash === '#/exercicios') return { kind: 'questions' };
  if (hash === '#/exercicios/novo') return { kind: 'questions', creating: true };
  const parts = hash.split('/');
  if (parts.length === 3 && isUuid(parts[2]) && ['turmas', 'exercicios'].includes(parts[1]))
    return { kind: parts[1] === 'turmas' ? 'classrooms' : 'questions', id: parts[2] };
  if (
    parts.length === 5 &&
    parts[1] === 'exercicios' &&
    isUuid(parts[2]) &&
    parts[3] === 'versoes' &&
    /^[1-9]\d*$/.test(parts[4]) &&
    Number(parts[4]) <= 2147483647
  )
    return { kind: 'questions', id: parts[2], version: Number(parts[4]) };
  return null;
}

function LearningHeader({ section }: { section: 'classrooms' | 'questions' }) {
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
          <a href="#/turmas" aria-current={section === 'classrooms' ? 'page' : undefined}>
            Minhas turmas
          </a>
          {state.phase === 'authenticated' && state.session.user.role === 'TEACHER' && (
            <a href="#/exercicios" aria-current={section === 'questions' ? 'page' : undefined}>
              Exercícios
            </a>
          )}
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
                if (!window.dispatchEvent(new Event(LEAVE_EVENT, { cancelable: true }))) return;
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
function ProtectedArea({ route }: { route: LearningRoute }) {
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
  const user = auth.state.session.user;
  if (route.kind === 'questions') {
    if (user.role !== 'TEACHER')
      return (
        <main className="learning-main query-state">
          <h1>Área do professor</h1>
          <p>Os exercícios são organizados pelo professor responsável.</p>
          <a className="button secondary" href="#/turmas">
            Ver minhas turmas
          </a>
        </main>
      );
    if (route.creating) return <NewQuestionPage key={user.id} />;
    if (route.id && route.version)
      return (
        <VersionPage
          key={user.id + route.id + route.version}
          id={route.id}
          number={route.version}
        />
      );
    if (route.id) return <QuestionPage key={user.id + route.id} id={route.id} />;
    return <QuestionsPage key={user.id} />;
  }
  return route.id ? (
    <ClassroomPage key={user.id + route.id} id={route.id} />
  ) : (
    <ClassroomsPage key={user.id} />
  );
}
function Router() {
  const [hash, setHash] = useState(window.location.hash);
  const currentHash = useRef(hash);
  useEffect(() => {
    const change = () => {
      if (!window.dispatchEvent(new Event(LEAVE_EVENT, { cancelable: true }))) {
        window.history.replaceState(null, '', currentHash.current);
        return;
      }
      currentHash.current = window.location.hash;
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const learning = hash.startsWith('#/');
  const route = parseRoute(hash);
  if (!learning) return <PracticePage />;
  return (
    <>
      <LearningHeader section={hash.startsWith('#/exercicios') ? 'questions' : 'classrooms'} />
      {route ? (
        <ProtectedArea route={route} />
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
