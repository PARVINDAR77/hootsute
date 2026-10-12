export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  BUSINESS_MEMBER = 'BUSINESS_MEMBER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum WorkspaceStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum WorkspaceMemberStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED',
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | string[];
}

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  industry?: string | null;
  timezone: string;
  defaultLanguage: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  currentUserRole?: WorkspaceRole;
}

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
  };
}

export interface WorkspaceInvitationDto {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  invitedById: string;
  createdAt: string;
  invitationUrl?: string; // provided in dev/honest mode
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export enum SocialProvider {
  META_FACEBOOK = 'META_FACEBOOK',
  META_INSTAGRAM = 'META_INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  TWITTER_X = 'TWITTER_X',
}

export enum SocialAccountType {
  FACEBOOK_PAGE = 'FACEBOOK_PAGE',
  INSTAGRAM_BUSINESS = 'INSTAGRAM_BUSINESS',
  INSTAGRAM_CREATOR = 'INSTAGRAM_CREATOR',
  LINKEDIN_PAGE = 'LINKEDIN_PAGE',
  LINKEDIN_PROFILE = 'LINKEDIN_PROFILE',
  TWITTER_PROFILE = 'TWITTER_PROFILE',
}

export enum SocialConnectionStatus {
  CONNECTED = 'CONNECTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface SocialAccountDto {
  id: string;
  workspaceId: string;
  provider: SocialProvider;
  providerAccountId: string;
  accountName: string;
  accountUsername?: string | null;
  accountType: SocialAccountType;
  profileImageUrl?: string | null;
  connectionStatus: SocialConnectionStatus;
  grantedScopes: string[];
  tokenExpiresAt?: string | null;
  lastValidatedAt: string;
  connectedByUserId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | null;
}

export interface CandidateSocialAccount {
  id: string;
  name: string;
  username?: string | null;
  category?: string | null;
  accountType: SocialAccountType;
  provider: SocialProvider;
  profileImageUrl?: string | null;
  tasks?: string[];
  instagramBusinessAccount?: {
    id: string;
    name: string;
    username: string;
    profilePictureUrl?: string | null;
  } | null;
  isAlreadyConnected?: boolean;
}

export interface OAuthSessionResponse {
  sessionToken: string;
  expiresAt: string;
  accounts: CandidateSocialAccount[];
}

// Stage 4: AI Marketing Content Generation Engine

export enum DraftStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CampaignObjective {
  ENGAGEMENT = 'ENGAGEMENT',
  SALES_LEADS = 'SALES_LEADS',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  FESTIVAL_WISHES = 'FESTIVAL_WISHES',
  BRAND_AWARENESS = 'BRAND_AWARENESS',
  EVENT_PROMOTION = 'EVENT_PROMOTION',
  EDUCATIONAL = 'EDUCATIONAL',
  RECRUITMENT = 'RECRUITMENT',
}

export enum ContentType {
  POST = 'POST',
  REEL_STORY_BRIEF = 'REEL_STORY_BRIEF',
  CAROUSEL = 'CAROUSEL',
  CAMPAIGN = 'CAMPAIGN',
}

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  TWITTER_X = 'TWITTER_X',
}

export enum BrandTone {
  PROFESSIONAL = 'PROFESSIONAL',
  CASUAL_FRIENDLY = 'CASUAL_FRIENDLY',
  FESTIVE_WARM = 'FESTIVE_WARM',
  INSPIRATIONAL = 'INSPIRATIONAL',
  URGENT_PROMOTIONAL = 'URGENT_PROMOTIONAL',
  AUTHORITATIVE = 'AUTHORITATIVE',
  PLAYFUL = 'PLAYFUL',
}

