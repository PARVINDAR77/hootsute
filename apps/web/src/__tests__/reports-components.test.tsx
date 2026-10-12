import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WhiteLabelPage from '../app/(dashboard)/settings/white-label/page';
import ExecutiveReportsPage from '../app/(dashboard)/reports/page';

// Mock workspace context
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-test-123',
      name: 'Omni Media Agency',
      currentUserRole: 'OWNER',
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Phase 19: White-Label and Executive Reports Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WhiteLabelPage', () => {
    it('should render white-label branding settings with initial defaults', async () => {
      mockApiClient.mockResolvedValueOnce({
        brandName: 'Vertex Agency',
        customDomain: 'portal.vertex.com',
        primaryColor: '#6366f1',
        secondaryColor: '#4f46e5',
        accentColor: '#06b6d4',
        hidePoweredBy: true,
        isEnabled: true,
      });

      render(<WhiteLabelPage />);

      await waitFor(() => {
        expect(screen.getByText('White-Label Agency Portal')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Vertex Agency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('portal.vertex.com')).toBeInTheDocument();
      expect(screen.getByText('Live Client Portal Preview')).toBeInTheDocument();
    });

    it('should submit updated branding tokens when clicking Save Branding', async () => {
      mockApiClient
        .mockResolvedValueOnce(null) // initial fetch
        .mockResolvedValueOnce({ success: true }); // save request

      render(<WhiteLabelPage />);

      await waitFor(() => {
        expect(screen.getByText('White-Label Agency Portal')).toBeInTheDocument();
      });

      const brandInput = screen.getByPlaceholderText('e.g. Apex Media Agency');
      fireEvent.change(brandInput, { target: { value: 'Horizon Media Partners' } });

      const saveBtn = screen.getByText('Save Branding');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          'workspaces/ws-test-123/white-label',
          expect.objectContaining({
            method: 'PUT',
          }),
        );
      });
    });
  });

  describe('ExecutiveReportsPage', () => {
    const mockReport = {
      id: 'rep-1',
      workspaceId: 'ws-test-123',
      title: 'Q2 Performance Audit',
      frequency: 'WEEKLY',
      periodStart: '2026-06-01T00:00:00Z',
      periodEnd: '2026-06-07T00:00:00Z',
      metricsSummary: {
        totalImpressions: 45000,
        totalReach: 30000,
        netFollowerGrowth: 350,
        totalLinkClicks: 900,
        totalListeningMentions: 40,
        sentimentBreakdown: { positive: 30, neutral: 8, negative: 2 },
        topPosts: [],
      },
      htmlContent: '<html><body>Mock Executive Report Preview</body></html>',
      recipientsSent: ['cmo@client.com'],
      status: 'READY',
      createdAt: '2026-06-07T01:00:00Z',
    };

    const mockSchedule = {
      id: 'sch-1',
      workspaceId: 'ws-test-123',
      createdById: 'usr-1',
      name: 'Weekly C-Level Digest',
      frequency: 'WEEKLY',
      recipients: ['exec@client.com'],
      includeSocial: true,
      includeLinks: true,
      includeListening: true,
      isActive: true,
      nextRunAt: '2026-06-14T00:00:00Z',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    };

    it('should render empty state when no reports exist', async () => {
      mockApiClient
        .mockResolvedValueOnce([]) // reports
        .mockResolvedValueOnce([]); // schedules

      render(<ExecutiveReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('No Executive Reports Yet')).toBeInTheDocument();
      });

      expect(screen.getByText('Synthesize First Report')).toBeInTheDocument();
    });

    it('should render reports and open view drawer when report exists', async () => {
      mockApiClient
        .mockResolvedValueOnce([mockReport])
        .mockResolvedValueOnce([mockSchedule]);

      render(<ExecutiveReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Q2 Performance Audit')).toBeInTheDocument();
      });

      expect(screen.getAllByText('45,000').length).toBeGreaterThanOrEqual(1); // total impressions
      expect(screen.getAllByText('30,000').length).toBeGreaterThanOrEqual(1); // total reach

      const viewBtn = screen.getByText('View Report');
      fireEvent.click(viewBtn);

      expect(screen.getByText('Print / Save PDF')).toBeInTheDocument();
    });

    it('should switch to schedules tab and list schedules', async () => {
      mockApiClient
        .mockResolvedValueOnce([mockReport])
        .mockResolvedValueOnce([mockSchedule]);

      render(<ExecutiveReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('Automated Schedules (1)')).toBeInTheDocument();
      });

      const schedulesTab = screen.getByText('Automated Schedules (1)');
      fireEvent.click(schedulesTab);

      expect(screen.getByText('Weekly C-Level Digest')).toBeInTheDocument();
      expect(screen.getByText('exec@client.com')).toBeInTheDocument();
    });
  });
});
