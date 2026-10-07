import { Router, Response, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { requireDb } from "../middleware/db";

export const cardsRouter = Router();

// ── Public routes (no auth) ───────────────────────────────────────────────────

// GET /api/cards/public/:username — MUST be before /:id
cardsRouter.get("/public/:username", requireDb, async (req: Request, res: Response) => {
  const username = req.params.username.toLowerCase().trim();
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) {
    res.status(404).json({ error: "Card not found." }); return;
  }

  const card = await prisma.card.findFirst({
    where: { username, status: "published", deletedAt: null },
    include: {
      theme: true,
      sections: { where: { isEnabled: true }, orderBy: { position: "asc" } },
      socialLinks: { where: { isActive: true }, orderBy: { position: "asc" } },
      services: { where: { isActive: true }, orderBy: { position: "asc" } },
      products: { where: { isActive: true }, orderBy: { position: "asc" } },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
      paymentConfig: { where: { isActive: true } },
      galleryItems: { orderBy: { position: "asc" } },
      reviews: { where: { isActive: true } },
      testimonials: { where: { isActive: true } },
      offers: { where: { isActive: true } },
    },
  });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }

  // Bump view count fire-and-forget
  prisma.card.update({ where: { id: card.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);

  res.json(card);
});

// ── Authenticated routes ──────────────────────────────────────────────────────
cardsRouter.use(authenticate, requireDb);

// GET /api/cards
cardsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const cards = await prisma.card.findMany({
    where: { userId: req.userId!, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, username: true, fullName: true, designation: true,
      status: true, viewCount: true, leadCount: true, updatedAt: true,
      theme: { select: { slug: true, name: true } },
    },
  });
  res.json(cards);
});

// POST /api/cards
cardsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    fullName: z.string().min(2).max(120),
    designation: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal("")),
    city: z.string().max(80).optional(),
    themeSlug: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message }); return;
  }

  // Check plan card limit
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.userId!, status: { in: ["active", "grace"] } },
    include: { plan: true },
  });
  const limits = (sub?.plan.limits ?? {}) as Record<string, unknown>;
  const maxCards = typeof limits.max_cards === "number" ? limits.max_cards : 1;
  const cardCount = await prisma.card.count({ where: { userId: req.userId!, deletedAt: null } });
  if (maxCards >= 0 && cardCount >= maxCards) {
    res.status(403).json({ error: `Your plan allows ${maxCards} card(s). Upgrade to create more.` }); return;
  }

  const { fullName, designation, phone, email, city, themeSlug } = parsed.data;
  const base = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-card";
  const candidates = [base, `${base}-1`, `${base}-2`, `${base}-3`, `${base}-${Date.now().toString(36).slice(-4)}`];

  let card = null;
  for (const username of candidates) {
    try {
      const theme = themeSlug
        ? await prisma.theme.findFirst({ where: { slug: themeSlug, isActive: true } })
        : null;

      card = await prisma.card.create({
        data: {
          userId: req.userId!,
          username,
          fullName,
          designation: designation ?? null,
          phone: phone ?? null,
          email: email || null,
          city: city ?? null,
          themeId: theme?.id ?? null,
          sections: {
            createMany: {
              data: ["about","contact","social","services","products","gallery","location","business_hours","reviews","enquiry","payment"]
                .map((key, i) => ({ sectionKey: key, position: (i + 1) * 10, isEnabled: true })),
            },
          },
        },
        select: { id: true, username: true, fullName: true, status: true },
      });
      break;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }

  if (!card) { res.status(500).json({ error: "Could not create card. Please try again." }); return; }
  res.status(201).json(card);
});

// GET /api/cards/:id
cardsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const card = await prisma.card.findFirst({
    where: { id: req.params.id, userId: req.userId!, deletedAt: null },
    include: {
      theme: true,
      sections: { orderBy: { position: "asc" } },
      socialLinks: { orderBy: { position: "asc" } },
      services: { orderBy: { position: "asc" } },
      products: { orderBy: { position: "asc" } },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
      paymentConfig: true,
      galleryItems: { orderBy: { position: "asc" } },
    },
  });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }
  res.json(card);
});

// PATCH /api/cards/:id
cardsRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    fullName: z.string().min(2).max(120).optional(),
    username: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
    designation: z.string().max(80).optional(),
    company: z.string().max(120).optional(),
    bio: z.string().max(600).optional(),
    phone: z.string().max(20).optional(),
    whatsapp: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    address: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    pincode: z.string().max(10).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }

  const existing = await prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId!, deletedAt: null } });
  if (!existing) { res.status(404).json({ error: "Card not found." }); return; }

  const updated = await prisma.card.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, username: true, fullName: true, updatedAt: true },
  });
  res.json(updated);
});

// PATCH /api/cards/:id/publish
cardsRouter.patch("/:id/publish", async (req: AuthRequest, res: Response) => {
  const { published } = z.object({ published: z.boolean() }).parse(req.body);

  const card = await prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId!, deletedAt: null } });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }
  if (card.status === "suspended") { res.status(403).json({ error: "Card is suspended." }); return; }

  const updated = await prisma.card.update({
    where: { id: req.params.id },
    data: { status: published ? "published" : "draft", publishedAt: published ? new Date() : undefined },
    select: { id: true, status: true },
  });
  res.json(updated);
});

// DELETE /api/cards/:id
cardsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const card = await prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId!, deletedAt: null } });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }

  await prisma.card.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "draft" } });
  res.json({ deleted: true });
});
