import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CreditCard, Layers, LayoutTemplate, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/server";

function statusLabel(s: string) {
  if (s === "published") return "Live";
  if (s === "suspended") return "Suspended";
  return "Draft";
}

function planTone(slug: string): "brand" | "success" | "neutral" | "warning" {
  if (slug === "business" || slug === "enterprise") return "brand";
  if (slug === "professional" || slug === "starter") return "success";
  return "neutral";
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const metadata: Metadata = {
  title: "Admin — Platform",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: cardCount },
    { count: userCount },
    { count: themeCount },
    { count: leadCount },
    { count: liveCount },
  ] = await Promise.all([
    supabase.from("cards").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("themes").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("cards").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at, referral_code, subscriptions(status, price_paise, billing_period, current_period_end, plans(slug, name))")
    .order("created_at", { ascending: false });

  const { data: cards } = await supabase
    .from("cards")
    .select("id, full_name, username, status, created_at, user_id")
    .order("created_at", { ascending: false });

  const metrics = [
    { label: "Users",     value: userCount  ?? 0, icon: Users },
    { label: "Cards",     value: cardCount  ?? 0, icon: CreditCard },
    { label: "Live",      value: liveCount  ?? 0, icon: TrendingUp },
    { label: "Leads",     value: leadCount  ?? 0, icon: Layers },
    { label: "Themes",    value: themeCount ?? 0, icon: LayoutTemplate },
    { label: "Analytics", value: "—",             icon: BarChart3 },
  ];

  const th: React.CSSProperties = {
    padding: "0.625rem 1rem", fontSize: "0.6875rem", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dv-gray-light)",
    textAlign: "left", borderBottom: "1px solid var(--dv-border)", whiteSpace: "nowrap",
    background: "var(--dv-off-white)",
  };
  const td: React.CSSProperties = {
    padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--dv-black)",
    borderBottom: "1px solid var(--dv-border)", verticalAlign: "middle",
  };
  const tdg: React.CSSProperties = { ...td, color: "var(--dv-gray)" };

  return (
    <div style={{ padding: "1.5rem" }}>

      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--dv-black)" }}>
            <span style={{ background: "var(--dv-lime)", padding: "0.125rem 0.5rem", borderRadius: "0.375rem", marginRight: "0.5rem" }}>ADMIN</span>
            Platform Overview
          </h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--dv-gray)" }}>All users, cards and platform data</p>
        </div>
        <Link href="/dashboard" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--dv-gray)", textDecoration: "none" }}>
          ← Dashboard
        </Link>
      </div>

      {/* Metrics */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.75rem" }}>
        {metrics.map(({ label, value, icon: Icon }) => (
          <li key={label} style={{ background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-md)", padding: "1rem 1.25rem" }}>
            <Icon style={{ width: "1rem", height: "1rem", color: "var(--dv-gray-light)" }} aria-hidden />
            <p style={{ margin: "0.5rem 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--dv-black)", letterSpacing: "-0.04em" }}>{value}</p>
            <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--dv-gray)" }}>{label}</p>
          </li>
        ))}
      </ul>

      {/* Users table */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 0.875rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--dv-black)" }}>
          All Users{" "}
          <span style={{ fontWeight: 400, color: "var(--dv-gray)", fontSize: "0.8125rem" }}>({users?.length ?? 0})</span>
        </h2>
        <div style={{ background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-md)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Plan</th>
                  <th style={th}>Sub Status</th>
                  <th style={th}>Price</th>
                  <th style={th}>Renews</th>
                  <th style={th}>Role</th>
                  <th style={th}>Joined</th>
                  <th style={th}>Referral Code</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => {
                  const subs = u.subscriptions as Array<{ status?: string; price_paise?: number; billing_period?: string; current_period_end?: string; plans?: { slug?: string; name?: string } | null }> | null;
                  const sub = Array.isArray(subs) ? subs[0] : null;
                  const plan = sub?.plans as { slug?: string; name?: string } | null;
                  const planSlug = plan?.slug ?? "free";
                  const planName = plan?.name ?? "Free";
                  const subStatus = sub?.status ?? "—";
                  const price = sub?.price_paise ? `\u20b9${(sub.price_paise / 100).toLocaleString("en-IN")}` : "Free";
                  return (
                    <tr key={String(u.id)}>
                      <td style={{ ...td, fontWeight: 600 }}>{String(u.full_name ?? "—")}</td>
                      <td style={tdg}>{String(u.email ?? "—")}</td>
                      <td style={td}><Badge tone={planTone(planSlug)}>{planName}</Badge></td>
                      <td style={td}>
                        <Badge tone={subStatus === "active" ? "success" : subStatus === "grace" ? "warning" : "neutral"}>
                          {subStatus}
                        </Badge>
                      </td>
                      <td style={tdg}>{price}</td>
                      <td style={tdg}>{fmt(sub?.current_period_end ?? null)}</td>
                      <td style={td}>
                        {u.role === "admin"
                          ? <Badge tone="brand">Admin</Badge>
                          : <span style={{ fontSize: "0.75rem", color: "var(--dv-gray-light)" }}>user</span>}
                      </td>
                      <td style={tdg}>{fmt(u.created_at ?? null)}</td>
                      <td style={{ ...tdg, fontFamily: "monospace", fontSize: "0.75rem" }}>{String(u.referral_code ?? "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cards table */}
      <section>
        <h2 style={{ margin: "0 0 0.875rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--dv-black)" }}>
          All Cards{" "}
          <span style={{ fontWeight: 400, color: "var(--dv-gray)", fontSize: "0.8125rem" }}>({cards?.length ?? 0})</span>
        </h2>
        <div style={{ background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-md)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Card Name</th>
                  <th style={th}>URL</th>
                  <th style={th}>Status</th>
                  <th style={th}>Created</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(cards ?? []).map((c) => (
                  <tr key={String(c.id)}>
                    <td style={{ ...td, fontWeight: 600 }}>{String(c.full_name ?? "Unnamed")}</td>
                    <td style={tdg}>
                      <a href={`/card/${c.username}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--dv-gray)", textDecoration: "underline", textUnderlineOffset: "2px", fontFamily: "monospace", fontSize: "0.75rem" }}>
                        /card/{String(c.username ?? "—")}
                      </a>
                    </td>
                    <td style={td}>
                      <Badge tone={c.status === "published" ? "success" : c.status === "suspended" ? "danger" : "neutral"}>
                        {statusLabel(String(c.status))}
                      </Badge>
                    </td>
                    <td style={tdg}>{fmt(c.created_at ?? null)}</td>
                    <td style={td}>
                      <Link href={`/builder/${String(c.id)}`}
                        style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--dv-black)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) { .admin-metrics { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 640px)  { .admin-metrics { grid-template-columns: repeat(2, 1fr) !important; } }
        tbody tr:hover td { background: var(--dv-off-white); }
      `}</style>
    </div>
  );
}
