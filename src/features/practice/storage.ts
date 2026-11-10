import { isUuid } from './api/executions';
import type { Snapshot } from './api/executions';
import type { Exercise } from './exercises';
export type Draft = { sourceCode: string; stdin: string; expectedOutput: string; compare: boolean };
export type SavedRun = { id: string; snapshot: Snapshot };
const prefix = 'codelab-react:v1:';
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(prefix + key) ?? 'null') as unknown;
  } catch {
    return null;
  }
}
function validDraft(value: unknown): value is Draft {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'sourceCode' in value &&
    typeof value.sourceCode === 'string' &&
    value.sourceCode.length <= 40000 &&
    'stdin' in value &&
    typeof value.stdin === 'string' &&
    value.stdin.length <= 20000 &&
    'expectedOutput' in value &&
    typeof value.expectedOutput === 'string' &&
    value.expectedOutput.length <= 20000 &&
    'compare' in value &&
    typeof value.compare === 'boolean'
  );
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function defaultDraft(exercise: Exercise): Draft {
  return {
    sourceCode: exercise.starter,
    stdin: exercise.examples[0].input,
    expectedOutput: exercise.examples[0].expected,
    compare: true,
  };
}
export function loadDraft(exercise: Exercise): Draft {
  const value = read(`draft:${exercise.id}`);
  return validDraft(value) ? value : defaultDraft(exercise);
}
export const saveDraft = (id: string, draft: Draft) => write(`draft:${id}`, draft);
export const saveRun = (id: string, snapshot: Snapshot) =>
  write(`run:${snapshot.exerciseId}`, { id, snapshot });
export function loadRun(exerciseId: string): SavedRun | null {
  const value = read(`run:${exerciseId}`);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !isUuid(value.id) ||
    !('snapshot' in value) ||
    !validDraft(value.snapshot) ||
    !('exerciseId' in value.snapshot) ||
    value.snapshot.exerciseId !== exerciseId
  )
    return null;
  return {
    id: value.id,
    snapshot: {
      exerciseId,
      sourceCode: value.snapshot.sourceCode,
      stdin: value.snapshot.stdin,
      expectedOutput: value.snapshot.expectedOutput,
      compare: value.snapshot.compare,
    },
  };
}
