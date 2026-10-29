"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDb = requireDb;
const prisma_1 = require("../lib/prisma");
/**
 * Returns 503 with a helpful message when the database is not reachable.
 * Attach this before any route that needs the DB.
 */
async function requireDb(_req, res, next) {
    const ok = await (0, prisma_1.isDbReady)();
    if (!ok) {
        res.status(503).json({
            error: "Database not connected.",
            fix: "Set DATABASE_URL in backend/.env then restart the server.",
        });
        return;
    }
    next();
}
//# sourceMappingURL=db.js.map