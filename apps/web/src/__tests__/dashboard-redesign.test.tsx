import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Alex Johnson', email: 'alex@omnisocial.ai', role: 'BUSINESS_OWNER' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    workspaces: [{ id: 'ws-1', name: 'Acme Global Brands', slug: 'acme', currentUserRole: 'OWNER' }],
    currentWorkspace: { id: 'ws-1', name: 'Acme Global Brands', slug: 'acme', currentUserRole: 'OWNER' },
    isLoadingWorkspaces: false,
  }),
}));

const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
  unwrapData: (res: any, fb: any) => (res && typeof res === 'object' && 'data' in res ? res.data : (res ?? fb)),
  unwrapList: (res: any) => (Array.isArray(res) ? res : (res?.data || [])),
}));

describe('Phase 4 Redesigned Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders live KPIs, Performance Overview chart, and all 8 platform rows from real APIs', async () => {
    mockApiClient.mockImplementation((url: string) => {
      if (url.includes('/social-accounts')) {
        return Promise.resolve([
          { id: 'sa-1', provider: 'META_INSTAGRAM', connectionStatus: 'CONNECTED' },
          { id: 'sa-2', provider: 'PINTEREST', connectionStatus: 'CONNECTED' },
        ]);
      }
      if (url.includes('/analytics/overview')) {
        return Promise.resolve({
          totalReach: 248500,
          engagementRate: 8.7,
          totalFollowers: 12400,
          totalEngagement: 4200,
        });
      }
      if (url.includes('/analytics/timeseries')) {
        return Promise.resolve({
          dataPoints: [
            { date: '2026-11-01', reach: 10000, engagement: 800 },
            { date: '2026-11-10', reach: 24000, engagement: 1900 },
          ],
        });
      }
      if (url.includes('/scheduled-posts')) {
        return Promise.resolve([
          { id: 'sp-1', title: 'Holiday Campaign Launch', status: 'SCHEDULED', targets: [] },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Alex!')).toBeInTheDocument();
      expect(screen.getByText('248.5K')).toBeInTheDocument();
      expect(screen.getByText('8.7%')).toBeInTheDocument();
      expect(screen.getByText('12.4K')).toBeInTheDocument();
      expect(screen.getByText('Holiday Campaign Launch')).toBeInTheDocument();
    });

    // All 8 platforms visible in Connected Accounts
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Pinterest')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });
});
