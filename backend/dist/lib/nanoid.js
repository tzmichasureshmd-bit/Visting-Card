"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nanoid = nanoid;
// Simple nanoid-compatible random string for CommonJS
function nanoid(size = 21) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const bytes = require("crypto").randomBytes(size);
    for (let i = 0; i < size; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}
//# sourceMappingURL=nanoid.js.map