'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  CampaignObjective,
  SocialPlatform,
  BrandTone,
  FestivalOccasionDto,
  ContentDraftDto,
} from '@packages/shared';
import {
  Sparkles,
  Calendar,
  Layers,
  Send,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Check,
  Loader2,
  HelpCircle,
  Hash,
  ChevronRight,
  Flame,
  ArrowRight,
} from 'lucide-react';

const OBJECTIVES = [
  { value: CampaignObjective.FESTIVAL_WISHES, label: 'Festival Wishes & Cultural', icon: Sparkles, desc: 'Festive greetings & seasonal cultural posts' },
  { value: CampaignObjective.ENGAGEMENT, label: 'Audience Engagement', icon: MessageSquare, desc: 'Questions, community conversations & polls' },
  { value: CampaignObjective.SALES_LEADS, label: 'Promotions & Sales Leads', icon: Flame, desc: 'Special offers, discount codes & product launches' },
  { value: CampaignObjective.BRAND_AWARENESS, label: 'Brand Story & Awareness', icon: Layers, desc: 'Founding heritage, crafts & quality values' },
  { value: CampaignObjective.ANNOUNCEMENT, label: 'Company Announcement', icon: Send, desc: 'Milestones, new store openings & updates' },
  { value: CampaignObjective.EDUCATIONAL, label: 'Educational & Value', icon: HelpCircle, desc: 'Styling tips, industry insights & guides' },
];

