import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

// GET /api/admin/stats
adminRouter.get("/stats", async (_req, res: Response) => {
  const [users, cards, published, leads, payments] = await Promise.all([
    prisma.profile.count(),
    prisma.card.count({ where: { deletedAt: null } }),
    prisma.card.count({ where: { status: "published", deletedAt: null } }),
    prisma.lead.count(),
    prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "captured" } }),
  ]);
  res.json({
    users, cards, published, leads,
    revenueRupees: Math.floor((payments._sum.amountPaise ?? 0) / 100),
  });
});

// GET /api/admin/users
adminRouter.get("/users", async (req, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const search = req.query.search as string | undefined;
  const users = await prisma.profile.findMany({
    where: search ? { OR: [{ email: { contains: search } }, { fullName: { contains: search } }] } : undefined,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
    select: { id: true, email: true, fullName: true, role: true, status: true, createdAt: true },
  });
  res.json(users);
});

// PATCH /api/admin/users/:id — suspend/activate/change role
adminRouter.patch("/users/:id", async (req, res: Response) => {
  const schema = z.object({
    status: z.enum(["active", "suspended"]).optional(),
    role: z.enum(["user", "reseller", "admin"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input." }); return; }

  const updated = await prisma.profile.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, email: true, status: true, role: true },
  });
  res.json(updated);
});

// GET /api/admin/payments
adminRouter.get("/payments", async (req, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
    include: {
      user: { select: { email: true, fullName: true } },
      plan: { select: { name: true } },
    },
  });
  res.json(payments);
});

// GET /api/admin/withdrawals
adminRouter.get("/withdrawals", async (req, res: Response) => {
  const status = req.query.status as string | undefined;
  const payouts = await prisma.payoutRequest.findMany({
    where: status ? { status: status as "requested" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true, fullName: true } } },
  });
  res.json(payouts);
});

// PATCH /api/admin/withdrawals/:id — approve/reject/mark paid
adminRouter.patch("/withdrawals/:id", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(["approved", "rejected", "paid", "under_review"]),
    adminNote: z.string().max(500).optional(),
    payoutReference: z.string().max(200).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input." }); return; }

  const payout = await prisma.payoutRequest.findUnique({ where: { id: req.params.id } });
  if (!payout) { res.status(404).json({ error: "Payout not found." }); return; }

  const updated = await prisma.payoutRequest.update({
    where: { id: req.params.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? null,
      payoutReference: parsed.data.payoutReference ?? null,
      processedAt: parsed.data.status === "paid" ? new Date() : undefined,
    },
  });

  // If rejected, refund the held balance
  if (parsed.data.status === "rejected") {
    await prisma.referralWallet.update({
      where: { userId: payout.userId },
      data: { availablePaise: { increment: payout.amountPaise } },
    });
  }

  // If paid, update lifetime_paid
  if (parsed.data.status === "paid") {
    await prisma.referralWallet.update({
      where: { userId: payout.userId },
      data: { lifetimePaid: { increment: payout.amountPaise } },
    });
  }

  res.json(updated);
});

// GET /api/admin/plans
adminRouter.get("/plans", async (_req, res: Response) => {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(plans);
});

// PATCH /api/admin/plans/:id
adminRouter.patch("/plans/:id", async (req, res: Response) => {
  const schema = z.object({
    name: z.string().max(80).optional(),
    pricePaise: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    limits: z.record(z.unknown()).optional().transform(v => v as object),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input." }); return; }

  const updated = await prisma.plan.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(updated);
});
