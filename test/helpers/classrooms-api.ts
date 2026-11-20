import type { Page } from '@playwright/test';
export const teacher = {
  id: '70000000-0000-4000-8000-000000000001',
  name: 'Marina Costa',
  email: 'professora@example.test',
  role: 'TEACHER',
};
export const student = {
  id: '70000000-0000-4000-8000-000000000002',
  name: 'Ana Silva',
  email: 'aluna@example.test',
  role: 'STUDENT',
};
export const classroom = {
  id: '70000000-0000-4000-8000-000000000003',
  name: 'Linguagem de Programação 1',
  description: 'Primeiros passos com Python, uma descoberta por vez.',
  teacher: { id: teacher.id, name: teacher.name },
  createdAt: '2026-11-14T12:00:00.000Z',
  updatedAt: '2026-11-14T12:00:00.000Z',
};
export const enrollment = {
  id: '70000000-0000-4000-8000-000000000004',
  student: { id: student.id, name: student.name, email: student.email },
  createdAt: '2026-11-14T12:00:00.000Z',
  updatedAt: '2026-11-14T12:00:00.000Z',
};
export const csrf = 'c'.repeat(64);
export async function mockClassrooms(
  page: Page,
  options: { anonymous?: boolean; student?: boolean; empty?: boolean } = {},
) {
  const state = {
    authenticated: !options.anonymous,
    student: !!options.student,
    classrooms: options.empty ? [] : [{ ...classroom }],
    enrollments: [] as (typeof enrollment)[],
    requests: [] as { path: string; method: string; csrf?: string; body?: unknown }[],
  };
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const body: unknown = req.postData() ? req.postDataJSON() : undefined;
      state.requests.push({ path, method, csrf: req.headers()['x-csrf-token'], body });
      const session = () => ({
        user: state.authenticated ? (state.student ? student : teacher) : null,
        csrfToken: csrf,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      if (path === '/api/health/ready')
        return route.fulfill({ json: { status: 'ok', database: 'up' } });
      if (path === '/api/auth/me')
        return state.authenticated
          ? route.fulfill({ json: session() })
          : route.fulfill({ status: 401, json: {} });
      if (path === '/api/auth/csrf')
        return route.fulfill({ json: { ...session(), csrfToken: 'a'.repeat(64) } });
      if (path === '/api/auth/login') {
        state.authenticated = true;
        return route.fulfill({ json: session() });
      }
      if (path === '/api/auth/logout') {
        state.authenticated = false;
        return route.fulfill({ status: 204 });
      }
      if (!state.authenticated) return route.fulfill({ status: 401, json: {} });
      if (path === '/api/classrooms' && method === 'POST') {
        const input = body as { name: string; description: string };
        const created = { ...classroom, ...input, id: '70000000-0000-4000-8000-000000000009' };
        state.classrooms.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      if (path === '/api/classrooms' && method === 'GET') {
        const items = state.classrooms.filter((item) =>
          item.name.toLowerCase().includes((url.searchParams.get('search') ?? '').toLowerCase()),
        );
        const pageNumber = Number(url.searchParams.get('page') ?? 1);
        const pageSize = Number(url.searchParams.get('pageSize') ?? 12);
        return route.fulfill({
          json: {
            items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
            total: items.length,
            page: pageNumber,
            pageSize,
          },
        });
      }
      const parts = path.split('/');
      const found = state.classrooms.find((item) => item.id === parts[3]);
      if (!found) return route.fulfill({ status: 404, json: {} });
      if (parts.length === 4) {
        if (method === 'PATCH') Object.assign(found, body);
        return route.fulfill({ json: found });
      }
      if (parts[4] === 'activities' && method === 'GET') {
        return route.fulfill({
          json: {
            items: [],
            total: 0,
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: Number(url.searchParams.get('pageSize') ?? 6),
          },
        });
      }
      if (parts[4] === 'enrollments') {
        if (state.student) return route.fulfill({ status: 403, json: {} });
        if (method === 'POST') {
          if (state.enrollments.length) return route.fulfill({ status: 409, json: {} });
          state.enrollments.push(enrollment);
          return route.fulfill({ status: 201, json: enrollment });
        }
        if (method === 'DELETE') {
          state.enrollments = state.enrollments.filter((item) => item.student.id !== parts[5]);
          return route.fulfill({ status: 204 });
        }
        const pageNumber = Number(url.searchParams.get('page') ?? 1);
        const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
        return route.fulfill({
          json: {
            items: state.enrollments.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
            total: state.enrollments.length,
            page: pageNumber,
            pageSize,
          },
        });
      }
      return route.fulfill({ status: 404, json: {} });
    },
  );
  return state;
}
