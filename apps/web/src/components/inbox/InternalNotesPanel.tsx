'use client';

import React, { useState } from 'react';
import { Lock, Plus, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InteractionNoteDto } from '@packages/shared';

interface InternalNotesPanelProps {
  notes: InteractionNoteDto[];
  userRole?: string;
  onAddNote: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function InternalNotesPanel({
  notes = [],
  userRole = 'VIEWER',
  onAddNote,
  isLoading = false,
}: InternalNotesPanelProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddNote = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || !canAddNote) return;

    setIsSubmitting(true);
    try {
      await onAddNote(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Privacy Notice */}
      <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>Internal Team Notes:</strong> Visible strictly to members of this workspace. Never visible to customers or social platforms.
        </span>
      </div>

      {/* Notes List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center">
            No internal team notes yet on this conversation.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {note.authorUser?.name || 'Team Member'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(note.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      {canAddNote && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-200/80">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add an internal note for your team (e.g. customer context, escalation status)..."
            rows={2}
            disabled={isSubmitting}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 resize-none shadow-2xs"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!content.trim() || isSubmitting}
              className="text-xs gap-1.5 h-7"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
