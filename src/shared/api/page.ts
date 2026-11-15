import { invalidResponse, isObject } from './http';
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export function parsePage<T>(value: unknown, parse: (item: unknown) => T): Page<T> {
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
