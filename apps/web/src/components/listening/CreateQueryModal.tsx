'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Check, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import {
  CreateListeningQueryDto,
  ListeningQueryDto,
  SocialPlatform,
} from '@packages/shared';

interface CreateQueryModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newQuery: ListeningQueryDto) => void;
}

export function CreateQueryModal({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
}: CreateQueryModalProps) {
  const [name, setName] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['OmniSocial']);
  const [excludeInput, setExcludeInput] = useState('');
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(['internship', 'careers']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    SocialPlatform.TWITTER_X,
    SocialPlatform.LINKEDIN,
    SocialPlatform.INSTAGRAM,
  ]);
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddExclude = () => {
    const trimmed = excludeInput.trim();
    if (trimmed && !excludedKeywords.includes(trimmed)) {
      setExcludedKeywords([...excludedKeywords, trimmed]);
      setExcludeInput('');
    }
  };

  const handleRemoveExclude = (kw: string) => {
    setExcludedKeywords(excludedKeywords.filter((k) => k !== kw));
  };

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Query name is required.');
      return;
    }
    if (keywords.length === 0) {
      setErrorMessage('At least one keyword or hashtag is required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload: CreateListeningQueryDto = {
        name: name.trim(),
        keywords,
        excludedKeywords,
        platforms: selectedPlatforms,
        languages: ['en'],
        sentimentFilter,
      };

      const res = await apiClient<{ success: boolean; data: ListeningQueryDto }>(
        `/workspaces/${workspaceId}/listening/queries`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      if (res.data) {
        onCreated(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create listening query');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Listening Query</h2>
              <p className="text-xs text-slate-500">Monitor brand mentions, hashtags, and sentiment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Query Label / Campaign Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand Mentions & Product Buzz"
              required
            />
          </div>

          {/* Keywords Tagging */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Keywords, Handles, or Hashtags *
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Type keyword and press Enter or Add"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddKeyword}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span className="text-xs text-slate-400 italic">No keywords added yet.</span>
              )}
            </div>
          </div>

          {/* Excluded Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exclude Keywords (Noise Reduction)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExclude();
                  }
                }}
                placeholder="e.g. jobs, hiring"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddExclude}>
                <Plus className="w-4 h-4 mr-1" /> Exclude
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              {excludedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/80 text-slate-700"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveExclude(kw)}
                    className="hover:text-slate-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {excludedKeywords.length === 0 && (
                <span className="text-xs text-slate-400 italic">No exclusions configured.</span>
              )}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Social Networks to Monitor
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: SocialPlatform.TWITTER_X, label: 'Twitter / X' },
                { id: SocialPlatform.LINKEDIN, label: 'LinkedIn' },
                { id: SocialPlatform.INSTAGRAM, label: 'Instagram' },
                { id: SocialPlatform.FACEBOOK, label: 'Facebook' },
              ].map((plat) => {
                const isChecked = selectedPlatforms.includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => togglePlatform(plat.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{plat.label}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? 'Creating Query...' : 'Create Query & Start Listening'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
