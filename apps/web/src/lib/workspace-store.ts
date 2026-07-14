'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { Workspace } from '@/types/api';

const CURRENT_WORKSPACE_KEY = 'current_workspace';
const CURRENT_WORKSPACE_EVENT = 'current_workspace_changed';

function readWorkspaceSnapshot() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_WORKSPACE_KEY);
}

function subscribeToWorkspace(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener('storage', callback);
  window.addEventListener(CURRENT_WORKSPACE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CURRENT_WORKSPACE_EVENT, callback);
  };
}

export function setCurrentWorkspace(workspace: Workspace) {
  localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(workspace));
  window.dispatchEvent(new Event(CURRENT_WORKSPACE_EVENT));
}

export function useCurrentWorkspace(): Workspace | null {
  const snapshot = useSyncExternalStore(subscribeToWorkspace, readWorkspaceSnapshot, () => null);

  return useMemo(() => {
    if (!snapshot) return null;

    try {
      return JSON.parse(snapshot) as Workspace;
    } catch {
      return null;
    }
  }, [snapshot]);
}
