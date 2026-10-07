/**
 * The card builder is a full-screen editor with its own header.
 * This layout renders children directly so the dashboard sidebar shell
 * does not wrap it — the builder manages its own chrome.
 */
export default function CardBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
