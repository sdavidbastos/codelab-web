export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly uncertain = false,
  ) {
    super(message);
  }
}
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  csrf?: string;
  signal?: AbortSignal;
}
export async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const method = options.method ?? 'GET';
  const writing = method !== 'GET';
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(writing && options.csrf ? { 'X-CSRF-Token': options.csrf } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch {
    throw new RequestError(
      0,
      writing
        ? 'Não foi possível confirmar a alteração. Consulte os dados antes de tentar novamente.'
        : 'Não foi possível conectar. Verifique sua conexão e tente consultar novamente.',
      writing,
    );
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Confira os campos informados e tente novamente.',
      401: 'Sua sessão expirou. Entre novamente para continuar.',
      403: 'Acesso não permitido. Atualize sua sessão antes de tentar novamente.',
      404: 'O recurso não foi encontrado ou não está disponível para sua conta.',
      409: 'Este aluno já está matriculado nesta turma.',
      429: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
    };
    throw new RequestError(
      response.status,
      messages[response.status] ?? 'O serviço está indisponível. Seus campos foram preservados.',
    );
  }
  if (response.status === 204) return undefined;
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new RequestError(
      502,
      'Não foi possível ler a resposta do serviço. Consulte os dados antes de tentar novamente.',
      writing,
    );
  }
}
export const errorMessage = (error: unknown): string =>
  error instanceof RequestError
    ? error.message
    : 'O serviço retornou dados inesperados. Tente consultar novamente.';
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
export const isDate = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT/.test(value) &&
  Number.isFinite(Date.parse(value));
export function invalidResponse(): never {
  throw new RequestError(502, 'O serviço retornou dados inesperados. Tente consultar novamente.');
}
