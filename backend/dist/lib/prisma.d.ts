import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
/** Returns true when the DB is reachable. */
export declare function isDbReady(): Promise<boolean>;
//# sourceMappingURL=prisma.d.ts.map