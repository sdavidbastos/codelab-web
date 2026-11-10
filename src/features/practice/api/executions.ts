export type ExecutionState =
  'DISPATCHING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'DISPATCH_UNCERTAIN' | 'REJECTED' | 'ERROR';
export type ExecutionResult = {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;
  memory: number | null;
  outputTruncated: boolean;
};
export type Execution = {
  id: string;
  state: ExecutionState;
  language: 'python3';
  result: ExecutionResult | null;
  errorCode: string | null;
  createdAt: string;
};
export type Snapshot = {
  exerciseId: string;
  sourceCode: string;
  stdin: string;
  expectedOutput: string;
  compare: boolean;
};
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';
const states: ExecutionState[] = [
  'DISPATCHING',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'DISPATCH_UNCERTAIN',
  'REJECTED',
  'ERROR',
];
const verdicts = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly executionId?: string,
  ) {
    super(message);
  }
}
function parseResult(value: unknown): ExecutionResult {
  if (
    !object(value) ||
    !object(value.status) ||
    typeof value.status.id !== 'number' ||
    !verdicts.includes(value.status.id) ||
    typeof value.status.description !== 'string' ||
    !text(value.stdout) ||
    !text(value.stderr) ||
    !text(value.compileOutput) ||
    !text(value.time) ||
    (value.time !== null && !/^\d+(\.\d+)?$/.test(value.time)) ||
    (value.memory !== null &&
      (typeof value.memory !== 'number' ||
        !Number.isSafeInteger(value.memory) ||
        value.memory < 0)) ||
    typeof value.outputTruncated !== 'boolean'
  )
    throw new ApiError('A API retornou um resultado inesperado. Seu código foi preservado.');
  return {
    status: { id: value.status.id, description: value.status.description },
    stdout: value.stdout,
    stderr: value.stderr,
    compileOutput: value.compileOutput,
    time: value.time,
    memory: value.memory,
    outputTruncated: value.outputTruncated,
  };
}
export function parseExecution(value: unknown): Execution {
  if (
    !object(value) ||
    !isUuid(value.id) ||
    typeof value.state !== 'string' ||
    !states.some((state) => state === value.state) ||
    value.language !== 'python3' ||
    !text(value.errorCode) ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    throw new ApiError('A API retornou uma resposta inesperada. Seu código foi preservado.');
  }
  const state = states.find((state) => state === value.state)!;
  if (state !== 'COMPLETED' && value.result !== null)
    throw new ApiError('A API retornou um estado inconsistente.');
  return {
    id: value.id,
    state,
    language: 'python3',
    errorCode: value.errorCode,
    createdAt: value.createdAt,
    result: state === 'COMPLETED' ? parseResult(value.result) : null,
  };
}
export const isTerminal = (execution: Execution) =>
  ['COMPLETED', 'DISPATCH_UNCERTAIN', 'REJECTED', 'ERROR'].includes(execution.state);

async function request(path: string, signal: AbortSignal, payload?: unknown): Promise<Execution> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: payload === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers:
        payload === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.any([signal, AbortSignal.timeout(payload === undefined ? 8000 : 15000)]),
    });
  } catch {
    throw new ApiError('A conexão foi interrompida. Não reenviamos seu código automaticamente.');
  }
  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch {
    throw new ApiError('Não foi possível ler a resposta da API.');
  }
  if (!response.ok) {
    const id = object(body) && isUuid(body.executionId) ? body.executionId : undefined;
    throw new ApiError(
      response.status === 400
        ? 'Verifique o código e os limites dos campos antes de executar.'
        : response.status === 404
          ? 'Esta execução não foi encontrada na API.'
          : 'A API não conseguiu concluir a solicitação. Seu código foi preservado.',
      id,
    );
  }
  return parseExecution(body);
}
export const createExecution = (snapshot: Snapshot, signal: AbortSignal) =>
  request('/api/executions', signal, {
    sourceCode: snapshot.sourceCode,
    language: 'python3',
    stdin: snapshot.stdin,
    ...(snapshot.compare ? { expectedOutput: snapshot.expectedOutput } : {}),
  });
export const getExecution = (id: string, signal: AbortSignal) =>
  request(`/api/executions/${encodeURIComponent(id)}`, signal);
