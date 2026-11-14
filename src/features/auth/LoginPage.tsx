import { useState, type FormEvent } from 'react';
import { Icon } from '../../shared/ui/Icon';
import { errorMessage } from '../../shared/api/http';
import { useAuth } from './AuthProvider';

export function LoginPage({ notice }: { notice?: string }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (auth.pending) return;
    setError('');
    try {
      await auth.login(email, password);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setPassword('');
    }
  }
  return (
    <main className="learning-main login-layout">
      <section className="login-intro">
        <span className="eyebrow">APRENDER, PRATICAR, COMPARTILHAR</span>
        <h1>
          Seu próximo passo
          <br />
          começa em turma<span>.</span>
        </h1>
        <p>Um espaço para organizar suas turmas e continuar aprendendo programação.</p>
        <div className="login-benefit">
          <span className="feature-icon">
            <Icon name="book" />
          </span>
          <div>
            <strong>Um lugar para cada turma</strong>
            <p>Professor e aluno encontram aqui os seus espaços.</p>
          </div>
        </div>
        <div className="login-benefit">
          <span className="feature-icon">
            <Icon name="code" />
          </span>
          <div>
            <strong>A prática continua livre</strong>
            <p>Explore os exemplos Python mesmo sem entrar.</p>
          </div>
        </div>
        <a className="text-link" href="#hello">
          Ir para a prática livre <Icon name="arrow" />
        </a>
      </section>
      <section className="learning-panel login-card" aria-labelledby="login-title">
        <span className="feature-icon">
          <Icon name="users" />
        </span>
        <h2 id="login-title">Entre na sua conta</h2>
        <p className="muted">Acesse suas turmas com seu e-mail e senha.</p>
        {notice && (
          <p className="feedback warning" role="status">
            {notice}
          </p>
        )}
        <form onSubmit={submit}>
          <label className="learning-field">
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!!auth.pending}
            />
          </label>
          <label className="learning-field">
            Senha
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!!auth.pending}
            />
          </label>
          {error && (
            <p className="feedback warning" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full-width" disabled={!!auth.pending}>
            {auth.pending === 'login' ? 'Entrando…' : 'Entrar'}
            <Icon name="arrow" />
          </button>
        </form>
        <p className="login-footnote">
          Use sua conta de aluno ou professor. Se precisar de acesso, fale com o responsável pela
          sua turma.
        </p>
      </section>
    </main>
  );
}
