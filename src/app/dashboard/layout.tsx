import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { getUserPlan } from "@/lib/cards/limits";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const [profileResult, plan] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    getUserPlan(supabase, user.id),
  ]);

  const name =
    profileResult.data?.full_name ||
    user.email.split("@")[0] ||
    "Account";

  return (
    <DashboardShell user={{ email: user.email, name }} planName={plan.name}>
      {children}
    </DashboardShell>
  );
}
