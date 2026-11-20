import type { Visibility } from './api';
export function CaseCounts({ cases }: { cases: readonly { visibility: Visibility }[] }) {
  const publicCount = cases.filter((item) => item.visibility === 'PUBLIC').length;
  const hiddenCount = cases.length - publicCount;
  return (
    <>
      {publicCount} {publicCount === 1 ? 'público' : 'públicos'} · {hiddenCount}{' '}
      {hiddenCount === 1 ? 'oculto' : 'ocultos'}
    </>
  );
}
