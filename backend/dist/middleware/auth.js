"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.signToken = signToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authentication required." });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token." });
    }
}
function requireAdmin(req, res, next) {
    if (req.userRole !== "admin") {
        res.status(403).json({ error: "Admin access required." });
        return;
    }
    next();
}
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" });
}
//# sourceMappingURL=auth.js.map