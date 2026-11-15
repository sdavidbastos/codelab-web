import { useEffect, useRef } from 'react';
export const LEAVE_EVENT = 'codelab:before-leave';
export function useLeaveGuard(dirty: boolean, pending: boolean) {
  const allowed = useRef(false);
  useEffect(() => {
    const leave = (event: Event) => {
      if (allowed.current) {
        allowed.current = false;
        return;
      }
      if (
        pending ||
        (dirty && !window.confirm('Há alterações não salvas. Deseja sair e descartá-las?'))
      )
        event.preventDefault();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || pending) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener(LEAVE_EVENT, leave);
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener(LEAVE_EVENT, leave);
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty, pending]);
  return () => {
    allowed.current = true;
  };
}
