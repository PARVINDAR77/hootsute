'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api-client';
import {
  DraftApprovalProgressDto,
  DraftStepReviewDto,
  ApprovalStepStatus,
  WorkspaceRole,
} from '@packages/shared';

interface ApprovalMatrixStepperProps {
  workspaceId: string;
  draftId: string;
  progress: DraftApprovalProgressDto | null;
  onRefresh: () => void;
  currentUserRole?: WorkspaceRole | string;
}

export function ApprovalMatrixStepper({
  workspaceId,
  draftId,
  progress,
  onRefresh,
  currentUserRole = 'EDITOR',
}: ApprovalMatrixStepperProps) {
  const [activeDecisionStepId, setActiveDecisionStepId] = useState<string | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REQUEST_CHANGES'>('APPROVE');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!progress || progress.steps.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 mb-2">No approval matrix steps initialized for this draft.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await apiClient(`/workspaces/${workspaceId}/drafts/${draftId}/approval/init`, {
                method: 'POST',
              });
              onRefresh();
            } catch (err: any) {
              alert(err.message || 'Failed to initialize approval matrix');
            }
          }}
          className="text-xs"
        >
          Submit to Multi-Stage Review
        </Button>
      </div>
    );
  }

  const handleRecordDecision = async (stepId: string) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await apiClient(
        `/workspaces/${workspaceId}/drafts/${draftId}/approval/steps/${stepId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: decisionType,
            notes: feedbackNotes.trim() || undefined,
          }),
        },
      );
      setActiveDecisionStepId(null);
      setFeedbackNotes('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record approval decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (status: ApprovalStepStatus) => {
    switch (status) {
      case ApprovalStepStatus.APPROVED:
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case ApprovalStepStatus.CHANGES_REQUESTED:
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case ApprovalStepStatus.PENDING:
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Approval Matrix &amp; Multi-Stage Review
          </h3>
          <p className="text-xs text-slate-500">
            {progress.workflowName || 'Standard Approval Pipeline'} ({progress.totalSteps} stages)
          </p>
        </div>
        <div>
          {progress.isFullyApproved ? (
            <Badge variant="success" className="font-semibold text-xs">
              Fully Approved
            </Badge>
          ) : progress.isChangesRequested ? (
            <Badge variant="danger" className="font-semibold text-xs">
              Changes Requested
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
              In Review (Step {progress.currentStepOrder}/{progress.totalSteps})
            </Badge>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Stepper Timeline */}
      <div className="space-y-3">
        {progress.steps.map((step, index) => {
          const isCurrentActive = step.status === ApprovalStepStatus.PENDING;
          const isDecidingThis = activeDecisionStepId === step.stepId;

          return (
            <div
              key={step.id || step.stepId}
              className={`p-3.5 rounded-xl border transition-all ${
                step.status === ApprovalStepStatus.APPROVED
                  ? 'bg-emerald-50/30 border-emerald-200/80'
                  : step.status === ApprovalStepStatus.CHANGES_REQUESTED
                  ? 'bg-rose-50/30 border-rose-200/80'
                  : isCurrentActive
                  ? 'bg-indigo-50/20 border-indigo-200'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 shadow-2xs">
                    {getStepIcon(step.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {step.stepOrder}. {step.stepName}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        Req: {step.requiredRole}
                      </Badge>
                    </div>
                    {step.reviewerName && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reviewed by <strong className="text-slate-700">{step.reviewerName}</strong>
                        {step.decidedAt && ` on ${new Date(step.decidedAt).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {step.status === ApprovalStepStatus.PENDING && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveDecisionStepId(isDecidingThis ? null : step.stepId);
                        setDecisionType('APPROVE');
                      }}
                      className="text-xs h-7"
                    >
                      {isDecidingThis ? 'Cancel' : 'Review Step'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Decision Feedback Note */}
              {step.decisionNotes && (
                <div className="mt-2.5 p-2.5 rounded-lg text-xs bg-white/80 border border-slate-200/60 text-slate-700">
                  <span className="font-semibold text-slate-900">Reviewer Note: </span>
                  {step.decisionNotes}
                </div>
              )}

              {/* Active Decision Panel */}
              {isDecidingThis && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionType('APPROVE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        decisionType === 'APPROVE'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Step
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionType('REQUEST_CHANGES')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        decisionType === 'REQUEST_CHANGES'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      Request Changes
                    </button>
                  </div>

                  <Input
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder={
                      decisionType === 'APPROVE'
                        ? 'Optional praise or sign-off notes...'
                        : 'Mandatory change request feedback (e.g. edit hashtags, update image)...'
                    }
                    className="text-xs h-8"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveDecisionStepId(null)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSubmitting || (decisionType === 'REQUEST_CHANGES' && !feedbackNotes.trim())}
                      onClick={() => handleRecordDecision(step.stepId)}
                      className={`text-xs h-7 ${
                        decisionType === 'APPROVE'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {isSubmitting ? 'Recording...' : `Confirm ${decisionType === 'APPROVE' ? 'Approval' : 'Changes'}`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
