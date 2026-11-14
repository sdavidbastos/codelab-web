import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  errorMessage,
  invalidResponse,
  request,
  RequestError,
  type RequestOptions,
} from '../../shared/api/http';
import { parseSession, type Session, type User } from './session';

type AuthState =
  | { phase: 'unknown' }
  | { phase: 'checking' }
  | { phase: 'anonymous'; notice?: string }
  | { phase: 'error'; message: string }
  | { phase: 'authenticated'; session: Session & { user: User } };
interface AuthContextValue {
  state: AuthState;
  pending: 'login' | 'logout' | null;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  call: (path: string, options?: RequestOptions) => Promise<unknown>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ phase: 'unknown' });
  const [pending, setPending] = useState<AuthContextValue['pending']>(null);
  const stateRef = useRef(state);
  const active = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const publish = useCallback((next: AuthState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const accept = useCallback(
    (session: Session) => {
      if (!session.user || Date.parse(session.expiresAt) <= Date.now())
        publish({ phase: 'anonymous' });
      else publish({ phase: 'authenticated', session: { ...session, user: session.user } });
    },
    [publish],
  );
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (state.phase !== 'authenticated') return;
    const timer = window.setTimeout(
      () =>
        publish({
          phase: 'anonymous',
          notice: 'Sua sessão expirou. Entre novamente para continuar.',
        }),
      Math.max(0, Date.parse(state.session.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [state, publish]);

  const restore = useCallback(async () => {
    if (busy.current) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    publish({ phase: 'checking' });
    try {
      const session = parseSession(await request('/api/auth/me', { signal: controller.signal }));
      if (!controller.signal.aborted) accept(session);
    } catch (error: unknown) {
      if (!controller.signal.aborted)
        publish(
          error instanceof RequestError && error.status === 401
            ? { phase: 'anonymous' }
            : { phase: 'error', message: errorMessage(error) },
        );
    }
  }, [accept, publish]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (busy.current) return;
      busy.current = true;
      setPending('login');
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      try {
        const challenge = parseSession(
          await request('/api/auth/csrf', { signal: controller.signal }),
        );
        const session = parseSession(
          await request('/api/auth/login', {
            method: 'POST',
            body: { email, password },
            csrf: challenge.csrfToken,
            signal: controller.signal,
          }),
        );
        if (!session.user) invalidResponse();
        if (!controller.signal.aborted) accept(session);
      } catch (error: unknown) {
        if (error instanceof RequestError && error.status === 401)
          throw new RequestError(401, 'E-mail ou senha inválidos.');
        throw error;
      } finally {
        busy.current = false;
        setPending(null);
      }
    },
    [accept],
  );

  const call = useCallback(
    async (path: string, options: RequestOptions = {}) => {
      const current = stateRef.current;
      if (current.phase !== 'authenticated')
        throw new RequestError(401, 'Entre na sua conta para continuar.');
      try {
        return await request(path, { ...options, csrf: current.session.csrfToken });
      } catch (error: unknown) {
        if (error instanceof RequestError && error.status === 401)
          publish({ phase: 'anonymous', notice: error.message });
        throw error;
      }
    },
    [publish],
  );

  const logout = useCallback(async () => {
    if (busy.current || stateRef.current.phase !== 'authenticated') return;
    busy.current = true;
    setPending('logout');
    try {
      await call('/api/auth/logout', { method: 'POST' });
      publish({ phase: 'anonymous' });
    } catch (error: unknown) {
      if (error instanceof RequestError && error.status === 401) publish({ phase: 'anonymous' });
      else throw error;
    } finally {
      busy.current = false;
      setPending(null);
    }
  }, [call, publish]);
  return (
    <AuthContext.Provider value={{ state, pending, restore, login, logout, call }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
