'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WorkspaceDto } from '@packages/shared';
import { apiClient } from './api-client';
import { useAuth } from './auth-context';
import { useRouter } from 'next/navigation';

interface WorkspaceContextType {
  workspaces: WorkspaceDto[];
  currentWorkspace: WorkspaceDto | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (data: {
    name: string;
    slug?: string;
    description?: string;
    industry?: string;
    timezone?: string;
    websiteUrl?: string;
  }) => Promise<WorkspaceDto>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = 'omnisocial_active_workspace_id';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDto | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
  const router = useRouter();

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoadingWorkspaces(false);
      return;
    }

    setIsLoadingWorkspaces(true);
    try {
      const data = await apiClient<WorkspaceDto[]>('/workspaces');
      setWorkspaces(data || []);

      if (data && data.length > 0) {
        // Retrieve last selected workspace preference
        const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const matching = data.find((ws) => ws.id === savedId);
        const selected = matching || data[0];
        setCurrentWorkspace(selected);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, selected.id);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } catch {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchWorkspaces();
    }
  }, [isAuthLoading, fetchWorkspaces]);

  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find((ws) => ws.id === workspaceId);
    if (target) {
      setCurrentWorkspace(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, target.id);
      }
      router.refresh();
    }
  };

  const createWorkspace = async (data: {
    name: string;
    slug?: string;
    description?: string;
    industry?: string;
    timezone?: string;
    websiteUrl?: string;
  }) => {
    const newWs = await apiClient<WorkspaceDto>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    await fetchWorkspaces();
    if (newWs && newWs.id) {
      switchWorkspace(newWs.id);
    }
    return newWs;
  };

  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoadingWorkspaces,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
