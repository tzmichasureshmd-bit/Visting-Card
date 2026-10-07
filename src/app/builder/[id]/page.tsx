import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardBuilder } from "@/components/builder/card-builder";
import { requireUser } from "@/lib/auth/session";
import { getEditorState } from "@/lib/cards/editor";
import { getUserPlan } from "@/lib/cards/limits";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Card builder",
  description: "Edit your card, choose a design and publish.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [state, profileResult, plan] = await Promise.all([
    getEditorState(id, user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    getUserPlan(supabase, user.id),
  ]);

  if (!state) notFound();

  const name = profileResult.data?.full_name || user.email.split("@")[0] || "Account";

  return (
    <CardBuilder
      state={state}
      user={{ email: user.email, name }}
      planName={plan.name}
    />
  );
}
