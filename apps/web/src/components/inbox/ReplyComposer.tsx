'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SocialInteractionDto } from '@packages/shared';

interface ReplyComposerProps {
  interaction: SocialInteractionDto;
  userRole?: string;
  onSendReply: (content: string, idempotencyKey: string) => Promise<{ success: boolean; message?: string }>;
}

export function ReplyComposer({
  interaction,
  userRole = 'VIEWER',
  onSendReply,
}: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canReply = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'EDITOR';
  const maxChars = interaction.platform === 'INSTAGRAM' ? 2200 : 8000;
  const charsRemaining = maxChars - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || !canReply) return;

    setIsSubmitting(true);
    setFeedback(null);

    // Generate unique idempotency key for this reply attempt
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await onSendReply(content.trim(), idempotencyKey);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Reply published successfully to social platform.',
        });
        setContent('');
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to submit reply to provider.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Network error submitting reply.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-slate-50 border-t border-slate-200/80">
      {/* Account Info Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">Replying as:</span>
          <span className="text-indigo-600 font-medium">
            {interaction.socialAccount?.accountName || 'Connected Account'}
          </span>
          <span className="text-[10px] text-slate-400">
            ({interaction.platform === 'FACEBOOK' ? 'Facebook Page' : 'Instagram Professional'} &bull; Public Comment Reply)
          </span>
        </span>

        <span
          className={`text-[11px] font-mono ${
            charsRemaining < 50 ? 'text-amber-600 font-bold' : 'text-slate-400'
          }`}
        >
          {charsRemaining} chars left
        </span>
      </div>

      {feedback && (
        <div
          className={`mb-3 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
          >
            &times;
          </button>
        </div>
      )}

      {!canReply ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You have read-only access (<strong>{userRole}</strong>). Only workspace Editors, Admins, or Owners can publish replies.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Reply publicly to ${interaction.authorName}...`}
            maxLength={maxChars}
            rows={3}
            disabled={isSubmitting}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 resize-none shadow-2xs"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Replies are published directly to {interaction.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram'}.
            </span>

            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="text-xs gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Publishing...' : 'Send Public Reply'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
