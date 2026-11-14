import { invalidResponse, isDate, isObject, isUuid } from '../../shared/api/http';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
}
export interface Session {
  user: User | null;
  csrfToken: string;
  expiresAt: string;
}
export function parseSession(value: unknown): Session {
  if (
    !isObject(value) ||
    typeof value.csrfToken !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.csrfToken) ||
    !isDate(value.expiresAt)
  )
    return invalidResponse();
  const user = value.user;
  if (user === null) return { user: null, csrfToken: value.csrfToken, expiresAt: value.expiresAt };
  if (
    !isObject(user) ||
    !isUuid(user.id) ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    (user.role !== 'TEACHER' && user.role !== 'STUDENT')
  )
    return invalidResponse();
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    csrfToken: value.csrfToken,
    expiresAt: value.expiresAt,
  };
}
