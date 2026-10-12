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
}

export enum SocialAccountType {
  FACEBOOK_PAGE = 'FACEBOOK_PAGE',
  INSTAGRAM_BUSINESS = 'INSTAGRAM_BUSINESS',
  INSTAGRAM_CREATOR = 'INSTAGRAM_CREATOR',
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

