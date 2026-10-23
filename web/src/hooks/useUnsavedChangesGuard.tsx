'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

type ActionGuard = (action: () => void) => void;
let activeActionGuard: ActionGuard | null = null;

export function requestGuardedAction(action: () => void) {
  if (activeActionGuard) activeActionGuard(action);
  else action();
}

function registerActionGuard(guard: ActionGuard) {
  activeActionGuard = guard;
  return () => { if (activeActionGuard === guard) activeActionGuard = null; };
}

export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const popGuardEntry = useRef(false);
  const bypassPop = useRef(false);
  const actionAfterPop = useRef<(() => void) | null>(null);

  const navigateWithoutConfirmation = useCallback((action: () => void) => {
    if (popGuardEntry.current) {
      actionAfterPop.current = action;
      bypassPop.current = true;
      popGuardEntry.current = false;
      window.history.back();
      return;
    }
    action();
  }, []);

  const requestNavigation = useCallback((action: () => void) => {
    if (!isDirty) {
      navigateWithoutConfirmation(action);
      return;
    }
    pendingAction.current = () => navigateWithoutConfirmation(action);
    setDialogOpen(true);
  }, [isDirty, navigateWithoutConfirmation]);

  useEffect(() => registerActionGuard(requestNavigation), [requestNavigation]);

  useEffect(() => {
    if (isDirty || !dialogOpen) return;
    pendingAction.current = null;
    setDialogOpen(false);
  }, [dialogOpen, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const guardedUrl = window.location.href;
    const handlePopState = () => {
      if (bypassPop.current) {
        bypassPop.current = false;
        popGuardEntry.current = false;
        const action = actionAfterPop.current;
        actionAfterPop.current = null;
        action?.();
        return;
      }

      window.history.pushState(window.history.state, '', guardedUrl);
      popGuardEntry.current = true;
      pendingAction.current = () => {
        bypassPop.current = true;
        popGuardEntry.current = false;
        window.history.back();
      };
      setDialogOpen(true);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest('a[href]') as HTMLAnchorElement | null : null;
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      event.preventDefault();
      requestNavigation(() => router.push(`${destination.pathname}${destination.search}${destination.hash}`));
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isDirty, requestNavigation, router]);

  const cancelNavigation = useCallback(() => {
    pendingAction.current = null;
    setDialogOpen(false);
  }, []);

  const confirmNavigation = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setDialogOpen(false);
    action?.();
  }, []);

  const dialog = <ConfirmationDialog
    open={dialogOpen}
    title="Sair sem salvar?"
    message="Há alterações neste cadastro que ainda não foram salvas. Se sair agora, elas serão descartadas."
    confirmLabel="Sair sem salvar"
    cancelLabel="Continuar editando"
    onConfirm={confirmNavigation}
    onCancel={cancelNavigation}
  />;

  return { requestNavigation, navigateWithoutConfirmation, dialog };
}
