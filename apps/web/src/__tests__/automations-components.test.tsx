import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutomationsPage from '../app/(dashboard)/automations/page';
import {
  AutomationRuleDto,
  AutomationRecipeDto,
  AutomationExecutionLogDto,
  AutomationTriggerType,
  AutomationActionType,
  AutomationExecutionStatus,
} from '@packages/shared';

// Mock workspace context
let mockCurrentRole = 'OWNER';
jest.mock('@/lib/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'ws-auto-test',
      name: 'Omni Workspace',
      currentUserRole: mockCurrentRole,
    },
  }),
}));

// Mock api client
const mockApiClient = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiClient: (...args: any[]) => mockApiClient(...args),
}));

describe('Smart Automations & Workflows Page', () => {
  const mockRules: AutomationRuleDto[] = [
    {
      id: 'rule-1',
      workspaceId: 'ws-auto-test',
      name: 'Spam & Abuse Shield',
      description: 'Auto-hides spammy comments',
      triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
      conditions: { keywords: ['crypto', 'telegram'] },
      actionType: AutomationActionType.AUTO_HIDE_SPAM,
      actionConfig: {},
      isEnabled: true,
      executionCount: 14,
      lastExecutedAt: '2026-10-12T10:00:00Z',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    },
  ];

  const mockRecipes: AutomationRecipeDto[] = [
    {
      id: 'recipe-spam-shield',
      name: 'Smart Spam & Scammer Shield',
      description: 'Automatically hides abusive comments',
      category: 'MODERATION',
      triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
      actionType: AutomationActionType.AUTO_HIDE_SPAM,
      defaultConditions: { keywords: ['click link in bio'] },
      defaultActionConfig: {},
    },
  ];

  const mockLogs: AutomationExecutionLogDto[] = [
    {
      id: 'log-1',
      ruleId: 'rule-1',
      workspaceId: 'ws-auto-test',
      triggerEvent: 'INBOX_NEW_MESSAGE',
      status: AutomationExecutionStatus.SUCCESS,
      outputResult: { action: 'AUTO_HIDE_SPAM' },
      executedAt: '2026-10-12T10:00:00Z',
    },
  ];

  beforeEach(() => {
    mockCurrentRole = 'OWNER';
    jest.clearAllMocks();

    mockApiClient.mockImplementation((url: string) => {
      if (url.includes('/automations/templates')) {
        return Promise.resolve({ success: true, data: mockRecipes });
      }
      if (url.includes('/automations/logs')) {
        return Promise.resolve({ success: true, data: mockLogs });
      }
      if (url.endsWith('/automations')) {
        return Promise.resolve({ success: true, data: mockRules });
      }
      return Promise.resolve({ success: true });
    });
  });

  it('renders header, stats, and active workflow rules', async () => {
    render(<AutomationsPage />);

    expect(screen.getByText(/Smart Automations & Workflows/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Spam & Abuse Shield')).toBeInTheDocument();
      expect(screen.getByText(/14 executions/i)).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('allows toggling rule status', async () => {
    render(<AutomationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Disable')).toBeInTheDocument();
    });

    const disableBtn = screen.getByText('Disable');
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/workspaces/ws-auto-test/automations/rule-1/toggle',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('renders pre-built recipes tab and applies template into modal', async () => {
    render(<AutomationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/1-Click Recipes/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/1-Click Recipes/i));

    await waitFor(() => {
      expect(screen.getByText('Smart Spam & Scammer Shield')).toBeInTheDocument();
    });

    const useRecipeBtn = screen.getByText('Use This Recipe');
    fireEvent.click(useRecipeBtn);

    await waitFor(() => {
      expect(screen.getByText('Configure Automation Rule')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smart Spam & Scammer Shield')).toBeInTheDocument();
    });
  });

  it('opens dry-run test modal and runs simulation', async () => {
    mockApiClient.mockImplementation((url: string) => {
      if (url.includes('/test')) {
        return Promise.resolve({
          success: true,
          data: {
            matched: true,
            actionType: AutomationActionType.AUTO_HIDE_SPAM,
            simulatedOutput: { status: 'WOULD_HIDE_COMMENT' },
            reason: 'Rule matched sample payload successfully',
          },
        });
      }
      if (url.includes('/automations/templates')) return Promise.resolve({ success: true, data: mockRecipes });
      if (url.includes('/automations/logs')) return Promise.resolve({ success: true, data: mockLogs });
      if (url.endsWith('/automations')) return Promise.resolve({ success: true, data: mockRules });
      return Promise.resolve({ success: true });
    });

    render(<AutomationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Dry-Run Test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dry-Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Dry-Run Test Simulation')).toBeInTheDocument();
    });

    const runBtn = screen.getByText('Run Simulation');
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText('Rule Matched!')).toBeInTheDocument();
      expect(screen.getByText(/WOULD_HIDE_COMMENT/i)).toBeInTheDocument();
    });
  });

  it('renders execution audit logs tab', async () => {
    render(<AutomationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Execution Audit Logs/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Execution Audit Logs/i));

    await waitFor(() => {
      expect(screen.getByText('Automation Audit Trail')).toBeInTheDocument();
      expect(screen.getByText('INBOX_NEW_MESSAGE')).toBeInTheDocument();
    });
  });
});
