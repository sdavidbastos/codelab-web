import type { Page } from '@playwright/test';
import type { Question, QuestionVersion } from '../../src/features/questions/api';
import { mockClassrooms } from './classrooms-api';

export const question: Question = {
  id: '80000000-0000-4000-8000-000000000001',
  title: 'Soma de dois números',
  statement: 'Leia dois números inteiros e mostre a soma.',
  learningObjective: 'Praticar entrada, conversão e operadores.',
  inputDescription: 'Dois inteiros separados por espaço.',
  outputDescription: 'Um inteiro com a soma.',
  constraints: '-100 ≤ a, b ≤ 100',
  starterCode: '# Leia a entrada e calcule a soma\n',
  language: 'python3',
  comparisonPolicy: 'judge0_text_rstrip_v1',
  cpuTimeLimitSeconds: 2,
  wallTimeLimitSeconds: 5,
  memoryLimitKb: 128000,
  status: 'DRAFT',
  createdAt: '2026-11-14T12:00:00.000Z',
  updatedAt: '2026-11-14T12:00:00.000Z',
  publishedAt: null,
  latestVersionNumber: 0,
  testCases: [
    {
      id: '80000000-0000-4000-8000-000000000002',
      position: 1,
      visibility: 'PUBLIC',
      stdin: '2 3\n',
      expectedOutput: '5\n',
      explanation: 'Dois mais três resulta em cinco.',
    },
  ],
};
export const privateMarker = 'CASO_PRIVADO_F04_ação';
export function snapshot(value: Question, number: number): QuestionVersion {
  const {
    status: _status,
    createdAt: _created,
    updatedAt: _updated,
    latestVersionNumber: _latest,
    ...fields
  } = structuredClone(value);
  return {
    ...fields,
    id: crypto.randomUUID(),
    questionId: value.id,
    number,
    publishedAt: '2026-11-14T13:00:00.000Z',
  };
}
export async function mockQuestions(
  page: Page,
  options: { student?: boolean; empty?: boolean; published?: boolean; hidden?: boolean } = {},
) {
  const auth = await mockClassrooms(page, { student: options.student });
  const initial = structuredClone(question);
  if (options.hidden) {
    initial.testCases[0].position = 2;
    initial.testCases.unshift({
      id: '80000000-0000-4000-8000-000000000003',
      position: 1,
      visibility: 'HIDDEN',
      stdin: privateMarker + '_entrada',
      expectedOutput: privateMarker + '_esperado',
      explanation: privateMarker + '_explicação',
    });
  }
  if (options.published)
    Object.assign(initial, {
      status: 'PUBLISHED',
      latestVersionNumber: 1,
      publishedAt: '2026-11-14T13:00:00.000Z',
    });
  const state = {
    auth,
    questions: options.empty ? [] : [initial],
    versions: options.published ? [snapshot(initial, 1)] : ([] as QuestionVersion[]),
    requests: [] as {
      path: string;
      query: string;
      method: string;
      csrf?: string;
      body?: unknown;
    }[],
  };
  await page.route(
    (url) => url.pathname.startsWith('/api/questions'),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const body: unknown = req.postData() ? req.postDataJSON() : undefined;
      state.requests.push({
        path,
        method,
        query: url.search,
        csrf: req.headers()['x-csrf-token'],
        body,
      });
      if (!auth.authenticated) return route.fulfill({ status: 401, json: {} });
      if (auth.student) return route.fulfill({ status: 403, json: {} });
      function paginated<T>(items: T[]) {
        const pageNumber = Number(url.searchParams.get('page') ?? 1);
        const pageSize = Number(url.searchParams.get('pageSize') ?? 12);
        return {
          items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          total: items.length,
          page: pageNumber,
          pageSize,
        };
      }
      if (path === '/api/questions') {
        if (method === 'POST') {
          const created = {
            ...structuredClone(question),
            ...(body as Partial<Question>),
            id: crypto.randomUUID(),
            status: 'DRAFT' as const,
            latestVersionNumber: 0,
            publishedAt: null,
          };
          created.testCases = created.testCases.map((item, index) => ({
            ...item,
            id: crypto.randomUUID(),
            position: index + 1,
          }));
          state.questions.push(created);
          return route.fulfill({ status: 201, json: created });
        }
        const items = state.questions
          .filter(
            (item) =>
              item.title
                .toLowerCase()
                .includes((url.searchParams.get('search') ?? '').toLowerCase()) &&
              (!url.searchParams.get('status') || item.status === url.searchParams.get('status')),
          )
          .map((item) => ({ ...item, testCaseCount: item.testCases.length }));
        return route.fulfill({ json: paginated(items) });
      }
      const parts = path.split('/');
      const found = state.questions.find((item) => item.id === parts[3]);
      if (!found) return route.fulfill({ status: 404, json: {} });
      if (parts[4] === 'publish' && method === 'POST') {
        if (found.status === 'DRAFT') {
          if (!found.testCases.some((item) => item.visibility === 'PUBLIC'))
            return route.fulfill({ status: 409, json: {} });
          found.status = 'PUBLISHED';
          found.publishedAt = '2026-11-14T13:00:00.000Z';
          found.latestVersionNumber++;
          state.versions.push(snapshot(found, found.latestVersionNumber));
        }
        return route.fulfill({ json: found });
      }
      if (parts[4] === 'draft' && method === 'POST') {
        found.status = 'DRAFT';
        found.publishedAt = null;
        return route.fulfill({ json: found });
      }
      if (parts[4] === 'versions') {
        const versions = state.versions
          .filter((v) => v.questionId === found.id)
          .sort((a, b) => b.number - a.number);
        if (parts[5]) {
          const version = versions.find((v) => v.number === Number(parts[5]));
          if (!version) return route.fulfill({ status: 404, json: {} });
          if (parts[6] === 'preview') {
            const { testCases, ...fields } = version;
            return route.fulfill({
              json: {
                ...fields,
                comparisonDescription:
                  'Comparação textual: espaços finais são ignorados. Não há tolerância numérica.',
                testCases: testCases
                  .filter((item) => item.visibility === 'PUBLIC')
                  .map(({ visibility: _visibility, ...item }, index) => ({
                    ...item,
                    position: index + 1,
                  })),
              },
            });
          }
          return route.fulfill({ json: version });
        }
        return route.fulfill({
          json: paginated(versions.map((v) => ({ ...v, testCaseCount: v.testCases.length }))),
        });
      }
      if (method === 'PATCH') {
        if (found.status !== 'DRAFT') return route.fulfill({ status: 409, json: {} });
        Object.assign(found, body);
        found.testCases = found.testCases.map((item, index) => ({
          ...item,
          id: crypto.randomUUID(),
          position: index + 1,
        }));
      }
      if (method === 'DELETE') {
        if (found.latestVersionNumber) return route.fulfill({ status: 409, json: {} });
        state.questions = state.questions.filter((item) => item.id !== found.id);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: found });
    },
  );
  return state;
}
