-- CreateEnum
CREATE TYPE "SocialProvider" AS ENUM ('META_FACEBOOK', 'META_INSTAGRAM');

-- CreateEnum
CREATE TYPE "SocialAccountType" AS ENUM ('FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS', 'INSTAGRAM_CREATOR');

-- CreateEnum
CREATE TYPE "SocialConnectionStatus" AS ENUM ('CONNECTED', 'EXPIRED', 'REVOKED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountUsername" TEXT,
    "accountType" "SocialAccountType" NOT NULL,
    "profileImageUrl" TEXT,
    "connectionStatus" "SocialConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "encryptedAccessToken" TEXT NOT NULL,
    "grantedScopes" TEXT[],
    "tokenExpiresAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedByUserId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_sessions" (
    "id" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_accounts_workspaceId_idx" ON "social_accounts"("workspaceId");

-- CreateIndex
CREATE INDEX "social_accounts_provider_providerAccountId_idx" ON "social_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "social_accounts_connectionStatus_idx" ON "social_accounts"("connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_workspaceId_provider_providerAccountId_key" ON "social_accounts"("workspaceId", "provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_key" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_state_idx" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_workspaceId_idx" ON "oauth_states"("workspaceId");

-- CreateIndex
CREATE INDEX "oauth_states_expiresAt_idx" ON "oauth_states"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_sessions_sessionTokenHash_key" ON "oauth_sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "oauth_sessions_sessionTokenHash_idx" ON "oauth_sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "oauth_sessions_workspaceId_idx" ON "oauth_sessions"("workspaceId");

-- CreateIndex
CREATE INDEX "oauth_sessions_expiresAt_idx" ON "oauth_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_sessions" ADD CONSTRAINT "oauth_sessions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_sessions" ADD CONSTRAINT "oauth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
