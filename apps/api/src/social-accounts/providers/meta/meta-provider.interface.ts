import { SocialAccountType, SocialProvider } from '@packages/shared';

export interface MetaInstagramAccount {
  id: string;
  name: string;
  username: string;
  profilePictureUrl?: string | null;
}

export interface MetaPageCandidate {
  id: string; // Facebook Page ID
  name: string;
  username?: string | null;
  category?: string | null;
  tasks?: string[];
  pageAccessToken: string; // Dedicated access token for this specific page
  instagramBusinessAccount?: MetaInstagramAccount | null;
}

export interface MetaTokenDebugInfo {
  appId: string;
  type: string;
  application: string;
  dataAccessExpiresAt?: number;
  expiresAt?: number;
  isValid: boolean;
  scopes: string[];
  userId: string;
}

export interface MetaOAuthResult {
  userAccessToken: string;
  longLivedUserToken: string;
  expiresAt?: Date | null;
  grantedScopes: string[];
  pages: MetaPageCandidate[];
}
