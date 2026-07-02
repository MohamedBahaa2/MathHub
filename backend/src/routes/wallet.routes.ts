import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { PaymentStatus, WalletTxType, Role } from "@prisma/client";
import { audit } from "../services/audit.service";

const router = Router();
router.use(authenticate);

async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
}

// GET /api/wallet — current user's wallet + transactions
router.get("/", asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user!.id);
  res.json({ wallet });
}));

// POST /api/wallet/topup — initiate a top-up (placeholder for PayTabs integration)
router.post("/topup", validate(z.object({
  body: z.object({
    amount: z.coerce.number().min(1).max(10000),
    currency: z.string().default("USD"),
  }),
})), asyncHandler(async (req, res) => {
  const { amount, currency } = req.body as { amount: number; currency: string };
  const wallet = await getOrCreateWallet(req.user!.id);

  // Create a PENDING transaction (would be confirmed by PayTabs webhook in production)
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: WalletTxType.TOP_UP,
      amount,
      description: `Wallet top-up of ${amount} ${currency}`,
      status: PaymentStatus.PENDING,
    },
  });

  // For dev/testing: immediately confirm top-up and credit wallet
  await prisma.$transaction([
    prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: { status: PaymentStatus.PAID },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
  ]);

  const updatedWallet = await getOrCreateWallet(req.user!.id);
  await audit(req, "WALLET_TOPUP", { entityType: "Wallet", entityId: wallet.id, metadata: { amount, currency } });
  res.json({ wallet: updatedWallet, message: `Successfully added ${currency} ${amount} to your wallet.` });
}));

// GET /api/wallet/admin — ADMIN: list all wallets
router.get("/admin", requireAdmin, asyncHandler(async (req, res) => {
  const wallets = await prisma.wallet.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, studentCode: true, role: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ wallets });
}));

// POST /api/wallet/:userId/refund — ADMIN: issue a manual refund to a user's wallet
router.post("/:userId/refund", requireAdmin, validate(z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({
    amount: z.coerce.number().min(0.01),
    description: z.string().min(1).max(500),
  }),
})), asyncHandler(async (req, res) => {
  const { userId } = req.params as { userId: string };
  const { amount, description } = req.body as { amount: number; description: string };

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new AppError(404, "User not found", "NOT_FOUND");

  const wallet = await getOrCreateWallet(userId);

  const [transaction, updatedWallet] = await prisma.$transaction([
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTxType.REFUND,
        amount,
        description,
        status: PaymentStatus.PAID,
        processedBy: req.user!.id,
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
  ]);

  await audit(req, "WALLET_REFUND_ISSUED", {
    entityType: "Wallet",
    entityId: wallet.id,
    metadata: { amount, targetUserId: userId, description },
  });

  res.json({ transaction, wallet: updatedWallet });
}));

export default router;
