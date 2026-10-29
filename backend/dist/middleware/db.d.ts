import { Request, Response, NextFunction } from "express";
/**
 * Returns 503 with a helpful message when the database is not reachable.
 * Attach this before any route that needs the DB.
 */
export declare function requireDb(_req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=db.d.ts.map