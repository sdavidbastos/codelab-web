import { invalidResponse, isDate, isObject, isUuid } from '../../shared/api/http';
import { parsePage } from '../../shared/api/page';

export const COMPARISON_POLICY = 'judge0_text_rstrip_v1';
export const COMPARISON_DESCRIPTION =
  'A comparação é textual. Espaços ASCII, tabulações e quebras de linha ao fim das linhas e da saída são ignorados. Espaços iniciais e internos, maiúsculas, acentos e formatos numéricos diferentes são preservados. Não há tolerância numérica.';
export type Visibility = 'PUBLIC' | 'HIDDEN';
export interface PublicTestCase {
  id: string;
  position: number;
  stdin: string;
  expectedOutput: string;
  explanation: string;
}
export interface TestCase extends PublicTestCase {
  visibility: Visibility;
}
export interface QuestionFields {
  title: string;
  statement: string;
  learningObjective: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string;
  starterCode: string;
  language: 'python3';
  comparisonPolicy: typeof COMPARISON_POLICY;
  cpuTimeLimitSeconds: number;
  wallTimeLimitSeconds: number;
  memoryLimitKb: number;
}
export interface QuestionContent extends QuestionFields {
  testCases: TestCase[];
}
export interface QuestionSummary {
  id: string;
  title: string;
  language: 'python3';
  comparisonPolicy: typeof COMPARISON_POLICY;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  latestVersionNumber: number;
  testCaseCount: number;
}
export interface Question extends QuestionContent {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  latestVersionNumber: number;
}
export interface VersionSummary {
  id: string;
  questionId: string;
  number: number;
  title: string;
  language: 'python3';
  comparisonPolicy: typeof COMPARISON_POLICY;
  cpuTimeLimitSeconds: number;
  wallTimeLimitSeconds: number;
  memoryLimitKb: number;
  publishedAt: string;
  testCaseCount: number;
}
export interface QuestionVersion extends QuestionContent {
  id: string;
  questionId: string;
  number: number;
  publishedAt: string;
}
export interface StudentQuestionVersion extends QuestionFields {
  id: string;
  questionId: string;
  number: number;
  publishedAt: string;
  comparisonDescription: string;
  testCases: PublicTestCase[];
}
const integer = (value: unknown, min: number, max = 2147483647): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
function fields(value: unknown): QuestionFields {
  if (
    !isObject(value) ||
    typeof value.title !== 'string' ||
    typeof value.statement !== 'string' ||
    typeof value.learningObjective !== 'string' ||
    typeof value.inputDescription !== 'string' ||
    typeof value.outputDescription !== 'string' ||
    typeof value.constraints !== 'string' ||
    typeof value.starterCode !== 'string' ||
    value.language !== 'python3' ||
    value.comparisonPolicy !== COMPARISON_POLICY ||
    !integer(value.cpuTimeLimitSeconds, 1, 2) ||
    !integer(value.wallTimeLimitSeconds, value.cpuTimeLimitSeconds, 5) ||
    !integer(value.memoryLimitKb, 16384, 128000)
  )
    return invalidResponse();
  return {
    title: value.title,
    statement: value.statement,
    learningObjective: value.learningObjective,
    inputDescription: value.inputDescription,
    outputDescription: value.outputDescription,
    constraints: value.constraints,
    starterCode: value.starterCode,
    language: 'python3',
    comparisonPolicy: COMPARISON_POLICY,
    cpuTimeLimitSeconds: value.cpuTimeLimitSeconds,
    wallTimeLimitSeconds: value.wallTimeLimitSeconds,
    memoryLimitKb: value.memoryLimitKb,
  };
}
function publicCase(item: unknown, index: number): PublicTestCase {
  if (
    !isObject(item) ||
    !isUuid(item.id) ||
    item.position !== index + 1 ||
    typeof item.stdin !== 'string' ||
    typeof item.expectedOutput !== 'string' ||
    typeof item.explanation !== 'string'
  )
    return invalidResponse();
  return {
    id: item.id,
    position: index + 1,
    stdin: item.stdin,
    expectedOutput: item.expectedOutput,
    explanation: item.explanation,
  };
}
function content(value: unknown): QuestionContent {
  const text = fields(value);
  if (!isObject(value) || !Array.isArray(value.testCases) || value.testCases.length > 20)
    return invalidResponse();
  const testCases = value.testCases.map((item: unknown, index): TestCase => {
    const result = publicCase(item, index);
    if (!isObject(item) || (item.visibility !== 'PUBLIC' && item.visibility !== 'HIDDEN'))
      return invalidResponse();
    return { ...result, visibility: item.visibility };
  });
  return { ...text, testCases };
}
export function parseQuestionSummary(value: unknown): QuestionSummary {
  if (
    !isObject(value) ||
    !isUuid(value.id) ||
    typeof value.title !== 'string' ||
    value.language !== 'python3' ||
    value.comparisonPolicy !== COMPARISON_POLICY ||
    (value.status !== 'DRAFT' && value.status !== 'PUBLISHED') ||
    !isDate(value.createdAt) ||
    !isDate(value.updatedAt) ||
    !integer(value.latestVersionNumber, 0) ||
    !integer(value.testCaseCount, 0, 20) ||
    (value.status === 'DRAFT'
      ? value.publishedAt !== null
      : !isDate(value.publishedAt) || value.latestVersionNumber < 1)
  )
    return invalidResponse();
  return {
    id: value.id,
    title: value.title,
    language: 'python3',
    comparisonPolicy: COMPARISON_POLICY,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    publishedAt: value.status === 'DRAFT' ? null : String(value.publishedAt),
    latestVersionNumber: value.latestVersionNumber,
    testCaseCount: value.testCaseCount,
  };
}
export function parseQuestion(value: unknown): Question {
  const fields = content(value);
  if (!isObject(value)) return invalidResponse();
  const summary = parseQuestionSummary({ ...value, testCaseCount: fields.testCases.length });
  const { testCaseCount: _count, ...metadata } = summary;
  return { ...fields, ...metadata };
}
export function parseVersionSummary(value: unknown): VersionSummary {
  if (
    !isObject(value) ||
    !isUuid(value.id) ||
    !isUuid(value.questionId) ||
    !integer(value.number, 1) ||
    typeof value.title !== 'string' ||
    value.language !== 'python3' ||
    value.comparisonPolicy !== COMPARISON_POLICY ||
    !isDate(value.publishedAt) ||
    !integer(value.cpuTimeLimitSeconds, 1, 2) ||
    !integer(value.wallTimeLimitSeconds, value.cpuTimeLimitSeconds, 5) ||
    !integer(value.memoryLimitKb, 16384, 128000) ||
    !integer(value.testCaseCount, 1, 20)
  )
    return invalidResponse();
  return {
    id: value.id,
    questionId: value.questionId,
    number: value.number,
    title: value.title,
    language: 'python3',
    comparisonPolicy: COMPARISON_POLICY,
    publishedAt: value.publishedAt,
    cpuTimeLimitSeconds: value.cpuTimeLimitSeconds,
    wallTimeLimitSeconds: value.wallTimeLimitSeconds,
    memoryLimitKb: value.memoryLimitKb,
    testCaseCount: value.testCaseCount,
  };
}
export function parseVersion(value: unknown): QuestionVersion {
  const fields = content(value);
  if (!isObject(value)) return invalidResponse();
  const { testCaseCount: _count, ...metadata } = parseVersionSummary({
    ...value,
    testCaseCount: fields.testCases.length,
  });
  return { ...fields, ...metadata };
}
export const parseQuestions = (value: unknown) => parsePage(value, parseQuestionSummary);
export const parseVersions = (value: unknown) => parsePage(value, parseVersionSummary);

