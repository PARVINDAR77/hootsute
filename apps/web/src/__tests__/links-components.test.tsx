import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LinksPage from '../app/(dashboard)/links/page';
import { CreateLinkModal } from '../components/links/CreateLinkModal';
import { LinkAnalyticsDrawer } from '../components/links/LinkAnalyticsDrawer';

// Mock workspace context
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-test-123',
      name: 'Test Workspace',
      currentUserRole: 'OWNER',
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Phase 16 Links Components', () => {
  const mockLink = {
    id: 'link-1',
    workspaceId: 'ws-test-123',
    createdById: 'user-1',
    originalUrl: 'https://example.com/summer-sale',
    shortCode: 'summer2026',
    shortUrl: 'http://localhost:3001/api/v1/links/r/summer2026',
    title: 'Summer Promo Campaign',
    utmSource: 'linkedin',
    utmMedium: 'social',
    utmCampaign: 'summer_promo',
    destinationUrl: 'https://example.com/summer-sale?utm_source=linkedin&utm_medium=social&utm_campaign=summer_promo',
    totalClicks: 25,
    lastClickedAt: '2026-10-12T10:00:00.000Z',
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LinksPage', () => {
    it('should render empty state when no links exist', async () => {
      mockApiClient.mockResolvedValueOnce([]);

      render(<LinksPage />);

      await waitFor(() => {
        expect(screen.getByText('No Shortened Links Yet')).toBeInTheDocument();
      });
      expect(screen.getByText('Shorten New Link')).toBeInTheDocument();
    });

    it('should render links list and KPI cards when links exist', async () => {
      mockApiClient.mockResolvedValueOnce([mockLink]);

      render(<LinksPage />);

      await waitFor(() => {
        expect(screen.getByText('Summer Promo Campaign')).toBeInTheDocument();
      });

      expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1); // click counter
      expect(screen.getByText('summer_promo')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:3001/api/v1/links/r/summer2026')).toBeInTheDocument();
    });
  });

  describe('CreateLinkModal', () => {
    const mockOnClose = jest.fn();
    const mockOnCreated = jest.fn();

    it('should not render anything when isOpen is false', () => {
      const { container } = render(
        <CreateLinkModal isOpen={false} onClose={mockOnClose} onCreated={mockOnCreated} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('should update live UTM preview when destination URL and inputs change', () => {
      render(
        <CreateLinkModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />,
      );

      const destInput = screen.getByLabelText(/Destination URL/i);
      fireEvent.change(destInput, { target: { value: 'https://acmebrand.com/deals' } });

      expect(screen.getByText(/Live Tagged URL Preview:/i)).toBeInTheDocument();
      expect(screen.getByText(/https:\/\/acmebrand.com\/deals\?utm_source=linkedin&utm_medium=social/i)).toBeInTheDocument();
    });

    it('should create link and display generated short link on submit', async () => {
      mockApiClient.mockResolvedValueOnce(mockLink);

      render(
        <CreateLinkModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />,
      );

      const destInput = screen.getByLabelText(/Destination URL/i);
      fireEvent.change(destInput, { target: { value: 'https://example.com/summer-sale' } });

      const submitBtn = screen.getByRole('button', { name: /Create Short Link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockApiClient).toHaveBeenCalledWith(
          'workspaces/ws-test-123/links',
          expect.objectContaining({ method: 'POST' }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Shortened Link Ready!')).toBeInTheDocument();
      });
      expect(mockOnCreated).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('LinkAnalyticsDrawer', () => {
    const mockOnClose = jest.fn();

    it('should fetch and render link analytics breakdown', async () => {
      mockApiClient.mockResolvedValueOnce({
        link: mockLink,
        totalClicks: 25,
        uniqueClicksEstimate: 18,
        clicksOverTime: [{ date: '2026-10-12', clicks: 25 }],
        deviceBreakdown: [
          { deviceType: 'MOBILE', count: 15, percentage: 60 },
          { deviceType: 'DESKTOP', count: 10, percentage: 40 },
        ],
        topReferrers: [{ referrer: 'linkedin.com', count: 20 }],
        recentEvents: [],
      });

      render(
        <LinkAnalyticsDrawer link={mockLink as any} isOpen={true} onClose={mockOnClose} />,
      );

      await waitFor(() => {
        expect(screen.getByText('Click Telemetry & Attribution')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Total Clicks')).toBeInTheDocument();
        expect(screen.getByText('Unique Visitors')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
      });

      expect(screen.getByText(/linkedin.com/i)).toBeInTheDocument();
      expect(screen.getByText(/MOBILE/i)).toBeInTheDocument();
    });
  });
});
