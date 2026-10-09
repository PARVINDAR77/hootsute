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

