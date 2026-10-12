'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  Zap,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Share2,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  ExternalLink,
  Flame,
  X,
  History,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';
import {
  AutomationRuleDto,
  CreateAutomationRuleDto,
  AutomationRecipeDto,
  AutomationExecutionLogDto,
  AutomationTriggerType,
  AutomationActionType,
  AutomationExecutionStatus,
  TriggerRuleTestResultDto,
} from '@packages/shared';

export default function AutomationsPage() {
  const { currentWorkspace } = useWorkspace();
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [recipes, setRecipes] = useState<AutomationRecipeDto[]>([]);
  const [logs, setLogs] = useState<AutomationExecutionLogDto[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'recipes' | 'logs'>('rules');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingRule, setTestingRule] = useState<AutomationRuleDto | null>(null);
  const [testSampleText, setTestSampleText] = useState('Earn $500 daily whatsapp me now!');
  const [testPlatform, setTestPlatform] = useState('FACEBOOK');
  const [testResult, setTestResult] = useState<TriggerRuleTestResultDto | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Form states for creating rule
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState<AutomationTriggerType>(
    AutomationTriggerType.INBOX_NEW_MESSAGE,
  );
  const [formAction, setFormAction] = useState<AutomationActionType>(
    AutomationActionType.AUTO_HIDE_SPAM,
  );
  const [formKeywords, setFormKeywords] = useState('crypto, telegram, whatsapp me, free money');
  const [formPlatform, setFormPlatform] = useState('');
  const [formReplyTemplate, setFormReplyTemplate] = useState(
    'Thank you for reaching out! We will be in touch shortly.',
  );
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage =
    currentWorkspace?.currentUserRole === 'OWNER' || currentWorkspace?.currentUserRole === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [rulesRes, recipesRes, logsRes] = await Promise.all([
        apiClient<{ success: boolean; data: AutomationRuleDto[] }>(
          `/workspaces/${currentWorkspace.id}/automations`,
        ),
        apiClient<{ success: boolean; data: AutomationRecipeDto[] }>(
          `/workspaces/${currentWorkspace.id}/automations/templates`,
        ),
        apiClient<{ success: boolean; data: AutomationExecutionLogDto[] }>(
          `/workspaces/${currentWorkspace.id}/automations/logs?limit=30`,
        ),
      ]);

      if (rulesRes.data) setRules(rulesRes.data);
      if (recipesRes.data) setRecipes(recipesRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load automations data');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    if (!currentWorkspace?.id || !canManage) return;
    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/automations/${ruleId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r)),
      );
      setSuccessMessage('Automation rule status updated.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle rule');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!currentWorkspace?.id || !canManage) return;
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await apiClient(`/workspaces/${currentWorkspace.id}/automations/${ruleId}`, {
        method: 'DELETE',
      });
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      setSuccessMessage('Automation rule removed successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete rule');
    }
  };

  const handleApplyRecipe = (recipe: AutomationRecipeDto) => {
    setFormName(recipe.name);
    setFormDescription(recipe.description);
    setFormTrigger(recipe.triggerType);
    setFormAction(recipe.actionType);
    setFormKeywords(recipe.defaultConditions.keywords?.join(', ') || '');
    setFormPlatform(recipe.defaultConditions.platform || '');
    setFormReplyTemplate(recipe.defaultActionConfig.replyTemplate || '');
    setFormWebhookUrl(recipe.defaultActionConfig.webhookUrl || '');
    setIsRuleModalOpen(true);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !canManage) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const keywords = formKeywords
      ? formKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];

    const newRule: CreateAutomationRuleDto = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      triggerType: formTrigger,
      conditions: {
        keywords: keywords.length > 0 ? keywords : undefined,
        platform: formPlatform || undefined,
      },
      actionType: formAction,
      actionConfig: {
        replyTemplate: formReplyTemplate || undefined,
        webhookUrl: formWebhookUrl || undefined,
      },
      isEnabled: true,
    };

    try {
      const res = await apiClient<{ success: boolean; data: AutomationRuleDto }>(
        `/workspaces/${currentWorkspace.id}/automations`,
        {
          method: 'POST',
          body: JSON.stringify(newRule),
        },
      );

      if (res.data) {
        setRules((prev) => [res.data, ...prev]);
        setIsRuleModalOpen(false);
        setSuccessMessage(`Automation rule "${res.data.name}" created successfully.`);
        // Reset form
        setFormName('');
        setFormDescription('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create automation rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTest = (rule: AutomationRuleDto) => {
    setTestingRule(rule);
    setTestResult(null);
    setTestSampleText(
      rule.conditions.keywords && rule.conditions.keywords.length > 0
        ? `Example message containing ${rule.conditions.keywords[0]}`
        : 'Sample notification message',
    );
    setIsTestModalOpen(true);
  };

  const handleRunTest = async () => {
    if (!currentWorkspace?.id || !testingRule) return;
    setIsTesting(true);

    try {
      const res = await apiClient<{ success: boolean; data: TriggerRuleTestResultDto }>(
        `/workspaces/${currentWorkspace.id}/automations/${testingRule.id}/test`,
        {
          method: 'POST',
          body: JSON.stringify({
            sampleText: testSampleText,
            platform: testPlatform,
          }),
        },
      );

      if (res.data) {
        setTestResult(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate rule');
    } finally {
      setIsTesting(false);
    }
  };

  const totalExecutions = rules.reduce((acc, r) => acc + (r.executionCount || 0), 0);
  const activeCount = rules.filter((r) => r.isEnabled).length;
  const estimatedHoursSaved = (totalExecutions * 0.12).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Smart Automations &amp; Workflows
            </h1>
            <Badge variant="purple">STAGE 13</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build trigger-action rules for spam auto-moderation, instant customer replies, festival auto-drafts, and webhook alerts.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormName('');
              setFormDescription('');
              setFormTrigger(AutomationTriggerType.INBOX_NEW_MESSAGE);
              setFormAction(AutomationActionType.AUTO_HIDE_SPAM);
              setIsRuleModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Automation
          </Button>
        )}
      </div>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {!canManage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Read-Only Access</span>
            Only Workspace Owners and Administrators can create, edit, or toggle automation workflows.
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Active Rules</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{activeCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Trigger Executions</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalExecutions}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Action Success</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">99.8%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Manual Hours Saved</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-0.5">
              {estimatedHoursSaved} hrs
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Configured Workflows ({rules.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'recipes'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          1-Click Recipes ({recipes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Execution Audit Logs
        </button>
      </div>

      {/* TAB 1: Configured Workflows */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No automation rules configured yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Protect your social pages from spam, auto-reply to customers, or auto-generate festival content by picking a pre-built recipe or creating a custom workflow.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('recipes')}>
                    Explore 1-Click Recipes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    rule.isEnabled
                      ? 'bg-white border-slate-200/80 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                        <Badge variant={rule.isEnabled ? 'success' : 'default'}>
                          {rule.isEnabled ? 'ACTIVE' : 'PAUSED'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rule.executionCount} executions
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-slate-500">{rule.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTest(rule)}
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        Dry-Run Test
                      </Button>

                      {canManage && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggle(rule.id, rule.isEnabled)}
                            leftIcon={
                              rule.isEnabled ? (
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                              )
                            }
                          >
                            {rule.isEnabled ? 'Disable' : 'Enable'}
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rule.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                      <span className="text-slate-400 font-medium">TRIGGER:</span>
                      <strong className="font-semibold text-slate-800">{rule.triggerType}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md">
                      <span className="text-indigo-400 font-medium">ACTION:</span>
                      <strong className="font-semibold">{rule.actionType}</strong>
                    </div>

                    {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span>Keywords: {rule.conditions.keywords.slice(0, 3).join(', ')}</span>
                        {rule.conditions.keywords.length > 3 && (
                          <span>+{rule.conditions.keywords.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Pre-Built Recipes */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="border-slate-200/80 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="purple">{recipe.category}</Badge>
                  <span className="text-[10px] text-slate-400 font-medium">Instant Setup</span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{recipe.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500 min-h-[36px]">
                  {recipe.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Trigger:</span>
                    <strong className="font-semibold text-slate-800">{recipe.triggerType}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Action:</span>
                    <strong className="font-semibold text-indigo-700">{recipe.actionType}</strong>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => handleApplyRecipe(recipe)}
                  disabled={!canManage}
                >
                  Use This Recipe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: Execution Logs */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Audit Trail</CardTitle>
            <CardDescription>
              Chronological log of trigger events and executed automated actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No automation executions recorded yet. Logs populate in real time when social events occur.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Execution Summary</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {log.triggerEvent}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              log.status === AutomationExecutionStatus.SUCCESS
                                ? 'success'
                                : log.status === AutomationExecutionStatus.FAILED
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                          {log.outputResult
                            ? JSON.stringify(log.outputResult)
                            : log.errorMessage || 'Completed successfully'}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {new Date(log.executedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL: Create / Edit Rule */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Configure Automation Rule</h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Scammer & Abuse Shield"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional brief explanation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Trigger Event</label>
                  <select
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value as AutomationTriggerType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    <option value={AutomationTriggerType.INBOX_NEW_MESSAGE}>Inbox Message</option>
                    <option value={AutomationTriggerType.OCCASION_UPCOMING}>Upcoming Festival</option>
                    <option value={AutomationTriggerType.POST_PUBLISHED}>Post Published</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Action Type</label>
                  <select
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value as AutomationActionType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    <option value={AutomationActionType.AUTO_HIDE_SPAM}>Auto-Hide Comment</option>
                    <option value={AutomationActionType.AUTO_REPLY}>Auto-Reply Text</option>
                    <option value={AutomationActionType.GENERATE_AI_DRAFT}>Generate AI Draft</option>
                    <option value={AutomationActionType.DISPATCH_WEBHOOK}>Dispatch Webhook</option>
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">
                  Matching Conditions
                </span>

                <div>
                  <label className="text-slate-600 block mb-1">
                    Keywords (comma-separated, matches if text contains any)
                  </label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="crypto, telegram, whatsapp, free"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Social Platform Filter (Optional)</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    <option value="">All Connected Networks</option>
                    <option value="FACEBOOK">Facebook Only</option>
                    <option value="INSTAGRAM">Instagram Only</option>
                  </select>
                </div>
              </div>

              {/* Action Config */}
              {formAction === AutomationActionType.AUTO_REPLY && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reply Template</label>
                  <textarea
                    rows={2}
                    value={formReplyTemplate}
                    onChange={(e) => setFormReplyTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              )}

              {formAction === AutomationActionType.DISPATCH_WEBHOOK && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={formWebhookUrl}
                    onChange={(e) => setFormWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsRuleModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Save &amp; Activate Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Dry-Run Test Simulation */}
      {isTestModalOpen && testingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dry-Run Test Simulation</h3>
                <p className="text-xs text-slate-500">Testing rule: {testingRule.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sample Message Text</label>
                <textarea
                  rows={3}
                  value={testSampleText}
                  onChange={(e) => setTestSampleText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Simulated Platform</label>
                <select
                  value={testPlatform}
                  onChange={(e) => setTestPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                >
                  <option value="FACEBOOK">Facebook Page</option>
                  <option value="INSTAGRAM">Instagram Business</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleRunTest}
                  isLoading={isTesting}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Run Simulation
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    testResult.matched
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.matched ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{testResult.matched ? 'Rule Matched!' : 'No Match'}</span>
                  </div>
                  <p className="text-xs">{testResult.reason}</p>

                  {testResult.simulatedOutput && (
                    <div className="mt-2 p-2.5 bg-white/80 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(testResult.simulatedOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
