import { parsePage } from '../../shared/api/page';
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
export const parseClassrooms = (value: unknown) => parsePage(value, parseClassroom);
export const parseEnrollments = (value: unknown) => parsePage(value, parseEnrollment);
