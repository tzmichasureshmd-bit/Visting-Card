import { Router, Request, Response } from "express";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const analyticsRouter = Router();

const ALLOWED_EVENTS = new Set([
  "card_view","whatsapp_click","call_click","email_click",
  "website_click","share","contact_save","upi_click","qr_scan",
]);

function visitorHash(ip: string, ua: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.ANALYTICS_SALT ?? "dvcard-dev";
  return createHash("sha256").update(`${salt}:${day}:${ip}:${ua}`).digest("hex").slice(0, 32);
}

function deviceCategory(ua: string | undefined): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

// POST /api/analytics/track — public, fire-and-forget
analyticsRouter.post("/track", async (req: Request, res: Response) => {
  res.status(204).end(); // always respond immediately

  try {
    const schema = z.object({
      cardId: z.string().uuid(),
      eventType: z.string(),
      referrer: z.string().max(500).nullable().optional(),
      utmSource: z.string().max(60).optional(),
      utmCampaign: z.string().max(60).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !ALLOWED_EVENTS.has(parsed.data.eventType)) return;

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "";
    const ua = req.headers["user-agent"] ?? "";

    await prisma.analyticsEvent.create({
      data: {
        cardId: parsed.data.cardId,
        eventType: parsed.data.eventType,
        visitorHash: visitorHash(ip, ua),
        deviceCategory: deviceCategory(ua),
        referrer: parsed.data.referrer ?? null,
        utmSource: parsed.data.utmSource ?? null,
        utmCampaign: parsed.data.utmCampaign ?? null,
      },
    });

    if (parsed.data.eventType === "card_view") {
      await prisma.card.update({ where: { id: parsed.data.cardId }, data: { viewCount: { increment: 1 } } });
    }
    if (parsed.data.eventType === "qr_scan") {
      await prisma.card.update({ where: { id: parsed.data.cardId }, data: { qrScanCount: { increment: 1 } } });
    }
  } catch { /* swallow — tracking must never error */ }
});

// GET /api/analytics/:cardId — owner summary
analyticsRouter.get("/:cardId", authenticate, async (req: AuthRequest, res: Response) => {
  const card = await prisma.card.findFirst({
    where: { id: req.params.cardId, userId: req.userId!, deletedAt: null },
  });
  if (!card) { res.status(404).json({ error: "Card not found." }); return; }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [views, scans, bySource, byDevice] = await Promise.all([
    prisma.analyticsEvent.count({ where: { cardId: card.id, eventType: "card_view", createdAt: { gte: since } } }),
    prisma.analyticsEvent.count({ where: { cardId: card.id, eventType: "qr_scan", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({
      by: ["trafficSource"],
      where: { cardId: card.id, createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { trafficSource: "desc" } },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["deviceCategory"],
      where: { cardId: card.id, createdAt: { gte: since } },
      _count: true,
    }),
  ]);

  res.json({
    totals: { views, scans, leads: card.leadCount },
    sources: bySource.map((r) => ({ label: r.trafficSource ?? "unknown", count: r._count })),
    devices: byDevice.map((r) => ({ label: r.deviceCategory ?? "unknown", count: r._count })),
  });
});
