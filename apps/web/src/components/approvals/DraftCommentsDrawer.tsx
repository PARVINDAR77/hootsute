'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { DraftCommentDto } from '@packages/shared';

interface DraftCommentsDrawerProps {
  workspaceId: string;
  draftId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export function DraftCommentsDrawer({
  workspaceId,
  draftId,
  isOpen,
  onClose,
  currentUserId,
  currentUserRole,
}: DraftCommentsDrawerProps) {
  const [comments, setComments] = useState<DraftCommentDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!workspaceId || !draftId) return;
    setIsLoading(true);
    try {
      const res = await apiClient<any>(
        `/workspaces/${workspaceId}/drafts/${draftId}/comments`,
      );
      setComments(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, workspaceId, draftId]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/workspaces/${workspaceId}/drafts/${draftId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/workspaces/${workspaceId}/drafts/${draftId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyText.trim(),
          parentCommentId,
        }),
      });
      setReplyText('');
      setReplyingToId(null);
      fetchComments();
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolve = async (commentId: string) => {
    try {
      await apiClient(
        `/workspaces/${workspaceId}/drafts/${draftId}/comments/${commentId}/resolve`,
        { method: 'PATCH' },
      );
      fetchComments();
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await apiClient(`/workspaces/${workspaceId}/drafts/${draftId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Review Comments</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
            {comments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading discussion threads...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No comments yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Start the conversation by suggesting edits, feedback, or copy adjustments.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${comment.isResolved
                  ? 'bg-slate-50/80 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 shadow-2xs'
                }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {comment.authorName ? comment.authorName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{comment.authorName}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleResolve(comment.id)}
                    title={comment.isResolved ? 'Mark as unresolved' : 'Resolve thread'}
                    className={`p-1 rounded-md transition-colors ${comment.isResolved
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-400 hover:text-emerald-600'
                      }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Delete comment"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal">{comment.content}</p>

              {comment.isResolved && comment.resolvedByName && (
                <div className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  Resolved by {comment.resolvedByName}
                </div>
              )}

              {/* Threaded Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-3 border-l-2 border-indigo-100 space-y-2 mt-2 pt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-[11px]">
                          {reply.authorName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Trigger & Input */}
              <div className="pt-1">
                {replyingToId === comment.id ? (
                  <div className="flex gap-1.5 mt-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="text-xs h-7 flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={isSubmitting || !replyText.trim()}
                      className="text-xs h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingToId(null)}
                      className="text-xs h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingToId(comment.id)}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Root Comment Input */}
      <form onSubmit={handleAddComment} className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add review feedback..."
          className="text-xs h-9 bg-white"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !newComment.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
