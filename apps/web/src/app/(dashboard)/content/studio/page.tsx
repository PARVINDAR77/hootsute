'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { apiClient, unwrapData, unwrapList } from '@/lib/api-client';
import {
  Button,
  Input,
  Alert,
  Badge,
  Tabs,
  PlatformBadge,
  ORDERED_PLATFORMS,
  SupportedPlatformKey,
} from '@/components/ui';
import { AIBrainVisual } from '@/components/marketing/FuturisticVisuals';
import { ROUTES } from '@/lib/constants';
import {
  CampaignObjective,
  SocialPlatform,
  BrandTone,
  FestivalOccasionDto,
} from '@packages/shared';
import {
  Sparkles,
  Calendar,
  Layers,
  Send,
  MessageSquare,
  HelpCircle,
  Flame,
  ArrowRight,
  Image as ImageIcon,
  Lightbulb,
  Palette,
  FileText,
  Check,
  Info,
} from 'lucide-react';

type StudioTab = 'generator' | 'image-brief' | 'ideas';

const OBJECTIVES = [
  { value: CampaignObjective.ENGAGEMENT, label: 'Audience Engagement', icon: MessageSquare },
  { value: CampaignObjective.SALES_LEADS, label: 'Promotions & Leads', icon: Flame },
  { value: CampaignObjective.BRAND_AWARENESS, label: 'Brand Awareness', icon: Layers },
  { value: CampaignObjective.ANNOUNCEMENT, label: 'Announcement', icon: Send },
  { value: CampaignObjective.FESTIVAL_WISHES, label: 'Festival & Seasonal', icon: Sparkles },
  { value: CampaignObjective.EDUCATIONAL, label: 'Educational Value', icon: HelpCircle },
];

const PLATFORM_MAP: { key: SupportedPlatformKey; value: SocialPlatform; limit: string }[] = [
  { key: 'INSTAGRAM', value: SocialPlatform.INSTAGRAM, limit: '2,200 chars' },
  { key: 'FACEBOOK', value: SocialPlatform.FACEBOOK, limit: 'Long-form' },
  { key: 'TWITTER_X', value: SocialPlatform.TWITTER_X, limit: '280 chars' },
  { key: 'LINKEDIN', value: SocialPlatform.LINKEDIN, limit: '3,000 chars' },
  { key: 'PINTEREST', value: SocialPlatform.PINTEREST, limit: 'Pin + URL' },
  { key: 'YOUTUBE', value: SocialPlatform.YOUTUBE, limit: 'Title + Tags' },
  { key: 'TIKTOK', value: SocialPlatform.TIKTOK, limit: 'Hook + Tags' },
  { key: 'THREADS', value: SocialPlatform.THREADS, limit: '500 chars' },
];

const TONES = [
  { value: BrandTone.PROFESSIONAL, label: 'Professional' },
  { value: BrandTone.CASUAL_FRIENDLY, label: 'Casual & Friendly' },
  { value: BrandTone.URGENT_PROMOTIONAL, label: 'Bold / Promo' },
  { value: BrandTone.INSPIRATIONAL, label: 'Inspirational' },
  { value: BrandTone.FESTIVE_WARM, label: 'Festive & Warm' },
  { value: BrandTone.PLAYFUL, label: 'Playful' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'es', name: 'Spanish' },
];

const STARTER_IDEAS = [
  {
    title: 'Product Launch Teaser Campaign',
    objective: CampaignObjective.ANNOUNCEMENT,
    tone: BrandTone.URGENT_PROMOTIONAL,
    prompt: 'Announce our newest release with a punchy hook, key benefits, and a clear waitlist CTA.',
  },
  {
    title: 'Behind-the-Scenes Brand Story',
    objective: CampaignObjective.BRAND_AWARENESS,
    tone: BrandTone.INSPIRATIONAL,
    prompt: 'Share the craft, team values, and mission behind our product to build audience trust.',
  },
  {
    title: 'Weekly Educational Carousel & Tips',
    objective: CampaignObjective.EDUCATIONAL,
    tone: BrandTone.PROFESSIONAL,
    prompt: 'Create a 5-point actionable checklist our customers can save and share with peers.',
  },
  {
    title: 'Community Question & Engagement Poll',
    objective: CampaignObjective.ENGAGEMENT,
    tone: BrandTone.CASUAL_FRIENDLY,
    prompt: 'Spark a friendly conversation asking followers how they solve their biggest daily challenge.',
  },
];