// Preview consumes only the server's dedicated public projection. A full teacher
// response, hidden case or unexpected engine field fails closed before rendering.
export function parseStudentVersion(value: unknown): StudentQuestionVersion {
  const text = fields(value);
  const allowed = new Set([
    'id',
    'questionId',
    'number',
    'publishedAt',
    'title',
    'statement',
    'learningObjective',
    'inputDescription',
    'outputDescription',
    'constraints',
    'starterCode',
    'language',
    'comparisonPolicy',
    'comparisonDescription',
    'cpuTimeLimitSeconds',
    'wallTimeLimitSeconds',
    'memoryLimitKb',
    'testCases',
  ]);
  if (
    !isObject(value) ||
    Object.keys(value).some((key) => !allowed.has(key)) ||
    typeof value.comparisonDescription !== 'string' ||
    !value.comparisonDescription.trim() ||
    !Array.isArray(value.testCases) ||
    value.testCases.length > 20
  )
    return invalidResponse();
  const caseKeys = new Set(['id', 'position', 'stdin', 'expectedOutput', 'explanation']);
  const testCases = value.testCases.map((item: unknown, index) => {
    if (!isObject(item) || Object.keys(item).some((key) => !caseKeys.has(key)))
      return invalidResponse();
    return publicCase(item, index);
  });
  const { testCaseCount: _count, ...metadata } = parseVersionSummary({
    ...value,
    testCaseCount: testCases.length,
  });
  return { ...text, ...metadata, comparisonDescription: value.comparisonDescription, testCases };
}
