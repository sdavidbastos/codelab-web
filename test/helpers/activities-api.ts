import type { Page } from '@playwright/test';
import { classroom } from './classrooms-api';
import { mockQuestions } from './questions-api';
import type { Activity, ActivitySummary } from '../../src/features/activities/api';
import type { QuestionVersion } from '../../src/features/questions/api';

function publicVersion(version: QuestionVersion): Activity['questionVersion'] {
  return {
    ...version,
    comparisonDescription:
      'Comparação textual: espaços finais são ignorados. Não há tolerância numérica.',
    testCases: version.testCases
      .filter((item) => item.visibility === 'PUBLIC')
      .map(({ visibility: _visibility, ...item }, index) => ({ ...item, position: index + 1 })),
  };
}
export function activitySummary(item: Activity): ActivitySummary {
  const v = item.questionVersion;
  return {
    ...item,
    questionVersion: {
      id: v.id,
      questionId: v.questionId,
      number: v.number,
      title: v.title,
      language: v.language,
      comparisonPolicy: v.comparisonPolicy,
      publishedAt: v.publishedAt,
    },
  };
}
export async function mockActivities(
  page: Page,
  options: { student?: boolean; empty?: boolean } = {},
) {
  const questions = await mockQuestions(page, {
    published: true,
    hidden: true,
    student: options.student,
  });
  const initial: Activity = {
    id: '90000000-0000-4000-8000-000000000001',
    title: 'Prática de entrada e saída',
    description: 'Leia o contrato e os exemplos com atenção.',
    status: 'DRAFT',
    openedAt: null,
    closedAt: null,
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-20T12:00:00.000Z',
    classroom: { id: classroom.id, name: classroom.name },
    questionVersion: publicVersion(questions.versions[0]),
  };
  const state = {
    questions,
    initial,
    items: options.empty ? [] : [structuredClone(initial)],
    revoked: false,
    requests: [] as {
      path: string;
      query: string;
      method: string;
      csrf?: string;
      body?: unknown;
    }[],
  };
  await page.route(
    (url) =>
      url.pathname.startsWith('/api/activities') ||
      /\/api\/classrooms\/[^/]+\/activities$/.test(url.pathname),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const body: unknown = req.postData() ? req.postDataJSON() : undefined;
      state.requests.push({
        path,
        query: url.search,
        method,
        body,
        csrf: req.headers()['x-csrf-token'],
      });
      if (!questions.auth.authenticated) return route.fulfill({ status: 401, json: {} });
      if (questions.auth.student && method !== 'GET')
        return route.fulfill({ status: 403, json: {} });
      if (state.revoked) return route.fulfill({ status: 404, json: {} });
      if (path.startsWith('/api/classrooms/')) {
        if (path !== `/api/classrooms/${classroom.id}/activities`)
          return route.fulfill({ status: 404, json: {} });
        if (method === 'POST') {
          const input = body as { title: string; description: string; questionVersionId: string };
          const version = questions.versions.find((v) => v.id === input.questionVersionId);
          if (!version) return route.fulfill({ status: 404, json: {} });
          const created: Activity = {
            ...structuredClone(initial),
            id: crypto.randomUUID(),
            title: input.title,
            description: input.description,
            questionVersion: publicVersion(version),
          };
          state.items.unshift(created);
          return route.fulfill({ status: 201, json: activitySummary(created) });
        }
        const items = state.items.filter(
          (item) =>
            (!questions.auth.student || item.status !== 'DRAFT') &&
            (!url.searchParams.get('status') || item.status === url.searchParams.get('status')) &&
            item.title.toLowerCase().includes((url.searchParams.get('search') ?? '').toLowerCase()),
        );
        const number = Number(url.searchParams.get('page') ?? 1);
        const size = Number(url.searchParams.get('pageSize') ?? 6);
        return route.fulfill({
          json: {
            items: items.slice((number - 1) * size, number * size).map(activitySummary),
            total: items.length,
            page: number,
            pageSize: size,
          },
        });
      }
      const parts = path.split('/');
      const found = state.items.find((item) => item.id === parts[3]);
      if (!found || (questions.auth.student && found.status === 'DRAFT'))
        return route.fulfill({ status: 404, json: {} });
      if (method === 'POST') {
        if (parts[4] === 'open') {
          if (found.status === 'CLOSED') return route.fulfill({ status: 409, json: {} });
          found.status = 'OPEN';
          found.openedAt ??= '2026-11-20T13:00:00.000Z';
        } else {
          if (found.status === 'DRAFT') return route.fulfill({ status: 409, json: {} });
          found.status = 'CLOSED';
          found.closedAt ??= '2026-11-20T14:00:00.000Z';
        }
        return route.fulfill({ json: activitySummary(found) });
      }
      return route.fulfill({ json: found });
    },
  );
  return state;
}