export interface WorkspaceBrandProfileDto {
  id: string;
  workspaceId: string;
  businessName: string;
  industry?: string | null;
  businessDescription?: string | null;
  targetAudience?: string | null;
  productsAndServices?: string | null;
  brandVoice?: string | null;
  preferredLanguage: string;
  supportedLanguages: string[];
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  slogan?: string | null;
  websiteUrl?: string | null;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  brandGuidelines?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FestivalOccasionDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  culturalContext: string;
  category: string;
  dateType: string;
  typicalPeriod: string;
  supportedRegions: string[];
  promptGuidance: string;
  suggestedHashtags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVariantDto {
  id: string;
  draftId: string;
  platform: SocialPlatform;
  headline?: string | null;
  body: string;
  callToAction?: string | null;
  hashtags: string[];
  linkUrl?: string | null;
  mediaBrief?: string | null;
  mediaAssetUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRevisionDto {
  id: string;
  draftId: string;
  variantId?: string | null;
  revisionNumber: number;
  action: string;
  promptSummary?: string | null;
  inputSnapshot?: Record<string, any> | null;
  outputSnapshot: Record<string, any>;
  createdByUserId: string;
  createdAt: string;
}

export interface ContentDraftDto {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  updatedByUserId?: string | null;
  title: string;
  objective: CampaignObjective;
  contentType: ContentType;
  language: string;
  status: DraftStatus;
  approvalRequestedByUserId?: string | null;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: ContentVariantDto[];
  revisions?: ContentRevisionDto[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvalRequestedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export enum WhatsAppMessageStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum RecipientConsentStatus {
  OPTED_IN = 'OPTED_IN',
  OPTED_OUT = 'OPTED_OUT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface WorkspaceWhatsAppConfigDto {
  id: string;
  workspaceId: string;
  wabaId: string;
  phoneNumberId: string;
  businessPhoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppRecipientConsentDto {
  id: string;
  workspaceId: string;
  userId?: string | null;
  phoneNumber: string;
  displayName: string;
  status: RecipientConsentStatus;
  consentSource: string;
  optedInAt: string;
  optedOutAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppNotificationMessageDto {
  id: string;
  workspaceId: string;
  draftId?: string | null;
  recipientConsentId: string;
  providerMessageId?: string | null;
  templateName: string;
  language: string;
  parameters?: Record<string, any> | null;
  status: WhatsAppMessageStatus;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  recipient?: WhatsAppRecipientConsentDto;
}

export interface SendWhatsAppPreviewDto {
  recipientConsentIds: string[];
  platform?: SocialPlatform;
}

export interface UpsertWhatsAppConfigDto {
  wabaId: string;
  phoneNumberId: string;
  systemUserAccessToken: string;
  businessPhoneNumber?: string;
}

export interface CreateWhatsAppRecipientDto {
  phoneNumber: string;
  displayName: string;
  userId?: string;
  consentAcknowledged: boolean;
}

// Stage 6: Social Media Scheduling & Automated Publishing Engine

export enum ScheduledPostStatus {
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  NEEDS_REAPPROVAL = 'NEEDS_REAPPROVAL',
}

export enum PublishTargetStatus {
  PENDING = 'PENDING',
  DISPATCHING = 'DISPATCHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AMBIGUOUS_TIMEOUT = 'AMBIGUOUS_TIMEOUT',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

export enum AttemptOutcome {
  SUCCESS = 'SUCCESS',
  DEFINITIVE_FAILURE = 'DEFINITIVE_FAILURE',
  AMBIGUOUS_TIMEOUT = 'AMBIGUOUS_TIMEOUT',
  AUTH_FAILURE = 'AUTH_FAILURE',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface PublishingAttemptDto {
  id: string;
  targetId: string;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string | null;
  outcome: AttemptOutcome;
  sanitizedErrorCode?: string | null;
  sanitizedErrorMessage?: string | null;
  externalPostId?: string | null;
  reconciliationStatus?: string | null;
  reconciledAt?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ScheduledPostTargetDto {
  id: string;
  scheduledPostId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  variantId?: string | null;
  status: PublishTargetStatus;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  publishedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  rawResponse?: Record<string, any> | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername?: string | null;
    accountType: SocialAccountType;
    provider: SocialProvider;
    profileImageUrl?: string | null;
  };
  attempts?: PublishingAttemptDto[];
}

export interface ScheduledPostContentSnapshot {
  draftId: string;
  approvedRevisionNumber: number;
  title: string;
  variants: {
    id?: string;
    platform: SocialPlatform;
    headline?: string | null;
    body: string;
    callToAction?: string | null;
    hashtags: string[];
    linkUrl?: string | null;
    mediaAssetUrl?: string | null;
  }[];
}

export interface ScheduledPostDto {
  id: string;
  workspaceId: string;
  draftId: string;
  createdById: string;
  scheduledAt: string;
  timezone: string;
  status: ScheduledPostStatus;
  approvedRevisionNumber: number;
  contentSnapshot: ScheduledPostContentSnapshot;
  snapshotHash: string;
  queueJobId?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  targets?: ScheduledPostTargetDto[];
  draft?: {
    id: string;
    title: string;
    status: DraftStatus;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateScheduledPostTargetInput {
  socialAccountId: string;
  platform: SocialPlatform;
  variantId?: string;
}

export interface CreateScheduledPostPayload {
  draftId: string;
  scheduledAt: string;
  timezone?: string;
  targets: CreateScheduledPostTargetInput[];
}

export interface ReschedulePostPayload {
  scheduledAt: string;
  timezone?: string;
}

export interface CancelScheduledPostPayload {
  reason?: string;
}

// ---------------------------------------------------------------------------
// Stage 7: Analytics, Engagement Tracking & Growth Insights
// ---------------------------------------------------------------------------

export enum AnalyticsMetricPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  DAYS_28 = 'DAYS_28',
  LIFETIME = 'LIFETIME',
}

export enum PostAnalyticsType {
  POST = 'POST',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  REEL = 'REEL',
  CAROUSEL = 'CAROUSEL',
  STORY = 'STORY',
}

export enum SyncJobType {
  ACCOUNT_DAILY = 'ACCOUNT_DAILY',
  POST_INCREMENTAL = 'POST_INCREMENTAL',
  MANUAL_REFRESH = 'MANUAL_REFRESH',
  HISTORICAL_BACKFILL = 'HISTORICAL_BACKFILL',
}

export enum SyncJobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
}

export enum GrowthInsightCategory {
  TIMING = 'TIMING',
  CONTENT_FORMAT = 'CONTENT_FORMAT',
  ENGAGEMENT = 'ENGAGEMENT',
  TOPIC_AUDIENCE = 'TOPIC_AUDIENCE',
  CONSISTENCY = 'CONSISTENCY',
}

export interface AccountAnalyticsSnapshotDto {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  period: AnalyticsMetricPeriod;
  snapshotDate: string;
  followersCount?: number | null;
  followersNetChange?: number | null;
  impressions?: number | null;
  reach?: number | null;
  profileViews?: number | null;
  websiteClicks?: number | null;
  engagementTotal?: number | null;
  engagementRate?: number | null;
  provenance?: string | null;
  rawMetrics?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername?: string | null;
    platform?: SocialPlatform;
    accountType?: SocialAccountType;
    profileImageUrl?: string | null;
  };
}

export interface PostAnalyticsSnapshotDto {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  scheduledPostTargetId?: string | null;
  externalPostId: string;
  platform: SocialPlatform;
  postType: PostAnalyticsType;
  publishedAt?: string | null;
  snapshotDate: string;
  likesCount?: number | null;
  commentsCount?: number | null;
  sharesCount?: number | null;
  savesCount?: number | null;
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  videoViews?: number | null;
  watchTimeMs?: string | number | null;
  engagementRate?: number | null;
  provenance?: string | null;
  rawMetrics?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername?: string | null;
    profileImageUrl?: string | null;
  };
  scheduledPostTarget?: {
    id: string;
    scheduledPostId: string;
    externalPostUrl?: string | null;
  };
}

export interface AnalyticsSyncErrorDto {
  id: string;
  syncJobId: string;
  socialAccountId?: string | null;
  externalPostId?: string | null;
  errorCode: string;
  errorMessage: string;
  httpStatus?: number | null;
  isPermissionError: boolean;
  createdAt: string;
}

export interface AnalyticsSyncJobDto {
  id: string;
  workspaceId: string;
  socialAccountId?: string | null;
  jobType: SyncJobType;
  status: SyncJobStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  itemsProcessed: number;
  itemsFailed: number;
  lastSuccessfulSyncAt?: string | null;
  leaseExpiresAt?: string | null;
  claimToken?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  errors?: AnalyticsSyncErrorDto[];
}

export interface GrowthInsightDto {
  id: string;
  workspaceId: string;
  category: GrowthInsightCategory;
  title: string;
  summary: string;
  suggestedAction: string;
  evidence: Record<string, any>;
  confidenceScore: number;
  expiresAt?: string | null;
  dismissedAt?: string | null;
  dismissedById?: string | null;
  createdAt: string;
  updatedAt: string;
  dismissedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AnalyticsDateRangeFilter {
  startDate: string;
  endDate: string;
  platform?: SocialPlatform;
  socialAccountId?: string;
  period?: AnalyticsMetricPeriod;
}

// ============================================================================
// STAGE 8: UNIFIED SOCIAL INBOX & COMMUNITY MANAGEMENT
// ============================================================================

export enum InteractionType {
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  MENTION = 'MENTION',
}

export enum InteractionWorkflowStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

export enum ReplyAttemptStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  AMBIGUOUS_TIMEOUT = 'AMBIGUOUS_TIMEOUT',
}

export interface SocialInteractionDto {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  interactionType: InteractionType;
  externalInteractionId: string;
  parentExternalId?: string | null;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  authorProviderId: string;
  authorName: string;
  authorUsername?: string | null;
  authorProfileUrl?: string | null;
  content: string;
  publishedAt: string;
  isFromPageOrAccount: boolean;
  workflowStatus: InteractionWorkflowStatus;
  isRead: boolean;
  assignedToUserId?: string | null;
  assignedAt?: string | null;
  assignedByUserId?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  rawMetadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  socialAccount?: {
    id: string;
    accountName: string;
    accountUsername?: string | null;
    accountType: string;
    profileImageUrl?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  replyAttempts?: InteractionReplyAttemptDto[];
  notes?: InteractionNoteDto[];
}

export interface InteractionReplyAttemptDto {
  id: string;
  interactionId: string;
  workspaceId: string;
  authorUserId: string;
  content: string;
  externalReplyId?: string | null;
  status: ReplyAttemptStatus;
  idempotencyKey: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  authorUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InteractionNoteDto {
  id: string;
  interactionId: string;
  workspaceId: string;
  authorUserId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InboxNotificationDto {
  id: string;
  workspaceId: string;
  recipientUserId: string;
  interactionId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxSyncCheckpointDto {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  lastSyncedAt?: string | null;
  nextCursor?: string | null;
  status: string;
  errorMessage?: string | null;
  updatedAt: string;
}

// Phase 11: Media Asset Management & Cloud Storage

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum MediaProcessingStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum MediaStorageProvider {
  S3 = 'S3',
  LOCAL_MOCK = 'LOCAL_MOCK',
}

export interface MediaAssetDto {
  id: string;
  workspaceId: string;
  uploadedByUserId: string;
  originalFilename: string;
  storageKey: string;
  storageProvider: MediaStorageProvider;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  processingStatus: MediaProcessingStatus;
  errorMessage?: string | null;
  checksumSha256?: string | null;
  metadata?: Record<string, any> | null;
  accessUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  usageCount?: number;
}

export interface CreateUploadSessionDto {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadSessionResponseDto {
  assetId: string;
  storageKey: string;
  uploadUrl: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresInSeconds: number;
  maxSizeBytes: number;
}

export interface CompleteUploadDto {
  etag?: string;
}

export interface QueryMediaDto {
  page?: number;
  limit?: number;
  mediaType?: MediaType;
  status?: MediaProcessingStatus;
  search?: string;
}

export interface MediaAccessUrlDto {
  assetId: string;
  url: string;
  expiresInSeconds: number;
}

export interface WorkspaceStorageUsageDto {
  workspaceId: string;
  planTier: string;
  usedBytes: number;
  quotaBytes: number;
  usagePercentage: number;
  isQuotaExceeded: boolean;
  remainingBytes: number;
  assetCounts: {
    total: number;
    images: number;
    videos: number;
    maxAssets: number;
  };
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  INCOMPLETE = 'INCOMPLETE',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limitText?: string;
}

export interface PricingPlanDto {
  plan: SubscriptionPlan;
  displayName: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  storageQuotaBytes: number;
  maxMediaAssets: number;
  maxSocialAccounts: number;
  monthlyAiTokens: number;
  features: PlanFeature[];
  isPopular?: boolean;
}

export interface WorkspaceSubscriptionDto {
  id: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  trialEndsAt?: string | null;
  stripeCustomerId?: string | null;
  hasPaymentMethod: boolean;
}

export interface BillingInvoiceDto {
  id: string;
  workspaceId: string;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface CreateCheckoutSessionDto {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponseDto {
  sessionId: string;
  checkoutUrl: string;
}

export interface CustomerPortalResponseDto {
  portalUrl: string;
}

export enum AutomationTriggerType {
  INBOX_NEW_MESSAGE = 'INBOX_NEW_MESSAGE',
  OCCASION_UPCOMING = 'OCCASION_UPCOMING',
  POST_PUBLISHED = 'POST_PUBLISHED',
  POST_HIGH_PERFORMANCE = 'POST_HIGH_PERFORMANCE',
}

export enum AutomationActionType {
  AUTO_REPLY = 'AUTO_REPLY',
  AUTO_HIDE_SPAM = 'AUTO_HIDE_SPAM',
  GENERATE_AI_DRAFT = 'GENERATE_AI_DRAFT',
  DISPATCH_WEBHOOK = 'DISPATCH_WEBHOOK',
  RECYCLE_POST = 'RECYCLE_POST',
}

export enum AutomationExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface AutomationConditions {
  keywords?: string[];
  platform?: string;
  daysBefore?: number;
  minEngagementRate?: number;
  matchType?: 'ANY' | 'ALL' | 'REGEX';
}

export interface AutomationActionConfig {
  replyTemplate?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  aiPromptPrefix?: string;
  recycleDelayDays?: number;
  notifyRoles?: string[];
}

export interface AutomationRuleDto {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  triggerType: AutomationTriggerType;
  conditions: AutomationConditions;
  actionType: AutomationActionType;
  actionConfig: AutomationActionConfig;
  isEnabled: boolean;
  executionCount: number;
  lastExecutedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  conditions: AutomationConditions;
  actionType: AutomationActionType;
  actionConfig: AutomationActionConfig;
  isEnabled?: boolean;
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  triggerType?: AutomationTriggerType;
  conditions?: AutomationConditions;
  actionType?: AutomationActionType;
  actionConfig?: AutomationActionConfig;
  isEnabled?: boolean;
}

export interface AutomationExecutionLogDto {
  id: string;
  ruleId: string;
  workspaceId: string;
  triggerEvent: string;
  status: AutomationExecutionStatus;
  inputPayload?: any;
  outputResult?: any;
  errorMessage?: string | null;
  executedAt: string;
}

export interface AutomationRecipeDto {
  id: string;
  name: string;
  description: string;
  category: 'MODERATION' | 'ENGAGEMENT' | 'AI_MARKETING' | 'INTEGRATION';
  triggerType: AutomationTriggerType;
  actionType: AutomationActionType;
  defaultConditions: AutomationConditions;
  defaultActionConfig: AutomationActionConfig;
}

export interface TriggerRuleTestDto {
  sampleText?: string;
  platform?: string;
  senderName?: string;
}

export interface TriggerRuleTestResultDto {
  matched: boolean;
  actionType: AutomationActionType;
  simulatedOutput: any;
  reason?: string;
}

// Stage 15: Bulk CSV / Batch Calendar Importer

export interface BulkScheduleRowDto {
  rowNumber: number;
  scheduledAt: string;
  timezone?: string;
  title?: string;
  caption: string;
  platforms: SocialPlatform[];
  socialAccountIds?: string[];
  accountUsernames?: string[];
  mediaUrls?: string[];
  hashtags?: string[];
  draftId?: string;
}

export interface BulkScheduleValidationRowResult {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: BulkScheduleRowDto;
  targetAccounts: {
    id: string;
    name: string;
    platform: SocialPlatform;
    username?: string | null;
  }[];
}

export interface BulkScheduleValidationResponse {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: BulkScheduleValidationRowResult[];
}

export interface BulkScheduleImportDto {
  rows: BulkScheduleRowDto[];
}

export interface BulkScheduleImportItemResult {
  rowNumber: number;
  scheduledPostId: string;
  draftId: string;
  title: string;
  scheduledAt: string;
  targetCount: number;
}

export interface BulkScheduleImportResponse {
  importedCount: number;
  failedCount: number;
  scheduledPosts: BulkScheduleImportItemResult[];
  errors?: { rowNumber: number; error: string }[];
}

// ==========================================
// Phase 16: Branded Link Shortener & UTM Attribution
// ==========================================

export interface UtmParametersDto {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface CreateShortenedLinkDto {
  originalUrl: string;
  customCode?: string;
  title?: string;
  utmParameters?: UtmParametersDto;
}

export interface ShortenedLinkDto {
  id: string;
  workspaceId: string;
  createdById: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  destinationUrl: string;
  totalClicks: number;
  lastClickedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkClickEventDto {
  id: string;
  shortenedLinkId: string;
  clickedAt: string;
  referrer?: string | null;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'OTHER';
  browser?: string | null;
  os?: string | null;
  countryCode?: string | null;
}

export interface LinkClickAnalyticsDto {
  link: ShortenedLinkDto;
  totalClicks: number;
  uniqueClicksEstimate: number;
  clicksOverTime: {
    date: string;
    clicks: number;
  }[];
  deviceBreakdown: {
    deviceType: string;
    count: number;
    percentage: number;
  }[];
  topReferrers: {
    referrer: string;
    count: number;
  }[];
  recentEvents: LinkClickEventDto[];
}

// ==========================================
// Phase 17: Social Listening, Brand Mentions & Sentiment Monitoring Engine
// ==========================================

export enum ListeningSentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export interface ListeningQueryDto {
  id: string;
  workspaceId: string;
  createdById: string;
  name: string;
  keywords: string[];
  excludedKeywords: string[];
  platforms: SocialPlatform[];
  languages: string[];
  isActive: boolean;
  sentimentFilter: string;
  totalMentions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListeningQueryDto {
  name: string;
  keywords: string[];
  excludedKeywords?: string[];
  platforms: SocialPlatform[];
  languages?: string[];
  sentimentFilter?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface UpdateListeningQueryDto {
  name?: string;
  keywords?: string[];
  excludedKeywords?: string[];
  platforms?: SocialPlatform[];
  languages?: string[];
  isActive?: boolean;
  sentimentFilter?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface ListeningMentionDto {
  id: string;
  queryId: string;
  queryName?: string;
  workspaceId: string;
  platform: SocialPlatform;
  externalId: string;
  authorHandle: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  authorFollowersCount: number;
  content: string;
  url?: string | null;
  publishedAt: string;
  sentiment: ListeningSentiment;
  sentimentScore: number;
  reachEstimate: number;
  engagementCount: number;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
}

export interface ListeningStreamFilterDto {
  queryId?: string;
  sentiment?: ListeningSentiment | 'ALL';
  platform?: SocialPlatform | 'ALL';
  search?: string;
  onlyStarred?: boolean;
  page?: number;
  limit?: number;
}

export interface ListeningSentimentBreakdownDto {
  sentiment: ListeningSentiment;
  count: number;
  percentage: number;
}

export interface ListeningAnalyticsSummaryDto {
  totalMentions: number;
  estimatedTotalReach: number;
  averageSentimentScore: number;
  sentimentBreakdown: ListeningSentimentBreakdownDto[];
  mentionsOverTime: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }[];
  topAuthors: {
    authorHandle: string;
    authorName?: string | null;
    platform: SocialPlatform;
    followersCount: number;
    mentionsCount: number;
  }[];
  platformBreakdown: {
    platform: SocialPlatform;
    count: number;
    percentage: number;
  }[];
}

// ==========================================
// Phase 18: Multi-Level Approval Matrix & Collaborative Content Review Workflow
// ==========================================

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  SKIPPED = 'SKIPPED',
}

export interface ApprovalWorkflowStepDto {
  id: string;
  workflowId: string;
  stepOrder: number;
  name: string;
  requiredRole: WorkspaceRole;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflowDto {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  steps: ApprovalWorkflowStepDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalWorkflowStepDto {
  stepOrder: number;
  name: string;
  requiredRole: WorkspaceRole;
  isMandatory?: boolean;
}

export interface CreateApprovalWorkflowDto {
  name: string;
  description?: string;
  isDefault?: boolean;
  steps: CreateApprovalWorkflowStepDto[];
}

export interface UpdateApprovalWorkflowDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
  steps?: CreateApprovalWorkflowStepDto[];
}

export interface DraftStepReviewDto {
  id: string;
  draftId: string;
  stepId: string;
  stepName: string;
  stepOrder: number;
  requiredRole: WorkspaceRole;
  isMandatory: boolean;
  reviewerUserId?: string | null;
  reviewerName?: string | null;
  status: ApprovalStepStatus;
  decisionNotes?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftApprovalProgressDto {
  draftId: string;
  workflowId?: string | null;
  workflowName?: string | null;
  currentStepOrder: number;
  totalSteps: number;
  isFullyApproved: boolean;
  isChangesRequested: boolean;
  steps: DraftStepReviewDto[];
}

export interface RecordReviewDecisionDto {
  decision: 'APPROVE' | 'REQUEST_CHANGES';
  notes?: string;
}

export interface DraftCommentDto {
  id: string;
  draftId: string;
  workspaceId: string;
  authorUserId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentCommentId?: string | null;
  isResolved: boolean;
  resolvedByUserId?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  replies?: DraftCommentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftCommentDto {
  content: string;
  parentCommentId?: string;
}

// ==========================================
// Phase 19: White-Label Agency Portals & Automated PDF/Email Executive Reports
// ==========================================

export enum ReportFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ON_DEMAND = 'ON_DEMAND',
}

export interface WhiteLabelConfigDto {
  id: string;
  workspaceId: string;
  brandName: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail?: string | null;
  portalTitle?: string | null;
  customCss?: string | null;
  hidePoweredBy: boolean;
  clientAccessUrl?: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertWhiteLabelConfigDto {
  brandName: string;
  customDomain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  portalTitle?: string;
  customCss?: string;
  hidePoweredBy?: boolean;
  clientAccessUrl?: string;
  isEnabled?: boolean;
}

export interface ExecutiveReportScheduleDto {
  id: string;
  workspaceId: string;
  createdById: string;
  name: string;
  frequency: ReportFrequency;
  recipients: string[];
  includeSocial: boolean;
  includeLinks: boolean;
  includeListening: boolean;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportScheduleDto {
  name: string;
  frequency: ReportFrequency;
  recipients: string[];
  includeSocial?: boolean;
  includeLinks?: boolean;
  includeListening?: boolean;
  isActive?: boolean;
}

export interface UpdateReportScheduleDto {
  name?: string;
  frequency?: ReportFrequency;
  recipients?: string[];
  includeSocial?: boolean;
  includeLinks?: boolean;
  includeListening?: boolean;
  isActive?: boolean;
}

export interface ExecutiveReportTopPostDto {
  id: string;
  content: string;
  platform: string;
  impressions: number;
  engagement: number;
}

export interface ExecutiveReportSummaryDto {
  totalImpressions: number;
  totalReach: number;
  netFollowerGrowth: number;
  totalLinkClicks: number;
  totalListeningMentions: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topPosts: ExecutiveReportTopPostDto[];
}

export interface GeneratedExecutiveReportDto {
  id: string;
  workspaceId: string;
  scheduleId?: string | null;
  title: string;
  frequency: ReportFrequency;
  periodStart: string;
  periodEnd: string;
  metricsSummary: ExecutiveReportSummaryDto;
  htmlContent: string;
  pdfStorageUrl?: string | null;
  recipientsSent: string[];
  sentAt?: string | null;
  status: string;
  createdAt: string;
}

export interface GenerateReportRequestDto {
  title?: string;
  scheduleId?: string;
  periodDays?: number;
  recipients?: string[];
  includeSocial?: boolean;
  includeLinks?: boolean;
  includeListening?: boolean;
}

// ==========================================
// Phase 20: AI Smart Auto-Moderation & Sentiment-Driven Triage in Unified Inbox
// ==========================================

export enum InboxModerationAction {
  AUTO_HIDE = 'AUTO_HIDE',
  AUTO_FLAG = 'AUTO_FLAG',
  ASSIGN_TO_ROLE = 'ASSIGN_TO_ROLE',
  AUTO_REPLY = 'AUTO_REPLY',
  CLOSE_INTERACTION = 'CLOSE_INTERACTION',
}

export interface InboxModerationRuleDto {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  triggerSentiment: string;
  keywords: string[];
  action: InboxModerationAction;
  actionPayload: Record<string, any>;
  isEnabled: boolean;
  priority: number;
  executionCount: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboxModerationRuleDto {
  name: string;
  description?: string;
  triggerSentiment?: string;
  keywords?: string[];
  action: InboxModerationAction;
  actionPayload?: Record<string, any>;
  isEnabled?: boolean;
  priority?: number;
}

export interface UpdateInboxModerationRuleDto {
  name?: string;
  description?: string;
  triggerSentiment?: string;
  keywords?: string[];
  action?: InboxModerationAction;
  actionPayload?: Record<string, any>;
  isEnabled?: boolean;
  priority?: number;
}

export interface InboxAutoReplyTemplateDto {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  category: string;
  sentimentMatch?: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboxAutoReplyTemplateDto {
  title: string;
  content: string;
  category?: string;
  sentimentMatch?: string;
}

export interface UpdateInboxAutoReplyTemplateDto {
  title?: string;
  content?: string;
  category?: string;
  sentimentMatch?: string;
}

export interface InboxTriageResultDto {
  matchedRuleId?: string | null;
  matchedRuleName?: string | null;
  actionTaken: InboxModerationAction | 'NONE';
  actionDetails?: string | null;
  autoReplied: boolean;
  flagged: boolean;
  hidden: boolean;
  assignedUserId?: string | null;
}

// ==========================================
// Phase 21: Competitor Benchmarking & Public Intelligence Hub
// ==========================================

export enum CompetitorCategory {
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
  ASPIRATIONAL = 'ASPIRATIONAL',
}

export interface CompetitorSocialAccountDto {
  id: string;
  competitorProfileId: string;
  platform: SocialPlatform;
  handle: string;
  publicUrl?: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isActive: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorBenchmarkSnapshotDto {
  id: string;
  competitorProfileId: string;
  platform?: SocialPlatform | null;
  period: AnalyticsMetricPeriod;
  snapshotDate: string;
  followerGrowthRate: number;
  followersCount: number;
  engagementRate: number;
  postingFrequencyWeekly: number;
  estReach: number;
  estImpressions: number;
  sentimentScore: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topPostExcerpt?: string | null;
  topPostEngagementRate?: number | null;
  createdAt: string;
}

export interface CompetitorProfileDto {
  id: string;
  workspaceId: string;
  name: string;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  category: CompetitorCategory;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  socialAccounts?: CompetitorSocialAccountDto[];
  latestSnapshot?: CompetitorBenchmarkSnapshotDto | null;
}

export interface CreateCompetitorSocialAccountInput {
  platform: SocialPlatform;
  handle: string;
  publicUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export interface CreateCompetitorProfileDto {
  name: string;
  websiteUrl?: string;
  avatarUrl?: string;
  category?: CompetitorCategory;
  notes?: string;
  accounts?: CreateCompetitorSocialAccountInput[];
}

export interface UpdateCompetitorProfileDto {
  name?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  category?: CompetitorCategory;
  notes?: string;
  isActive?: boolean;
}

export interface AddCompetitorAccountDto {
  platform: SocialPlatform;
  handle: string;
  publicUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export interface CompetitorLeaderboardItemDto {
  name: string;
  isOwnBrand: boolean;
  category?: CompetitorCategory | 'OWN_BRAND';
  avatarUrl?: string | null;
  totalFollowers: number;
  avgEngagementRate: number;
  followerGrowthRate: number;
  postingFrequencyWeekly: number;
  sentimentScore: number;
}

export interface CompetitorComparisonSummaryDto {
  period: AnalyticsMetricPeriod;
  brandSummary: {
    totalFollowers: number;
    avgEngagementRate: number;
    followerGrowthRate: number;
    postingFrequencyWeekly: number;
    sentimentScore: number;
  };
  competitorBenchmarkAvg: {
    totalFollowers: number;
    avgEngagementRate: number;
    followerGrowthRate: number;
    postingFrequencyWeekly: number;
    sentimentScore: number;
  };
  leaderboard: CompetitorLeaderboardItemDto[];
  keyInsights: string[];
  topPerformingPosts: {
    brandOrCompetitor: string;
    platform: SocialPlatform;
    excerpt: string;
    engagementRate: number;
    date: string;
  }[];
}

// ==========================================
// Phase 22: Outbound Webhooks & Developer Integrations Engine
// ==========================================

export enum WebhookDeliveryStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING_RETRY = 'PENDING_RETRY',
}

export const WEBHOOK_EVENT_TYPES = [
  'post.published',
  'post.failed',
  'inbox.message_received',
  'inbox.crisis_flagged',
  'approval.requested',
  'approval.approved',
  'approval.rejected',
  'competitor.lead_change',
  'webhook.test_ping',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookDeliveryLogDto {
  id: string;
  subscriptionId: string;
  workspaceId: string;
  eventType: string;
  payload: Record<string, any>;
  statusCode?: number | null;
  durationMs: number;
  responseBody?: string | null;
  errorMessage?: string | null;
  status: WebhookDeliveryStatus;
  attemptNumber: number;
  nextRetryAt?: string | null;
  createdAt: string;
  subscriptionName?: string;
}

export interface WebhookSubscriptionDto {
  id: string;
  workspaceId: string;
  name: string;
  targetUrl: string;
  secretKey: string;
  eventTypes: string[];
  isActive: boolean;
  description?: string | null;
  failureCount: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  latestDeliveries?: WebhookDeliveryLogDto[];
}

export interface CreateWebhookSubscriptionDto {
  name: string;
  targetUrl: string;
  eventTypes: string[];
  description?: string;
  isActive?: boolean;
}

export interface UpdateWebhookSubscriptionDto {
  name?: string;
  targetUrl?: string;
  eventTypes?: string[];
  description?: string;
  isActive?: boolean;
}

export interface WebhookTestPingResponseDto {
  delivered: boolean;
  statusCode?: number | null;
  durationMs: number;
  responseBody?: string | null;
  errorMessage?: string | null;
  signatureHeader: string;
  timestampHeader: string;
}

export interface WebhookSecretRotateResponseDto {
  subscriptionId: string;
  newSecretKey: string;
  rotatedAt: string;
}

// ==========================================
// Operational: Transactional Mail & Notifications
// ==========================================

export type EmailTemplateType =
  | 'WORKSPACE_INVITATION'
  | 'EXECUTIVE_REPORT'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_DECISION'
  | 'WEBHOOK_FAILURE_ALERT'
  | 'GENERIC_ALERT';

export interface SendEmailRequestDto {
  to: string | string[];
  subject: string;
  template: EmailTemplateType;
  templateData: Record<string, any>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

export interface EmailDeliveryResultDto {
  success: boolean;
  messageId?: string;
  provider: string;
  recipientCount: number;
  timestamp: string;
  error?: string;
}

// ==========================================
// Operational: CNAME SSL & Custom Domain
// ==========================================

export interface CnameVerificationResultDto {
  domain: string;
  configured: boolean;
  expectedTarget: string;
  resolvedTarget?: string | null;
  matches: boolean;
  message: string;
  verifiedAt: string;
}

// ==========================================
// Operational: Web Push Notifications & PWA
// ==========================================

export interface PushSubscriptionKeysDto {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDto {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeysDto;
}

export interface PushNotificationPayloadDto {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface PushSubscriptionRecordDto {
  id: string;
  userId: string;
  endpoint: string;
  deviceType?: string;
  createdAt: string;
}
