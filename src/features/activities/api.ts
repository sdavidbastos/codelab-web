import { invalidResponse, isDate, isObject, isUuid } from '../../shared/api/http';
import { parsePage } from '../../shared/api/page';
import {
  COMPARISON_POLICY,
  parseStudentVersion,
  type StudentQuestionVersion,
} from '../questions/api';

export type ActivityStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export const statusLabels: Record<ActivityStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberta',
  CLOSED: 'Encerrada',
};
export interface ActivitySummary {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  classroom: { id: string; name: string };
  questionVersion: {
    id: string;
    questionId: string;
    number: number;
    title: string;
    language: 'python3';
    comparisonPolicy: typeof COMPARISON_POLICY;
    publishedAt: string;
  };
}
export interface Activity extends Omit<ActivitySummary, 'questionVersion'> {
  questionVersion: StudentQuestionVersion;
}
function metadata(value: unknown): ActivitySummary {
  if (!isObject(value)) return invalidResponse();
  const version = value.questionVersion;
  const classroom = value.classroom;
  if (
    Object.keys(value).some(
      (key) =>
        ![
          'id',
          'title',
          'description',
          'status',
          'openedAt',
          'closedAt',
          'createdAt',
          'updatedAt',
          'classroom',
          'questionVersion',
        ].includes(key),
    ) ||
    !isUuid(value.id) ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    !isDate(value.createdAt) ||
    !isDate(value.updatedAt) ||
    !isObject(classroom) ||
    !isUuid(classroom.id) ||
    typeof classroom.name !== 'string' ||
    Object.keys(classroom).some((key) => !['id', 'name'].includes(key)) ||
    !isObject(version) ||
    !isUuid(version.id) ||
    !isUuid(version.questionId) ||
    typeof version.number !== 'number' ||
    !Number.isInteger(version.number) ||
    version.number < 1 ||
    version.number > 2147483647 ||
    typeof version.title !== 'string' ||
    version.language !== 'python3' ||
    version.comparisonPolicy !== COMPARISON_POLICY ||
    !isDate(version.publishedAt)
  )
    return invalidResponse();
  if (value.status === 'DRAFT') {
    if (value.openedAt !== null || value.closedAt !== null) return invalidResponse();
  } else if (value.status === 'OPEN') {
    if (!isDate(value.openedAt) || value.closedAt !== null) return invalidResponse();
  } else if (value.status === 'CLOSED') {
    if (
      !isDate(value.openedAt) ||
      !isDate(value.closedAt) ||
      Date.parse(value.closedAt) < Date.parse(value.openedAt)
    )
      return invalidResponse();
  } else return invalidResponse();
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    status: value.status,
    openedAt: value.openedAt as string | null,
    closedAt: value.closedAt as string | null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    classroom: { id: classroom.id, name: classroom.name },
    questionVersion: {
      id: version.id,
      questionId: version.questionId,
      number: version.number,
      title: version.title,
      language: 'python3',
      comparisonPolicy: COMPARISON_POLICY,
      publishedAt: version.publishedAt,
    },
  };
}
export function parseActivitySummary(value: unknown): ActivitySummary {
  const summary = metadata(value);
  if (
    !isObject(value) ||
    !isObject(value.questionVersion) ||
    Object.keys(value.questionVersion).some(
      (key) =>
        ![
          'id',
          'questionId',
          'number',
          'title',
          'language',
          'comparisonPolicy',
          'publishedAt',
        ].includes(key),
    )
  )
    return invalidResponse();
  return summary;
}
export function parseActivity(value: unknown): Activity {
  const summary = metadata(value);
  if (!isObject(value)) return invalidResponse();
  return { ...summary, questionVersion: parseStudentVersion(value.questionVersion) };
}
export const parseActivities = (value: unknown) => parsePage(value, parseActivitySummary);
