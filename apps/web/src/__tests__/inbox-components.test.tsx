import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InboxSidebarFilters } from '../components/inbox/InboxSidebarFilters';
import { InteractionList } from '../components/inbox/InteractionList';
import { ReplyComposer } from '../components/inbox/ReplyComposer';
import { InternalNotesPanel } from '../components/inbox/InternalNotesPanel';
import { SocialInteractionDto, InteractionType, InteractionWorkflowStatus } from '@packages/shared';

describe('Unified Social Inbox Web Components', () => {
  describe('InboxSidebarFilters', () => {
    it('renders workflow views and badges with correct count', () => {
      const onStatusChange = jest.fn();
      const onPlatformChange = jest.fn();
      const onAssignedToMeToggle = jest.fn();
      const onReadFilterChange = jest.fn();

      render(
        <InboxSidebarFilters
          currentStatus="OPEN"
          onStatusChange={onStatusChange}
          currentPlatform=""
          onPlatformChange={onPlatformChange}
          currentAccountId=""
          onAccountChange={jest.fn()}
          assignedToMe={false}
          onAssignedToMeToggle={onAssignedToMeToggle}
          isReadFilter={null}
          onReadFilterChange={onReadFilterChange}
          accounts={[{ id: 'acc-1', accountName: 'Main Page', provider: 'META_FACEBOOK' }]}
          counts={{ unread: 5, open: 12, assignedToMe: 3 }}
        />,
      );

      expect(screen.getByText('All Open')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument(); // Open count
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Assigned count

      // Click tab
      fireEvent.click(screen.getByText('Assigned to Me'));
      expect(onAssignedToMeToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('InteractionList', () => {
    const mockInteractions: SocialInteractionDto[] = [
      {
        id: 'int-1',
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        platform: 'FACEBOOK' as any,
        interactionType: InteractionType.COMMENT,
        externalInteractionId: 'comm-101',
        authorProviderId: 'fb-user-1',
        authorName: 'Sarah Connor',
        content: 'Is this available in black color?',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        isFromPageOrAccount: false,
        workflowStatus: InteractionWorkflowStatus.OPEN,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('renders interactions with author, snippet, and platform badge', () => {
      const onSelect = jest.fn();

      render(
        <InteractionList
          interactions={mockInteractions}
          selectedId={null}
          onSelect={onSelect}
          searchTerm=""
          onSearchChange={jest.fn()}
          isLoading={false}
        />,
      );

      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByText('Is this available in black color?')).toBeInTheDocument();
      expect(screen.getByText('FB')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Sarah Connor'));
      expect(onSelect).toHaveBeenCalledWith(mockInteractions[0]);
    });

    it('displays empty state when list is empty', () => {
      render(
        <InteractionList
          interactions={[]}
          selectedId={null}
          onSelect={jest.fn()}
          searchTerm=""
          onSearchChange={jest.fn()}
          isLoading={false}
        />,
      );

      expect(screen.getByText('No Interactions Found')).toBeInTheDocument();
    });
  });

  describe('ReplyComposer', () => {
    const sampleInteraction: any = {
      id: 'int-1',
      platform: 'FACEBOOK',
      authorName: 'Sarah Connor',
      socialAccount: {
        accountName: 'Acme Support Page',
      },
    };

    it('allows authorized user (EDITOR) to type and submit public reply', async () => {
      const onSendReply = jest.fn().mockResolvedValue({
        success: true,
        message: 'Reply published successfully.',
      });

      render(
        <ReplyComposer
          interaction={sampleInteraction}
          userRole="EDITOR"
          onSendReply={onSendReply}
        />,
      );

      expect(screen.getByText('Acme Support Page')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Reply publicly to Sarah Connor/i);
      fireEvent.change(textarea, { target: { value: 'Yes, black is in stock!' } });

      const sendBtn = screen.getByRole('button', { name: /Send Public Reply/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(onSendReply).toHaveBeenCalledWith('Yes, black is in stock!', expect.any(String));
        expect(screen.getByText(/Reply published successfully/i)).toBeInTheDocument();
      });
    });

    it('hides reply form and displays read-only warning for VIEWER role', () => {
      render(
        <ReplyComposer
          interaction={sampleInteraction}
          userRole="VIEWER"
          onSendReply={jest.fn()}
        />,
      );

      expect(screen.getByText(/You have read-only access/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Reply publicly/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Send Public Reply/i })).not.toBeInTheDocument();
    });
  });

  describe('InternalNotesPanel', () => {
    it('renders private team notes and allows adding notes', async () => {
      const onAddNote = jest.fn().mockResolvedValue(undefined);
      const mockNotes: any[] = [
        {
          id: 'note-1',
          content: 'Escalated to shipping manager.',
          createdAt: new Date().toISOString(),
          authorUser: { name: 'Support Rep' },
        },
      ];

      render(
        <InternalNotesPanel
          notes={mockNotes}
          userRole="ADMIN"
          onAddNote={onAddNote}
        />,
      );

      expect(screen.getByText(/Internal Team Notes/i)).toBeInTheDocument();
      expect(screen.getByText('Escalated to shipping manager.')).toBeInTheDocument();
      expect(screen.getByText('Support Rep')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Add an internal note/i);
      fireEvent.change(textarea, { target: { value: 'Customer confirmed package received.' } });

      const addBtn = screen.getByRole('button', { name: /Add Note/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(onAddNote).toHaveBeenCalledWith('Customer confirmed package received.');
      });
    });
  });
});
