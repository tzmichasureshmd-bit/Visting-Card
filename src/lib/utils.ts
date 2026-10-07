import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an INR amount. Prices are stored in paise to avoid float drift. */
export function formatINR(paise: number, options?: { compact?: boolean }) {
  const rupees = paise / 100;
  if (options?.compact && rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(rupees % 100000 === 0 ? 0 : 1)}L`;
  }
  if (options?.compact && rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(rupees % 1000 === 0 ? 0 : 1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

/** Thousands-separated integer, used by every metric card. */
export function formatCount(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Compact relative time: "3m ago", "2h ago", "4d ago". */
export function timeAgo(iso: string | Date) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Normalise a phone number to bare digits (no +, spaces, dashes).
 * Returns null when the result is not a plausible 10-digit Indian number.
 *
 * Validation messages are surfaced verbatim in the UI, so wording here is
 * user-facing (section 64).
 */
export function normalizePhone(input: string): { digits: string } | { error: string } {
  const raw = input.trim();
  if (!raw) return { error: "Please enter a phone number." };

  // Drop a leading country code so "+91 98765 43210" and "09876543210" agree.
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  if (digits.length !== 10) {
    return { error: "Please enter a valid 10-digit phone number." };
  }
  // Indian mobile numbers start 6-9; landlines/others are rejected.
  if (!/^[6-9]/.test(digits)) {
    return { error: "Please enter a valid WhatsApp number." };
  }
  return { digits };
}

/** E.164 for tel: links — the only reliably clickable format. */
export function phoneHref(digits: string) {
  return `tel:+91${digits}`;
}

/** wa.me deep link with a pre-filled message (section 11 / 68). */
export function whatsappHref(digits: string, message?: string) {
  const base = `https://wa.me/91${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Usernames are the public URL segment, so the rules are intentionally tight:
 * lowercase, starts with a letter, no lookalike characters (0/o, 1/l).
 */
export const USERNAME_RULES = {
  min: 3,
  max: 30,
  pattern: /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
  reserved: new Set([
    "admin","api","app","assets","blog","card","cards","dashboard","docs","help",
    "home","images","login","logout","pricing","signup","static","support","team",
    "templates","terms","privacy","refund","reseller","resellers","settings",
    "analytics","leads","qr","search","user","users","about","contact","legal",
    "www","mail","ftp","new","edit","delete","cdn","js","css","img","_next",
    "account","billing","checkout","payment","payments","subscription","referral",
    "referrals","payout","payouts","onboarding","invite","share","u","r","s",
  ]),
} as const;

export function validateUsername(input: string): { value: string } | { error: string } {
  const value = input.trim().toLowerCase();
  if (!value) return { error: "Please choose a username." };
  if (value.length < USERNAME_RULES.min) {
    return { error: `Username must be at least ${USERNAME_RULES.min} characters.` };
  }
  if (value.length > USERNAME_RULES.max) {
    return { error: `Username must be ${USERNAME_RULES.max} characters or fewer.` };
  }
  if (!USERNAME_RULES.pattern.test(value)) {
    return {
      error:
        "Use lowercase letters, numbers and single hyphens. Must start with a letter.",
    };
  }
  if (USERNAME_RULES.reserved.has(value)) {
    return { error: "That username is reserved. Please choose another." };
  }
  return { value };
}

/** Build one or more alternative username suggestions when one is taken. */
export function suggestUsernames(taken: string, name: string): string[] {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      // Drop combining marks so "Sáí" -> "sai".
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-card";
  const stem = base.slice(0, USERNAME_RULES.max - 4);
  return [stem, `${stem}-card`, `${stem}-1`, `${stem}official`, `${stem}-in`]
    .filter((u) => u.length >= USERNAME_RULES.min && u.length <= USERNAME_RULES.max)
    .filter((u) => USERNAME_RULES.pattern.test(u) && !USERNAME_RULES.reserved.has(u));
}

/** Guard against `javascript:` and other active-content URL schemes. */
export function safeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/** Strip trailing slashes for canonical URL comparison. */
export function normalizeHostname(host: string) {
  return host.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

/** Percentage saved, guarding against a zero original price. */
export function discountPercent(original: number, sale: number) {
  if (original <= 0 || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

/** Turn a legacy YouTube/Vimeo page URL into an embeddable iframe src. */
export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
      if (parsed.pathname.startsWith("/shorts/")) {
        return `https://www.youtube-nocookie.com/embed/${parsed.pathname.split("/").pop()}`;
      }
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}