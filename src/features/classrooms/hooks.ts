import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { errorMessage, RequestError } from '../../shared/api/http';

type QueryState<T> =
  | { phase: 'loading' }
  | { phase: 'ready'; data: T }
  | { phase: 'error'; message: string; status: number };
export function useQuery<T>(path: string, parse: (value: unknown) => T) {
  const { call, state: auth } = useAuth();
  const identity = auth.phase === 'authenticated' ? auth.session.user.id : '';
  const key = identity + path;
  const [record, setRecord] = useState<{ key: string; state: QueryState<T> }>({
    key,
    state: { phase: 'loading' },
  });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setRecord({ key, state: { phase: 'loading' } });
    void call(path, { signal: controller.signal })
      .then((value) => {
        const data = parse(value);
        if (!controller.signal.aborted) setRecord({ key, state: { phase: 'ready', data } });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRecord({
            key,
            state: {
              phase: 'error',
              message: errorMessage(error),
              status: error instanceof RequestError ? error.status : 0,
            },
          });
      });
    return () => controller.abort();
  }, [key, path, parse, call, version]);
  const state: QueryState<T> = record.key === key ? record.state : { phase: 'loading' };
  return { state, refresh };
}

export function useMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function run<T>(work: (signal: AbortSignal) => Promise<T>, success: (value: T) => void) {
    if (busy.current) return;
    const controller = new AbortController();
    active.current = controller;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const result = await work(controller.signal);
      if (!controller.signal.aborted) success(result);
    } catch (cause: unknown) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof RequestError && cause.status === 502
            ? 'Não foi possível confirmar a alteração. Consulte os dados antes de tentar novamente.'
            : errorMessage(cause),
        );
    } finally {
      busy.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return { pending, error, run };
}
