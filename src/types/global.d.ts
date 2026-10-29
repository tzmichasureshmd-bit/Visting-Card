import type { ReactNode } from "react";

declare global {
  /**
   * Layout props for Next.js App Router layouts
   */
  type LayoutProps<T extends string = "/"> = {
    children: ReactNode;
    params?: Promise<Record<string, string>>;
  };

  /**
   * Page props for Next.js App Router pages
   */
  type PageProps<
    TParams extends Record<string, string> = Record<string, string>,
    TSearchParams extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>
  > = {
    params?: Promise<TParams>;
    searchParams?: Promise<TSearchParams>;
  };
}

export {};
