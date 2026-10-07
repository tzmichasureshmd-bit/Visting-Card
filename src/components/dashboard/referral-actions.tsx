"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { WhatsappIcon } from "@/components/card/actions";

export function ReferralCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast({ variant: "error", title: "Could not copy link." });
        }
      }}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function ReferralWhatsAppButton({ url }: { url: string }) {
  const text = encodeURIComponent(
    `Join me on DV Card and create your own digital visiting card:\n${url}`,
  );
  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25d366] px-3 text-[13px] font-medium text-white transition-[filter] hover:brightness-110"
    >
      <WhatsappIcon className="size-4" />
      Share
    </a>
  );
}
