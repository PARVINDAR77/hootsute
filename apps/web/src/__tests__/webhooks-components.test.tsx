import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WebhooksPage from '../app/(dashboard)/settings/webhooks/page';
import { WebhookDeliveryStatus } from '@packages/shared';

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

describe('Phase 22: Outbound Webhooks & Developer Integrations Components', () => {
  const mockSubscription = {
    id: 'sub-1',
    workspaceId: 'ws-test-123',
    name: 'Slack Incident Channel',
    targetUrl: 'https://hooks.slack.com/services/T00/B00/X00',
    secretKey: 'whsec_8f93e1a04b8543dc81045239e2ba90e87265a',
    eventTypes: ['post.published', 'inbox.crisis_flagged'],
    isActive: true,
    description: 'Emergency notifications dispatched directly to ops room',
    failureCount: 0,
    lastTriggeredAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    deliveries: [],
  };

  const mockDelivery = {
    id: 'del-1',
    subscriptionId: 'sub-1',
    workspaceId: 'ws-test-123',
    eventType: 'inbox.crisis_flagged',
    payload: {
      interactionId: 'inter-8829',
      sentiment: 'NEGATIVE',
      reason: 'Threatened legal escalation',
    },
    statusCode: 200,
    durationMs: 142,
    responseBody: '{"ok":true}',
    errorMessage: null,
    status: WebhookDeliveryStatus.SUCCESS,
    attemptNumber: 1,
    nextRetryAt: null,
    createdAt: '2026-06-01T00:00:00Z',
    subscriptionName: 'Slack Incident Channel',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, endpoints tab, and configured subscription cards', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockSubscription]) // subscriptions
      .mockResolvedValueOnce([mockDelivery]); // deliveries

    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Outbound Webhooks & Developer Integrations')).toBeInTheDocument();
      expect(screen.getByText('Slack Incident Channel')).toBeInTheDocument();
      expect(screen.getByText('https://hooks.slack.com/services/T00/B00/X00')).toBeInTheDocument();
    });

    expect(screen.getByText('post.published')).toBeInTheDocument();
    expect(screen.getByText('inbox.crisis_flagged')).toBeInTheDocument();
  });

  it('switches to delivery logs tab and renders log entries', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockSubscription])
      .mockResolvedValueOnce([mockDelivery]);

    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Slack Incident Channel')).toBeInTheDocument();
    });

    const logsTab = screen.getByRole('button', { name: /Delivery Logs/i });
    fireEvent.click(logsTab);

    expect(screen.getByText('Outbound Delivery Stream')).toBeInTheDocument();
    expect(screen.getByText('142ms')).toBeInTheDocument();
    expect(screen.getByText('HTTP 200')).toBeInTheDocument();
  });

  it('opens and closes register webhook modal', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockSubscription])
      .mockResolvedValueOnce([mockDelivery]);

    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByText('Slack Incident Channel')).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole('button', { name: /Register Webhook/i });
    fireEvent.click(registerBtn);

    expect(screen.getByText('Register New Webhook Endpoint')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Slack Crisis Alerts, Data Lake Sync')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByPlaceholderText('e.g. Slack Crisis Alerts, Data Lake Sync')).not.toBeInTheDocument();
  });
});
