import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight, User } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/cards/limits";

export const metadata: Metadata = {
  title: "Apply Template",
  description: "Choose which card to apply this template to.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ApplyTemplatePage({
  searchParams,
}: PageProps<"/dashboard/templates/apply">) {
  const user = await requireUser();
  const params = await searchParams;
  const templateId = params.template;

  if (!templateId) {
    redirect("/dashboard/templates");
  }

  const supabase = await createClient();
  const plan = await getUserPlan(supabase, user.id);

  // Get user's existing cards
  const { data: cards } = await supabase
    .from("cards")
    .select("id, username, full_name, designation, photo_url, status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!cards || cards.length === 0) {
    // No cards, redirect to create new
    redirect(`/dashboard/templates/select?template=${templateId}`);
  }

  const canCreateMore = plan.limits.max_cards === -1 || cards.length < plan.limits.max_cards;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--dv-off-white)" }}>
      {/* Header */}
      <header style={{ background: "var(--dv-white)", borderBottom: "1px solid var(--dv-border)", padding: "2.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
          <Link 
            href="/dashboard/templates"
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--dv-gray)",
              textDecoration: "none",
              marginBottom: "1rem"
            }}
          >
            ← Back to Templates
          </Link>
          <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.04em", textTransform: "uppercase", color: "var(--dv-black)", lineHeight: 1 }}>
            Apply Template
          </h1>
          <p style={{ margin: "0.625rem 0 0", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.5 }}>
            Choose which card to apply this template to, or create a new card.
          </p>
        </div>
      </header>

      {/* Cards Grid */}
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          
          {/* CREATE NEW CARD OPTION */}
          {canCreateMore && (
            <Link
              href={`/dashboard/templates/select?template=${templateId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                background: "var(--dv-white)",
                border: "2px dashed var(--dv-border)",
                borderRadius: "12px",
                padding: "1.5rem",
                textDecoration: "none",
                transition: "all 0.2s",
                cursor: "pointer"
              }}
              className="card-option"
            >
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--dv-lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Plus style={{ width: "32px", height: "32px", color: "#000" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#000", marginBottom: "0.25rem" }}>
                  Create New Card
                </h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--dv-gray)" }}>
                  Start fresh with this template
                </p>
              </div>
              <ArrowRight style={{ width: "24px", height: "24px", color: "var(--dv-gray)", flexShrink: 0 }} />
            </Link>
          )}

          {/* EXISTING CARDS */}
          <div style={{ marginTop: "1rem" }}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--dv-gray)" }}>
              Apply to Existing Card
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/dashboard/templates/select?template=${templateId}&card=${card.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    background: "var(--dv-white)",
                    border: "1px solid var(--dv-border)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                  className="card-option"
                >
                  {/* Photo */}
                  {card.photo_url ? (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundImage: `url(${card.photo_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "2px solid var(--dv-border)",
                      flexShrink: 0
                    }} />
                  ) : (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "var(--dv-off-white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--dv-border)",
                      flexShrink: 0
                    }}>
                      <User style={{ width: "32px", height: "32px", color: "var(--dv-gray)" }} />
                    </div>
                  )}

                  {/* Card Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#000" }}>
                        {card.full_name}
                      </h3>
                      <span style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "999px",
                        background: card.status === "published" ? "#dcfce7" : "#fef3c7",
                        color: card.status === "published" ? "#166534" : "#92400e"
                      }}>
                        {card.status === "published" ? "Live" : "Draft"}
                      </span>
                    </div>
                    {card.designation && (
                      <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.875rem", color: "var(--dv-gray)" }}>
                        {card.designation}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--dv-gray-light)", fontFamily: "monospace" }}>
                      /{card.username}
                    </p>
                  </div>

                  <ArrowRight style={{ width: "24px", height: "24px", color: "var(--dv-gray)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .card-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          border-color: var(--dv-lime);
        }
      `}</style>
    </div>
  );
}
