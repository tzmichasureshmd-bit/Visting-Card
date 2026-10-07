import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const referralsRouter = Router();
referralsRouter.use(authenticate);

// GET /api/referrals/wallet
referralsRouter.get("/wallet", async (req: AuthRequest, res: Response) => {
  const wallet = await prisma.referralWallet.findUnique({ where: { userId: req.userId! } });
  res.json(wallet ?? { availablePaise: 0, pendingPaise: 0, lifetimeEarned: 0, lifetimePaid: 0 });
});

// GET /api/referrals/rewards
referralsRouter.get("/rewards", async (req: AuthRequest, res: Response) => {
  const rewards = await prisma.referralReward.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { subscription: { include: { plan: { select: { name: true } } } } },
  });
  res.json(rewards);
});

// GET /api/referrals/list
referralsRouter.get("/list", async (req: AuthRequest, res: Response) => {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, status: true, createdAt: true,
      referredUser: { select: { email: true, fullName: true } },
    },
  });
  res.json(referrals);
});

// GET /api/referrals/payouts
referralsRouter.get("/payouts", async (req: AuthRequest, res: Response) => {
  const payouts = await prisma.payoutRequest.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    select: { id: true, amountPaise: true, method: true, status: true, createdAt: true, payoutReference: true },
  });
  res.json(payouts);
});

// POST /api/referrals/withdraw
referralsRouter.post("/withdraw", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    amountPaise: z.number().int().min(1),
    upiId: z.string().min(5).max(100).regex(/^[\w.\-]+@[\w]+$/, "Invalid UPI ID."),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }

  const { amountPaise, upiId } = parsed.data;

  // Atomic balance check + deduction using a transaction
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.referralWallet.findUnique({
      where: { userId: req.userId! },
    });

    if (!wallet || wallet.availablePaise < amountPaise) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    if (amountPaise < 50000) {
      throw new Error("BELOW_MINIMUM");
    }

    // Hold funds immediately
    await tx.referralWallet.update({
      where: { userId: req.userId! },
      data: { availablePaise: { decrement: amountPaise } },
    });

    return tx.payoutRequest.create({
      data: { userId: req.userId!, amountPaise, method: "upi", upiId },
      select: { id: true, amountPaise: true, status: true },
    });
  });

  res.status(201).json(result);
});
