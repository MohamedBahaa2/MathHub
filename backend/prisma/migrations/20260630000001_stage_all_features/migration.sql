-- Stage 0: Wallet & Transaction System
-- Stage 1: Auth improvements (schema only)
-- Stage 2: Session Status enum rename
-- Stage 4: Ticket Messages
-- Stage 5: Quiz manual grading + Question answer modes

-- ── Stage 2: Rename SessionStatus enum values ─────────────────────────────
ALTER TYPE "SessionStatus" RENAME VALUE 'UPCOMING' TO 'SCHEDULED';
ALTER TYPE "SessionStatus" RENAME VALUE 'ENDED' TO 'PROCESSING';
ALTER TYPE "SessionStatus" RENAME VALUE 'RECORDING' TO 'RECORDED';

-- ── Stage 0: WalletTxType enum ─────────────────────────────────────────────
CREATE TYPE "WalletTxType" AS ENUM ('TOP_UP', 'PURCHASE', 'REFUND');

-- ── Stage 0: Wallet table ─────────────────────────────────────────────────
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- ── Stage 0: WalletTransaction table ─────────────────────────────────────
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "paytabsRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- ── Stage 4: TicketMessage table ──────────────────────────────────────────
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "helpRequestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketMessage_helpRequestId_createdAt_idx" ON "TicketMessage"("helpRequestId", "createdAt");

-- ── Stage 5: Quiz - requiresManualGrading ─────────────────────────────────
ALTER TABLE "Quiz" ADD COLUMN "requiresManualGrading" BOOLEAN NOT NULL DEFAULT false;

-- ── Stage 5: Question - answer mode booleans ──────────────────────────────
ALTER TABLE "Question" ADD COLUMN "allowsMCQ" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "allowsText" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "allowsMedia" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing type data to new boolean columns
UPDATE "Question" SET "allowsMCQ" = true WHERE "type" = 'MULTIPLE_CHOICE' OR "type" = 'MIXED';
UPDATE "Question" SET "allowsText" = true WHERE "type" = 'TEXT_ANSWER' OR "type" = 'MIXED';
UPDATE "Question" SET "allowsMedia" = true WHERE "type" = 'MEDIA_UPLOAD' OR "type" = 'MIXED';

-- ── Foreign Keys ──────────────────────────────────────────────────────────
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_helpRequestId_fkey"
    FOREIGN KEY ("helpRequestId") REFERENCES "HelpRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
