import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InboxModerationPage from '../app/(dashboard)/settings/inbox-moderation/page';

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

describe('Phase 20: Inbox Moderation & Triage Components', () => {
  const mockRule = {
    id: 'rule-1',
    workspaceId: 'ws-test-123',
    name: 'Auto-Flag Crisis Terms',
    description: 'Flags urgent escalations',
    triggerSentiment: 'NEGATIVE',
    keywords: ['scam', 'fraud'],
    action: 'AUTO_FLAG',
    actionPayload: {},
    isEnabled: true,
    priority: 15,
    executionCount: 7,
    lastTriggeredAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };

  const mockTemplate = {
    id: 'tmpl-1',
    workspaceId: 'ws-test-123',
    title: 'Apology & Support Ticket',
    content: 'We sincerely apologize for the inconvenience.',
    category: 'SUPPORT',
    sentimentMatch: 'NEGATIVE',
    usageCount: 12,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no rules exist', async () => {
    mockApiClient
      .mockResolvedValueOnce([]) // rules
      .mockResolvedValueOnce([]); // templates

    render(<InboxModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('No Auto-Moderation Rules Configured')).toBeInTheDocument();
    });
  });

  it('renders rules and opens new rule modal', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockRule])
      .mockResolvedValueOnce([mockTemplate]);

    render(<InboxModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Auto-Flag Crisis Terms')).toBeInTheDocument();
    });

    expect(screen.getByText('Executions: 7')).toBeInTheDocument();

    const newRuleBtn = screen.getByText('New Moderation Rule');
    fireEvent.click(newRuleBtn);

    expect(screen.getByPlaceholderText('e.g. Flag Crisis & Fraud Complaints')).toBeInTheDocument();
  });

  it('switches to reply templates tab and renders templates', async () => {
    mockApiClient
      .mockResolvedValueOnce([mockRule])
      .mockResolvedValueOnce([mockTemplate]);

    render(<InboxModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('AI Quick-Reply Templates (1)')).toBeInTheDocument();
    });

    const templatesTab = screen.getByText('AI Quick-Reply Templates (1)');
    fireEvent.click(templatesTab);

    expect(screen.getByText('Apology & Support Ticket')).toBeInTheDocument();
    expect(screen.getByText('Usage: 12 times')).toBeInTheDocument();
  });
});
