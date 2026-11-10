import { useEffect, useRef, useState } from 'react';
import { ApiError, createExecution, getExecution, isTerminal } from '../api/executions';
import type { Execution, Snapshot } from '../api/executions';
import { saveRun } from '../storage';
import type { SavedRun } from '../storage';

export type RunState =
  | { phase: 'idle' }
  | { phase: 'sending'; snapshot: Snapshot }
  | {
      phase: 'polling' | 'paused' | 'done';
      snapshot: Snapshot;
      id: string;
      execution?: Execution;
      message?: string;
    }
  | { phase: 'unconfirmed'; snapshot: Snapshot; message: string };
const restored = (run: SavedRun | null): RunState =>
  run
    ? {
        phase: 'paused',
        id: run.id,
        snapshot: run.snapshot,
        message: 'Uma execução foi salva neste navegador. Consulte para recuperar seu resultado.',
      }
    : { phase: 'idle' };
function wait(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const stop = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', stop);
      resolve();
    };
    const timer = setTimeout(stop, 800);
    signal.addEventListener('abort', stop, { once: true });
    if (signal.aborted) stop();
  });
}
export function useExecution(initial: SavedRun | null) {
  const [state, setState] = useState<RunState>(() => restored(initial));
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  function publish(next: RunState, signal: AbortSignal) {
    if (mounted.current && !signal.aborted) setState(next);
  }
  async function poll(id: string, snapshot: Snapshot, active: AbortController, first?: Execution) {
    const signal = active.signal;
    const deadline = Date.now() + 30000;
    let execution = first;
    while (!signal.aborted && Date.now() < deadline) {
      try {
        execution = await getExecution(id, signal);
        if (isTerminal(execution)) {
          publish({ phase: 'done', id, snapshot, execution }, signal);
          return;
        }
        publish({ phase: 'polling', id, snapshot, execution }, signal);
      } catch (error: unknown) {
        publish(
          {
            phase: 'paused',
            id,
            snapshot,
            execution,
            message: error instanceof Error ? error.message : 'A consulta foi interrompida.',
          },
          signal,
        );
        return;
      }
      await wait(signal);
    }
    publish(
      {
        phase: 'paused',
        id,
        snapshot,
        execution,
        message:
          'A execução ainda pode estar em andamento. Você pode consultar novamente, sem reenviar o código.',
      },
      signal,
    );
  }
  function begin(): AbortController | null {
    if (locked.current) return null;
    locked.current = true;
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    return active;
  }
  function finish(active: AbortController) {
    if (controller.current === active) locked.current = false;
  }
  async function run(snapshot: Snapshot) {
    const active = begin();
    if (!active) return;
    publish({ phase: 'sending', snapshot }, active.signal);
    try {
      const execution = await createExecution(snapshot, active.signal);
      if (active.signal.aborted) return;
      saveRun(execution.id, snapshot);
      if (isTerminal(execution))
        publish({ phase: 'done', id: execution.id, snapshot, execution }, active.signal);
      else {
        publish({ phase: 'polling', id: execution.id, snapshot, execution }, active.signal);
        await poll(execution.id, snapshot, active, execution);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível confirmar o envio.';
      if (error instanceof ApiError && error.executionId) {
        saveRun(error.executionId, snapshot);
        publish({ phase: 'paused', id: error.executionId, snapshot, message }, active.signal);
      } else publish({ phase: 'unconfirmed', snapshot, message }, active.signal);
    } finally {
      finish(active);
    }
  }
  async function resume(id: string, snapshot: Snapshot) {
    const active = begin();
    if (!active) return;
    publish({ phase: 'polling', id, snapshot }, active.signal);
    try {
      await poll(id, snapshot, active);
    } finally {
      finish(active);
    }
  }
  function reset(saved: SavedRun | null) {
    if (!locked.current) {
      controller.current?.abort();
      setState(restored(saved));
    }
  }
  return {
    state,
    run,
    resume,
    reset,
    busy: state.phase === 'sending' || state.phase === 'polling',
  };
}
