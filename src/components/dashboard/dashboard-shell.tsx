import { AppShell } from "@/components/dashboard/app-shell";

export function DashboardShell({
  children,
  user,
  planName,
}: {
  children: React.ReactNode;
  user: { email: string; name: string };
  planName: string;
}) {
  return (
    <AppShell user={user} planName={planName}>
      {children}
    </AppShell>
  );
}
