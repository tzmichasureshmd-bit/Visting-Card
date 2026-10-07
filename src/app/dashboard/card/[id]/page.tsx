import { redirect } from "next/navigation";

/**
 * Legacy singular builder path.
 *
 * `createCardAction` used to redirect to `/dashboard/card/${cardId}`, and links
 * from that era are still in people's inboxes. The canonical route is now
 * `/dashboard/cards/[id]` (plural, matching `/dashboard` as a collection), so
 * this route exists only to forward.
 *
 * Redirect rather than render: keeping two live builder routes would mean two
 * URLs for the same page, which splits the analytics on any link shared from it.
 */
export default async function LegacyCardRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/cards/${id}`);
}