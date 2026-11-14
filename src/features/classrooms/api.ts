import { invalidResponse, isDate, isObject, isUuid } from '../../shared/api/http';

export interface Classroom {
  id: string;
  name: string;
  description: string;
  teacher: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
export interface Enrollment {
  id: string;
  student: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export function parseClassroom(value: unknown): Classroom {
  if (
    !isObject(value) ||
    !isUuid(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    !isDate(value.createdAt) ||
    !isDate(value.updatedAt) ||
    !isObject(value.teacher) ||
    !isUuid(value.teacher.id) ||
    typeof value.teacher.name !== 'string'
  )
    return invalidResponse();
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    teacher: { id: value.teacher.id, name: value.teacher.name },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
export function parseEnrollment(value: unknown): Enrollment {
  if (
    !isObject(value) ||
    !isUuid(value.id) ||
    !isDate(value.createdAt) ||
    !isDate(value.updatedAt) ||
    !isObject(value.student) ||
    !isUuid(value.student.id) ||
    typeof value.student.name !== 'string' ||
    typeof value.student.email !== 'string'
  )
    return invalidResponse();
  return {
    id: value.id,
    student: { id: value.student.id, name: value.student.name, email: value.student.email },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
function parsePage<T>(value: unknown, parse: (item: unknown) => T): Page<T> {
  if (
    !isObject(value) ||
    !Array.isArray(value.items) ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    typeof value.page !== 'number' ||
    !Number.isSafeInteger(value.page) ||
    value.page < 1 ||
    typeof value.pageSize !== 'number' ||
    !Number.isSafeInteger(value.pageSize) ||
    value.pageSize < 1 ||
    value.pageSize > 50 ||
    value.items.length > value.pageSize ||
    value.items.length > value.total
  )
    return invalidResponse();
  return {
    items: value.items.map(parse),
    total: value.total,
    page: value.page,
    pageSize: value.pageSize,
  };
}
export const parseClassrooms = (value: unknown) => parsePage(value, parseClassroom);
export const parseEnrollments = (value: unknown) => parsePage(value, parseEnrollment);