const PLATFORMS = [
  { value: SocialPlatform.INSTAGRAM, label: 'Instagram', icon: Instagram, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { value: SocialPlatform.FACEBOOK, label: 'Facebook', icon: Facebook, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: SocialPlatform.LINKEDIN, label: 'LinkedIn', icon: Linkedin, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { value: SocialPlatform.TWITTER_X, label: 'Twitter / X', icon: Twitter, color: 'text-slate-900 bg-slate-100 border-slate-300' },
];

const TONES = [
  { value: BrandTone.FESTIVE_WARM, label: 'Festive & Warm (ઉત્સવમય / उत्सवी)' },
  { value: BrandTone.PROFESSIONAL, label: 'Professional & Authoritative' },
  { value: BrandTone.CASUAL_FRIENDLY, label: 'Casual & Friendly' },
  { value: BrandTone.INSPIRATIONAL, label: 'Inspirational & Elegant' },
  { value: BrandTone.URGENT_PROMOTIONAL, label: 'Urgent Promotional (Offer ending)' },
  { value: BrandTone.PLAYFUL, label: 'Playful & Witty' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'es', name: 'Spanish' },
];

export default function ContentStudioPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();

  const [occasions, setOccasions] = useState<FestivalOccasionDto[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<FestivalOccasionDto | null>(null);

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>(CampaignObjective.ENGAGEMENT);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    SocialPlatform.INSTAGRAM,
    SocialPlatform.FACEBOOK,
  ]);
  const [tone, setTone] = useState<BrandTone>(BrandTone.PROFESSIONAL);
  const [language, setLanguage] = useState('en');
  const [userInstructions, setUserInstructions] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadOccasions();
  }, []);

  const loadOccasions = async () => {
    try {
      const res = await apiClient<{ success: boolean; data: FestivalOccasionDto[] }>('/occasions');
      if (res.data) {
        setOccasions(res.data);
      }
    } catch (e) {
      console.error('Failed to load occasions catalog', e);
    }
  };

  const handleSelectOccasion = (occ: FestivalOccasionDto) => {
    if (selectedOccasion?.id === occ.id) {
      setSelectedOccasion(null);
    } else {
      setSelectedOccasion(occ);
      setObjective(CampaignObjective.FESTIVAL_WISHES);
      setTone(BrandTone.FESTIVE_WARM);
      setTitle(`${occ.name} Festive Campaign`);
      if (!userInstructions) {
        setUserInstructions(`Celebrate ${occ.name}. Highlight our heritage collection with festive blessings.`);
      }
    }
  };

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      if (selectedPlatforms.length < 4) {
        setSelectedPlatforms([...selectedPlatforms, p]);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!title.trim()) {
      setErrorMsg('Please enter a campaign draft title');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setErrorMsg('Please select at least one social media platform');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await apiClient<{ success: boolean; data: ContentDraftDto }>(
        `/workspaces/${currentWorkspace.id}/content-generation/generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            objective,
            platforms: selectedPlatforms,
            occasionSlug: selectedOccasion?.slug || undefined,
            tone,
            language,
            userInstructions: userInstructions.trim() || undefined,
          }),
        },
      );

      if (res.data?.id) {
        router.push(`/content/drafts/${res.data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed. Please check AI provider configuration or rate limits.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">AI Content Generation Studio</h1>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Generate native marketing copy tailored to each social network. Choose a festival occasion, define your objective, and let our multi-platform AI engine craft compliant variations with hashtags and visual briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/content/drafts')}
            className="text-white border-white/20 bg-white/5 hover:bg-white/10 text-xs"
          >
            <span>View Drafts Hub</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert
          type="error"
          title="Generation Error"
          message={errorMsg}
        />
      )}

      {/* Festival & Occasion Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Upcoming Festival &amp; Holiday Catalog</h2>
          </div>
          <span className="text-xs text-slate-400">Click to auto-apply cultural context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {occasions.map((occ) => {
            const isSelected = selectedOccasion?.id === occ.id;
            return (
              <div
                key={occ.id}
                onClick={() => handleSelectOccasion(occ)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/30'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">{occ.name}</span>
                  {isSelected && <Badge variant="default" className="text-[10px]">Selected</Badge>}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{occ.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span>{occ.typicalPeriod}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Campaign Form */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">1. Campaign Blueprint</CardTitle>
              <CardDescription className="text-xs">
                Draft name, target platforms, and high-level campaign intent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Campaign Title / Internal Topic"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navratri Garba Festive Launch or Winter Weekend Sale"
              />

              {/* Target Platforms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Target Platforms (Select 1 to 4)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PLATFORMS.map((plat) => {
                    const isSelected = selectedPlatforms.includes(plat.value);
                    const Icon = plat.icon;
                    return (
                      <div
                        key={plat.value}
                        onClick={() => togglePlatform(plat.value)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? `${plat.color} font-semibold shadow-xs ring-1 ring-current`
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs">{plat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Objective */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Campaign Objective
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OBJECTIVES.map((obj) => {
                    const isSelected = objective === obj.value;
                    const Icon = obj.icon;
                    return (
                      <div
                        key={obj.value}
                        onClick={() => setObjective(obj.value)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {obj.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{obj.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">2. Tone &amp; Instructions</CardTitle>
              <CardDescription className="text-xs">
                Refine the brand personality, language, and specific offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Brand Tone &amp; Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as BrandTone)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Primary Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Custom User Instructions &amp; Promotional Details</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {userInstructions.length} / 1000 chars
                  </span>
                </label>
                <textarea
                  rows={4}
                  maxLength={1000}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder="e.g. Announce 20% off on all double Ikkat sarees using code GARBA26. Valid through Sunday. Encourage WhatsApp DM for expedited delivery."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Live Summary & Action Box */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Generation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Workspace</span>
                <span className="font-semibold text-slate-800">{currentWorkspace?.name}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Occasion</span>
                <span className="font-semibold text-indigo-600">
                  {selectedOccasion ? selectedOccasion.name : 'General Campaign'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Variants</span>
                <span className="font-semibold text-slate-800">{selectedPlatforms.length} Native Copies</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-slate-500 block">Active Output Channels:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlatforms.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px] uppercase font-bold">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedOccasion?.suggestedHashtags && selectedOccasion.suggestedHashtags.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-slate-500 block">Occasion Hashtags:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedOccasion.suggestedHashtags.map((h) => (
                      <span key={h} className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Copy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate &amp; Review Draft</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-slate-400 text-center">
                Generates immutable revision #1 with platform-specific character limits and hashtags.
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
