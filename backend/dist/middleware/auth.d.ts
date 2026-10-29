import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function signToken(userId: string, role: string): string;
//# sourceMappingURL=auth.d.ts.map