export default function ContentStudioPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<StudioTab>('generator');
  const [occasions, setOccasions] = useState<FestivalOccasionDto[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<FestivalOccasionDto | null>(null);

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>(CampaignObjective.ENGAGEMENT);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    SocialPlatform.INSTAGRAM,
    SocialPlatform.FACEBOOK,
    SocialPlatform.LINKEDIN,
    SocialPlatform.TWITTER_X,
  ]);
  const [tone, setTone] = useState<BrandTone>(BrandTone.PROFESSIONAL);
  const [language, setLanguage] = useState('en');
  const [userInstructions, setUserInstructions] = useState('');
  const [visualStyle, setVisualStyle] = useState('Futuristic 3D studio product photography');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient<any>('/occasions')
      .then((res) => setOccasions(unwrapList<FestivalOccasionDto>(res)))
      .catch(() => {
        // Non-blocking
      });
  }, []);

  const handleSelectOccasion = (occ: FestivalOccasionDto) => {
    if (selectedOccasion?.id === occ.id) {
      setSelectedOccasion(null);
      return;
    }
    setSelectedOccasion(occ);
    setObjective(CampaignObjective.FESTIVAL_WISHES);
    setTone(BrandTone.FESTIVE_WARM);
    setTitle(`${occ.name} Campaign`);
    setUserInstructions(
      `Celebrate ${occ.name} with authentic brand warmth, tailored messaging, and a compelling CTA.`,
    );
    setActiveTab('generator');
  };

  const applyIdea = (idea: (typeof STARTER_IDEAS)[number]) => {
    setTitle(idea.title);
    setObjective(idea.objective);
    setTone(idea.tone);
    setUserInstructions(idea.prompt);
    setActiveTab('generator');
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

  const selectAllPlatforms = () => {
    setSelectedPlatforms(PLATFORM_MAP.map((p) => p.value));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    const resolvedTitle =
      title.trim() ||
      (activeTab === 'image-brief' ? 'AI Visual Creative Brief Campaign' : '');

    if (!resolvedTitle) {
      setErrorMsg('Please enter a campaign title so your draft can be saved cleanly.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setErrorMsg('Please select at least one social media platform.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    const combinedInstructions =
      activeTab === 'image-brief'
        ? `Visual art direction style: ${visualStyle}. ${userInstructions.trim()}`
        : userInstructions.trim() || undefined;

    try {
      const res = await apiClient<any>(
        `/workspaces/${currentWorkspace.id}/content-generation/generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: resolvedTitle,
            objective,
            platforms: selectedPlatforms,
            occasionSlug: selectedOccasion?.slug || undefined,
            tone,
            language,
            userInstructions: combinedInstructions,
          }),
        },
      );

      const created = unwrapData<any>(res);
      if (created?.id) {
        router.push(`/content/drafts/${created.id}`);
      } else {
        setIsGenerating(false);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Generation failed. Please check AI provider configuration or workspace limits.',
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white">
            AI Content Studio
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Generate platform-calibrated copy, hashtags, and creative briefs across all 8 networks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={ROUTES.BRAND_KIT}>
            <Button variant="outline" size="sm" leftIcon={<Palette className="w-3.5 h-3.5" />}>
              Brand Kit
            </Button>
          </Link>
          <Link href={ROUTES.CONTENT_DRAFTS}>
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Drafts &amp; Approvals
            </Button>
          </Link>
        </div>
      </div>

      {/* Mode Tabs matching Reference Image */}
      <Tabs<StudioTab>
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { id: 'generator', label: 'Post Generator', icon: <Sparkles className="w-3.5 h-3.5" /> },
          {
            id: 'image-brief',
            label: 'Image Brief Creator',
            icon: <ImageIcon className="w-3.5 h-3.5" />,
          },
          {
            id: 'ideas',
            label: 'Ideas & Occasions',
            icon: <Lightbulb className="w-3.5 h-3.5" />,
            badge: occasions.length || undefined,
          },
        ]}
      />

      {errorMsg && (
        <Alert
          type="error"
          title="Generation Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {activeTab === 'ideas' ? (
        <div className="space-y-6">
          {/* Starter Playbooks */}
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white mb-3">
              Campaign Starter Prompts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STARTER_IDEAS.map((idea) => (
                <button
                  key={idea.title}
                  type="button"
                  onClick={() => applyIdea(idea)}
                  className="text-left p-5 rounded-2xl bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] hover:border-[#7138F5] shadow-soft dark:shadow-none transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-extrabold text-[#111827] dark:text-white group-hover:text-[#7138F5] dark:group-hover:text-[#20C8E8]">
                      {idea.title}
                    </h3>
                    <Badge variant="purple">Use Prompt</Badge>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                    {idea.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Festivals & Cultural Occasions from API */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
                Upcoming Festival &amp; Holiday Catalog
              </h2>
              <span className="text-xs text-[#64748B] dark:text-slate-400">
                Click any occasion to prefill Post Generator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {occasions.map((occ) => {
                const isSelected = selectedOccasion?.id === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => handleSelectOccasion(occ)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/25 border-[#7138F5] shadow-glow-purple'
                        : 'bg-white dark:bg-[#0F142B]/90 border-[#E7EAF2] dark:border-[#1E2749] hover:border-[#7138F5]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#111827] dark:text-white truncate">
                        {occ.name}
                      </h3>
                      {isSelected && <Badge variant="purple">Selected</Badge>}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 line-clamp-2">
                      {occ.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Composer Card (8 cols) */}
          <div className="xl:col-span-8 space-y-5">
            {activeTab === 'image-brief' && (
              <Alert
                type="info"
                title="Creative Visual Brief Pipeline"
                message="Generates structured image art direction, aspect ratios, and visual prompts saved alongside your campaign variants. Configure an external image-generation provider to enable direct raster rendering."
              />
            )}

            <div className="rounded-3xl p-6 bg-white dark:bg-[#0F142B]/95 border border-[#E7EAF2] dark:border-[#7138F5]/30 shadow-soft dark:shadow-glow-card space-y-5">
              <Input
                label="Campaign Draft Title *"
                placeholder="e.g. Q4 Product Launch — 8-Channel Rollout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {activeTab === 'image-brief' && (
                <Input
                  label="Visual Art Direction Style"
                  placeholder="e.g. Minimalist 3D glass product lighting, pastel studio"
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                />
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="studio-prompt"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300"
                >
                  What do you want to create?
                </label>
                <textarea
                  id="studio-prompt"
                  rows={4}
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder="Describe your offer, story, product highlights, CTA, or target audience..."
                  className="w-full rounded-2xl border border-[#E7EAF2] dark:border-[#1E2749] bg-[#F7F8FC] dark:bg-[#0B1024] px-4 py-3 text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7138F5] focus:ring-2 focus:ring-[#7138F5]/20 transition-all"
                />
              </div>

              {/* Target Platforms (All 8 Networks) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300">
                    Target Social Networks ({selectedPlatforms.length} / 8)
                  </span>
                  <button
                    type="button"
                    onClick={selectAllPlatforms}
                    className="text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                  >
                    Select All 8
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PLATFORM_MAP.map((p) => {
                    const active = selectedPlatforms.includes(p.value);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => togglePlatform(p.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/25 border-[#7138F5] text-[#111827] dark:text-white shadow-xs'
                            : 'bg-[#F7F8FC] dark:bg-[#0B1024] border-[#E7EAF2] dark:border-[#1E2749] text-[#64748B] dark:text-slate-400 hover:border-[#7138F5]/40'
                        }`}
                      >
                        <PlatformBadge platform={p.key} variant="icon" size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {p.key === 'TWITTER_X'
                              ? 'X / Twitter'
                              : p.key.charAt(0) + p.key.slice(1).toLowerCase()}
                          </p>
                          <p className="text-[10px] opacity-75 truncate">{p.limit}</p>
                        </div>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#7138F5] dark:text-[#20C8E8] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Tone Pills + Language & Objective */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                <div className="md:col-span-8 space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300">
                    Brand Tone
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => {
                      const active = tone === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTone(t.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            active
                              ? 'bg-gradient-to-r from-[#7138F5] to-[#2878FF] text-white border-transparent shadow-glow-purple'
                              : 'bg-[#F7F8FC] dark:bg-[#0B1024] border-[#E7EAF2] dark:border-[#1E2749] text-[#64748B] dark:text-slate-300 hover:border-[#7138F5]/40'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label
                    htmlFor="studio-language"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300"
                  >
                    Output Language
                  </label>
                  <select
                    id="studio-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-[#E7EAF2] dark:border-[#1E2749] bg-[#F7F8FC] dark:bg-[#0B1024] px-3 py-2 text-xs font-semibold text-[#111827] dark:text-white focus:outline-none focus:border-[#7138F5]"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Objective Pills */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-300">
                  Campaign Objective
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OBJECTIVES.map((obj) => {
                    const Icon = obj.icon;
                    const active = objective === obj.value;
                    return (
                      <button
                        key={obj.value}
                        type="button"
                        onClick={() => setObjective(obj.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#F1EBFF] dark:bg-[#7138F5]/20 border-[#7138F5] text-[#7138F5] dark:text-white'
                            : 'bg-[#F7F8FC] dark:bg-[#0B1024] border-[#E7EAF2] dark:border-[#1E2749] text-[#64748B] dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{obj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EAF2] dark:border-white/10">
                <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                  <Info className="w-4 h-4 text-[#7138F5] dark:text-[#20C8E8]" />
                  <span>
                    Generates {selectedPlatforms.length} platform variant
                    {selectedPlatforms.length === 1 ? '' : 's'} &amp; saves directly to Drafts
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isGenerating}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Generate Content
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Glowing 3D AI Brain + Calibration Tips (4 cols) */}
          <div className="xl:col-span-4 space-y-5">
            <AIBrainVisual />

            {selectedOccasion && (
              <div className="rounded-2xl p-4 bg-[#F1EBFF] dark:bg-[#7138F5]/20 border border-[#7138F5]/30 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7138F5] dark:text-[#C4A5FF]">
                    Active Occasion Context
                  </p>
                  <p className="text-sm font-bold text-[#111827] dark:text-white">
                    {selectedOccasion.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOccasion(null)}
                  className="text-xs font-bold text-[#7138F5] dark:text-[#20C8E8] hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="rounded-2xl p-5 bg-white dark:bg-[#0F142B]/90 border border-[#E7EAF2] dark:border-[#1E2749] space-y-3">
              <h3 className="text-sm font-extrabold text-[#111827] dark:text-white">
                Platform-Native Calibration
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                After generation, open your draft editor to customize per-channel copy, attach
                Media Library assets, run approval workflows, or send straight to Bulk Publish.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ORDERED_PLATFORMS.map((p) => (
                  <PlatformBadge key={p} platform={p} variant="icon" size="sm" />
                ))}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
