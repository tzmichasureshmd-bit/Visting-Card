import { Router, Response, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const leadsRouter = Router();

// POST /api/leads — public, submit a lead from a card
leadsRouter.post("/", async (req: Request, res: Response) => {
  const schema = z.object({
    cardId: z.string().uuid(),
    name: z.string().min(2).max(120),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional().or(z.literal("")),
    message: z.string().max(2000).optional(),
    source: z.string().max(40).optional(),
    website: z.string().max(0).optional(), // honeypot
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  if (parsed.data.website) { res.status(204).end(); return; } // honeypot triggered

  const card = await prisma.card.findFirst({
    where: { id: parsed.data.cardId, status: "published", deletedAt: null },
  });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }

  // Duplicate suppression: one lead per phone per card per 30 days
  const recent = await prisma.lead.findFirst({
    where: {
      cardId: parsed.data.cardId,
      phone: parsed.data.phone,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) { res.status(200).json({ ok: true }); return; } // silent dedup

  const lead = await prisma.lead.create({
    data: {
      cardId: parsed.data.cardId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message || null,
      source: parsed.data.source ?? "enquiry",
    },
    select: { id: true },
  });

  // Bump lead counter
  await prisma.card.update({ where: { id: parsed.data.cardId }, data: { leadCount: { increment: 1 } } });

  res.status(201).json({ ok: true, leadId: lead.id });
});

// GET /api/leads/:cardId — owner reads their leads
leadsRouter.get("/:cardId", authenticate, async (req: AuthRequest, res: Response) => {
  const card = await prisma.card.findFirst({
    where: { id: req.params.cardId, userId: req.userId!, deletedAt: null },
  });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }

  const status = req.query.status as string | undefined;
  const leads = await prisma.lead.findMany({
    where: {
      cardId: req.params.cardId,
      ...(status ? { status: status as "new" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(leads);
});

// PATCH /api/leads/:id/status — update lead status
leadsRouter.patch("/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
  const { status } = z.object({
    status: z.enum(["new", "contacted", "interested", "converted", "lost"]),
  }).parse(req.body);

  const lead = await prisma.lead.findFirst({
    where: { id: req.params.id },
    include: { card: { select: { userId: true } } },
  });
  if (!lead || lead.card.userId !== req.userId) {
    res.status(404).json({ error: "Lead not found." }); return;
  }

  const updated = await prisma.lead.update({
    where: { id: req.params.id },
    data: {
      status,
      convertedAt: status === "converted" && !lead.convertedAt ? new Date() : undefined,
    },
  });
  res.json(updated);
});
