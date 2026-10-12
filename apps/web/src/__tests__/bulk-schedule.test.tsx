import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkScheduleModal } from '../components/calendar/BulkScheduleModal';
import { SocialPlatform } from '@packages/shared';

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

describe('BulkScheduleModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <BulkScheduleModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render modal header, download template button, and dropzone when open', () => {
    render(
      <BulkScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByText('Bulk CSV Calendar Importer')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
    expect(screen.getByText('Click to upload or drag & drop CSV file')).toBeInTheDocument();
    expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    expect(screen.getByText('Paste CSV Text')).toBeInTheDocument();
  });

  it('should switch to paste CSV tab, validate content, and render validation report', async () => {
    mockApiClient.mockResolvedValueOnce({
      totalRows: 2,
      validCount: 1,
      invalidCount: 1,
      rows: [
        {
          rowNumber: 2,
          isValid: true,
          errors: [],
          warnings: [],
          data: {
            rowNumber: 2,
            scheduledAt: '2026-10-25T10:00:00.000Z',
            timezone: 'UTC',
            caption: 'Exciting announcement about our upcoming product launch!',
            platforms: [SocialPlatform.FACEBOOK, SocialPlatform.TWITTER_X],
            socialAccountIds: ['acc-1', 'acc-2'],
            mediaUrls: [],
            hashtags: ['#Launch'],
          },
          targetAccounts: [
            { id: 'acc-1', name: 'Main FB Page', platform: SocialPlatform.FACEBOOK, username: 'mainfb' },
          ],
        },
        {
          rowNumber: 3,
          isValid: false,
          errors: ['Scheduled time must be at least 2 minutes in the future'],
          warnings: [],
          data: {
            rowNumber: 3,
            scheduledAt: '2026-10-01T10:00:00.000Z',
            timezone: 'UTC',
            caption: 'Past post that should fail validation',
            platforms: [SocialPlatform.LINKEDIN],
            socialAccountIds: [],
            mediaUrls: [],
            hashtags: [],
          },
          targetAccounts: [],
        },
      ],
    });

    render(
      <BulkScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Switch to paste tab
    fireEvent.click(screen.getByText('Paste CSV Text'));

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, {
      target: {
        value: `Scheduled Date,Caption,Platforms\n"2026-10-25 10:00","Exciting announcement","FACEBOOK,TWITTER_X"\n"2026-10-01 10:00","Past post","LINKEDIN"`,
      },
    });

    // Click validate
    const validateBtn = screen.getByRole('button', { name: /Validate Content/i });
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        'workspaces/ws-test-123/bulk-schedule/validate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    // Check KPIs rendered
    await waitFor(() => {
      expect(screen.getByText('Total Rows')).toBeInTheDocument();
      expect(screen.getByText('Valid & Ready')).toBeInTheDocument();
      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    });

    // Check row details
    expect(screen.getByText('Exciting announcement about our upcoming product launch!')).toBeInTheDocument();
    expect(screen.getByText('Scheduled time must be at least 2 minutes in the future')).toBeInTheDocument();
    expect(screen.getByText('Schedule 1 Valid Post(s)')).toBeInTheDocument();
  });

  it('should commit valid posts when schedule button is clicked', async () => {
    mockApiClient
      .mockResolvedValueOnce({
        totalRows: 1,
        validCount: 1,
        invalidCount: 0,
        rows: [
          {
            rowNumber: 2,
            isValid: true,
            errors: [],
            warnings: [],
            data: {
              rowNumber: 2,
              scheduledAt: '2026-10-25T10:00:00.000Z',
              timezone: 'UTC',
              caption: 'Ready post',
              platforms: [SocialPlatform.FACEBOOK],
              socialAccountIds: ['acc-1'],
              mediaUrls: [],
              hashtags: [],
            },
            targetAccounts: [{ id: 'acc-1', name: 'FB Page', platform: SocialPlatform.FACEBOOK }],
          },
        ],
      })
      .mockResolvedValueOnce({
        importedCount: 1,
        failedCount: 0,
        scheduledPosts: [
          {
            rowNumber: 2,
            scheduledPostId: 'sched-post-1',
            draftId: 'draft-1',
            title: 'Bulk Post #2',
            scheduledAt: '2026-10-25T10:00:00.000Z',
            targetCount: 1,
          },
        ],
      });

    render(
      <BulkScheduleModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByText('Paste CSV Text'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test,csv,content' } });
    fireEvent.click(screen.getByRole('button', { name: /Validate Content/i }));

    await waitFor(() => {
      expect(screen.getByText('Schedule 1 Valid Post(s)')).toBeInTheDocument();
    });

    const commitBtn = screen.getByRole('button', { name: /Schedule 1 Valid Post\(s\)/i });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        'workspaces/ws-test-123/bulk-schedule/import',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported and scheduled 1 post\(s\)!/i)).toBeInTheDocument();
    });
  });
});
