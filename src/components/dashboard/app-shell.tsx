"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CreditCard, Gift, HelpCircle, Home, LayoutTemplate, Menu, Plus, Settings, Wallet, X } from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard",             label: "Dashboard",  icon: Home,          exact: true },
    ],
  },
  {
    label: "My Cards",
    items: [
      { href: "/dashboard/cards",       label: "All Cards",  icon: CreditCard },
      { href: "/templates",             label: "Templates",  icon: LayoutTemplate },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/analytics",   label: "Overview",   icon: BarChart3 },
    ],
  },
  {
    label: "Referrals",
    items: [
      { href: "/dashboard/referrals",   label: "Referrals",  icon: Gift },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/dashboard/wallet",      label: "Wallet",     icon: Wallet },
      { href: "/dashboard/billing",     label: "Billing",    icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/settings",    label: "Settings",   icon: Settings },
      { href: "/dashboard/help",        label: "Help",       icon: HelpCircle },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard",             label: "Home",      icon: Home,      exact: true },
  { href: "/dashboard/cards",       label: "Cards",     icon: CreditCard },
  { href: "/dashboard/analytics",   label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings",    label: "Settings",  icon: Settings },
];

function useActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const active = useActive(item.href, item.exact);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`dv-nav-link${active ? " active" : ""}`}
    >
      <item.icon style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
      <span>{item.label}</span>
    </Link>
  );
}

function BottomNavItem({ item }: { item: NavItem }) {
  const active = useActive(item.href, item.exact);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        gap: "0.25rem", padding: "0.625rem 0.25rem", textDecoration: "none",
        fontSize: "0.625rem", fontWeight: 600,
        color: active ? "var(--dv-black)" : "var(--dv-gray-light)",
        background: active ? "var(--dv-lime)" : "transparent",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <item.icon style={{ width: "1.25rem", height: "1.25rem" }} />
      {item.label}
    </Link>
  );
}

function SidebarContent({
  user,
  planName,
  onClose,
}: {
  user: { email: string; name: string };
  planName: string;
  onClose?: () => void;
}) {
  return (
    <>
      <div style={{ padding: "1.375rem 1rem 0.875rem" }}>
        <BrandMark href="/dashboard" />
      </div>

      <nav
        aria-label="Main navigation"
        style={{ display: "flex", flexDirection: "column", gap: "0.125rem", padding: "0 0.75rem", flex: 1, overflowY: "auto" }}
      >
        {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>

      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid var(--dv-border)" }}>
        {/* User card */}
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.875rem 1rem",
            border: "1px solid var(--dv-border)",
            borderRadius: "var(--dv-r-md)",
            background: "var(--dv-off-white)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--dv-black)", letterSpacing: "-0.01em" }}>{user.name}</p>
          <p style={{ margin: "0.125rem 0 0.5rem", fontSize: "0.75rem", color: "var(--dv-gray)" }}>{user.email}</p>
          <span className="dv-badge dv-badge-lime">{planName}</span>
        </div>
        <Link
          href="/onboarding"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            background: "var(--dv-lime)", color: "var(--dv-black)",
            padding: "0.75rem", textDecoration: "none",
            fontSize: "0.9375rem", fontWeight: 700,
            borderRadius: "var(--dv-r-sm)", marginBottom: "0.75rem",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dv-lime-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--dv-lime)")}
        >
          <Plus style={{ width: "1rem", height: "1rem" }} />
          New Card
        </Link>
        <SignOutButton />
      </div>
    </>
  );
}

export function AppShell({
  children,
  user,
  planName,
  builderMode = false,
}: {
  children: React.ReactNode;
  user: { email: string; name: string };
  planName: string;
  builderMode?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--dv-off-white)" }}>

      {/* Desktop sidebar */}
      <aside className="dv-sidebar">
        <SidebarContent user={user} planName={planName} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            style={{
              position: "absolute", inset: "0 auto 0 0", width: "17rem",
              background: "var(--dv-white)", display: "flex", flexDirection: "column",
              boxShadow: "var(--dv-shadow-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1rem", borderBottom: "1px solid var(--dv-border)" }}>
              <BrandMark href="/dashboard" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", color: "var(--dv-gray)", borderRadius: "var(--dv-r-sm)" }}
              >
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
            <SidebarContent user={user} planName={planName} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Mobile top bar */}
        <header
          style={{
            position: "sticky", top: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1.25rem",
            background: "var(--dv-white)",
            borderBottom: "1px solid var(--dv-border)",
            boxShadow: "var(--dv-shadow-sm)",
          }}
          className="dv-mobile-header"
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", color: "var(--dv-black)", borderRadius: "var(--dv-r-sm)" }}
          >
            <Menu style={{ width: "1.375rem", height: "1.375rem" }} />
          </button>
          <BrandMark href="/dashboard" />
          <Link
            href="/onboarding"
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              background: "var(--dv-lime)", color: "var(--dv-black)",
              padding: "0.5rem 0.875rem", textDecoration: "none",
              fontSize: "0.875rem", fontWeight: 700, borderRadius: "var(--dv-r-sm)",
            }}
          >
            <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
            New
          </Link>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: builderMode ? 0 : "5rem", minHeight: 0, overflow: builderMode ? "hidden" : "visible" }}>{children}</main>

        {/* Mobile bottom nav */}
        <nav
          aria-label="Bottom navigation"
          className="dv-bottom-nav"
          style={{
            position: "fixed", inset: "auto 0 0", zIndex: 100,
            display: "flex", background: "var(--dv-white)",
            borderTop: "1px solid var(--dv-border)",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
          }}
        >
          {BOTTOM_NAV.map((item) => (
            <BottomNavItem key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dv-sidebar { display: flex !important; }
          .dv-mobile-header { display: none !important; }
          .dv-bottom-nav { display: none !important; }
          main { padding-bottom: 0 !important; }
        }
        @media (max-width: 1023px) {
          .dv-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
