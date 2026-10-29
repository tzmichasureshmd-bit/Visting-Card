"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error("[error]", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
}
//# sourceMappingURL=error.js.map