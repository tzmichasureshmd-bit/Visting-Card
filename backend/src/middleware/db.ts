import { Request, Response, NextFunction } from "express";
import { isDbReady } from "../lib/prisma";

/**
 * Returns 503 with a helpful message when the database is not reachable.
 * Attach this before any route that needs the DB.
 */
export async function requireDb(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const ok = await isDbReady();
  if (!ok) {
    res.status(503).json({
      error: "Database not connected.",
      fix: "Set DATABASE_URL in backend/.env then restart the server.",
    });
    return;
  }
  next();
}
