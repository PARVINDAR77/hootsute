'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import {
  InboxModerationRuleDto,
  InboxAutoReplyTemplateDto,
  InboxModerationAction,
  CreateInboxModerationRuleDto,
  CreateInboxAutoReplyTemplateDto,
} from '@packages/shared';
import {
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  EyeOff,
  CheckCircle2,
  X,
  Tag,
  Search,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export default function InboxModerationPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [activeTab, setActiveTab] = useState<'rules' | 'templates'>('rules');
  const [rules, setRules] = useState<InboxModerationRuleDto[]>([]);
  const [templates, setTemplates] = useState<InboxAutoReplyTemplateDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category filter for templates
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  // Rule Form State
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleDescription, setRuleDescription] = useState<string>('');
  const [ruleSentiment, setRuleSentiment] = useState<string>('ALL');
  const [ruleKeywords, setRuleKeywords] = useState<string>('');
  const [ruleAction, setRuleAction] = useState<InboxModerationAction>(InboxModerationAction.AUTO_FLAG);
  const [rulePriority, setRulePriority] = useState<number>(10);
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);

  // Template Form State
  const [tmplTitle, setTmplTitle] = useState<string>('');
  const [tmplContent, setTmplContent] = useState<string>('');
  const [tmplCategory, setTmplCategory] = useState<string>('GENERAL');
  const [tmplSentimentMatch, setTmplSentimentMatch] = useState<string>('ALL');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [rulesRes, tmplsRes] = await Promise.all([
        apiClient<any>(`workspaces/${workspaceId}/inbox/moderation-rules`),
        apiClient<any>(`workspaces/${workspaceId}/inbox/reply-templates`),
      ]);
      setRules(rulesRes.data ?? rulesRes ?? []);
      setTemplates(tmplsRes.data ?? tmplsRes ?? []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load inbox moderation data');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    if (!ruleName.trim()) {
      setErrorMsg('Rule name is required');
      return;
    }

    setIsSavingRule(true);
    setErrorMsg(null);

    const kwList = ruleKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const payload: CreateInboxModerationRuleDto = {
      name: ruleName.trim(),
      description: ruleDescription.trim() || undefined,
      triggerSentiment: ruleSentiment,
      keywords: kwList,
      action: ruleAction,
      priority: rulePriority,
      isEnabled: true,
    };

    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/inbox/moderation-rules`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newRule: InboxModerationRuleDto = res.data ?? res;
      setRules([newRule, ...rules]);
      setIsRuleModalOpen(false);
      setRuleName('');
      setRuleDescription('');
      setRuleKeywords('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create moderation rule');
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    if (!tmplTitle.trim() || !tmplContent.trim()) {
      setErrorMsg('Title and template content are required');
      return;
    }

    setIsSavingTemplate(true);
    setErrorMsg(null);

    const payload: CreateInboxAutoReplyTemplateDto = {
      title: tmplTitle.trim(),
      content: tmplContent.trim(),
      category: tmplCategory,
      sentimentMatch: tmplSentimentMatch !== 'ALL' ? tmplSentimentMatch : undefined,
    };

    try {
      const res = await apiClient<any>(`workspaces/${workspaceId}/inbox/reply-templates`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newTmpl: InboxAutoReplyTemplateDto = res.data ?? res;
      setTemplates([newTmpl, ...templates]);
      setIsTemplateModalOpen(false);
      setTmplTitle('');
      setTmplContent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create reply template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to delete this auto-moderation rule?')) return;

    try {
      await apiClient(`workspaces/${workspaceId}/inbox/moderation-rules/${ruleId}`, {
        method: 'DELETE',
      });
      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete rule');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!workspaceId) return;
    if (!confirm('Are you sure you want to delete this reply template?')) return;

    try {
      await apiClient(`workspaces/${workspaceId}/inbox/reply-templates/${templateId}`, {
        method: 'DELETE',
      });
      setTemplates(templates.filter((t) => t.id !== templateId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete template');
    }
  };

  const filteredTemplates =
    selectedCategory === 'ALL'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const getActionBadgeVariant = (action: InboxModerationAction) => {
    switch (action) {
      case InboxModerationAction.AUTO_FLAG:
        return 'warning';
      case InboxModerationAction.AUTO_HIDE:
        return 'danger';
      case InboxModerationAction.ASSIGN_TO_ROLE:
        return 'purple';
      case InboxModerationAction.CLOSE_INTERACTION:
        return 'success';
      case InboxModerationAction.AUTO_REPLY:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Auto-Moderation &amp; Sentiment Triage</h1>
            <Badge variant="purple">Smart Inbox</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automate negative sentiment escalations, keyword auto-hiding, agent assignment, and AI response macros.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'rules' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRuleModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Moderation Rule
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Reply Template
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <Alert variant="error" title="Moderation System Notice">
          {errorMsg}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Moderation &amp; Triage Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          AI Quick-Reply Templates ({templates.length})
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading auto-moderation settings...
        </div>
      ) : activeTab === 'rules' ? (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Auto-Moderation Rules Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Set up rules to automatically flag profanity, escalate negative complaints, or assign interactions to specific team roles.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRuleModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{rule.name}</h4>
                        {rule.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                        )}
                      </div>
                      <Badge variant={getActionBadgeVariant(rule.action)}>
                        {rule.action}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-[11px] font-semibold text-slate-400">Trigger:</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Sentiment: {rule.triggerSentiment}
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    {rule.keywords.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Keywords Matched ({rule.keywords.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {rule.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Executions: {rule.executionCount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 pb-2 overflow-x-auto">
            {['ALL', 'GENERAL', 'SUPPORT', 'PRICING', 'APOLOGY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Reply Templates Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create standardized response macros to answer inquiries in one click.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{tmpl.title}</h4>
                      <Badge variant="purple">{tmpl.category}</Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans">
                      &ldquo;{tmpl.content}&rdquo;
                    </p>

                    {tmpl.sentimentMatch && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium inline-block">
                        Best for: {tmpl.sentimentMatch} sentiment
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Usage: {tmpl.usageCount} times</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Moderation Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">New Auto-Moderation Rule</h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  placeholder="e.g. Flag Crisis & Fraud Complaints"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Triage Action to Execute
                </label>
                <select
                  value={ruleAction}
                  onChange={(e) => setRuleAction(e.target.value as InboxModerationAction)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={InboxModerationAction.AUTO_FLAG}>AUTO_FLAG (Mark urgent in red)</option>
                  <option value={InboxModerationAction.AUTO_HIDE}>AUTO_HIDE (Hide spam / blocked terms)</option>
                  <option value={InboxModerationAction.ASSIGN_TO_ROLE}>ASSIGN_TO_ROLE (Escalate to Admin)</option>
                  <option value={InboxModerationAction.CLOSE_INTERACTION}>CLOSE_INTERACTION (Auto-resolve)</option>
                  <option value={InboxModerationAction.AUTO_REPLY}>AUTO_REPLY (Send canned response)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sentiment Trigger Filter
                </label>
                <select
                  value={ruleSentiment}
                  onChange={(e) => setRuleSentiment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL">Any Sentiment (ALL)</option>
                  <option value="NEGATIVE">Only NEGATIVE Sentiment</option>
                  <option value="POSITIVE">Only POSITIVE Sentiment</option>
                  <option value="NEUTRAL">Only NEUTRAL Sentiment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keywords to Trigger (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={ruleKeywords}
                  onChange={(e) => setRuleKeywords(e.target.value)}
                  placeholder="scam, lawsuit, refund, terrible, broken"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave empty to match all interactions of selected sentiment</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSavingRule}
                >
                  {isSavingRule ? 'Saving...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Reply Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">New AI Quick-Reply Template</h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tmplTitle}
                  onChange={(e) => setTmplTitle(e.target.value)}
                  required
                  placeholder="e.g. Standard Support Greeting"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={tmplCategory}
                    onChange={(e) => setTmplCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="PRICING">PRICING</option>
                    <option value="APOLOGY">APOLOGY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sentiment Match
                  </label>
                  <select
                    value={tmplSentimentMatch}
                    onChange={(e) => setTmplSentimentMatch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="ALL">Any Sentiment</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reply Content Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={tmplContent}
                  onChange={(e) => setTmplContent(e.target.value)}
                  required
                  placeholder="Hi there! Thanks for reaching out. We have received your inquiry and our team is investigating..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSavingTemplate}
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
