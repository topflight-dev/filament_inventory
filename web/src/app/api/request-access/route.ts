/**
 * api/request-access/route.ts — Printcue "Request Access" Intake
 * ─────────────────────────────────────────────────────────────────────────────
 * Backs the request-access form on the printcue.ink landing page
 * (app/(dashboard)/welcome/page.tsx, via components/printcue/RequestAccessForm.tsx).
 * Piece #5 of the Printcue test-release plan (see
 * claude/printcue-test-release-plan.md in the Claude Project): this
 * intentionally creates nothing in the database — no `shops` row, no new
 * table — it only notifies Luis so he can decide who to invite, then hand
 * out a code via the invite-gated sign-up flow (piece #1, already shipped).
 *
 * Notifications reuse the SAME per-shop channels Luis already configured for
 * his own shop's print-request alerts (getShopNotificationSettings / the
 * Hub's Notification Settings modal) — there's no separate "Printcue admin
 * inbox" to set up. This route always targets Luis's OWN shop
 * (OWNER_SHOP_SLUG below); that slug is never caller-supplied, since the
 * whole point of this endpoint is "notify me," not "notify some shop."
 *
 * Fire-and-forget from the client's point of view, same pattern as
 * notify-request: a failure to actually deliver the notification is logged,
 * never surfaced as an error to the person filling out the form (they
 * already did their part; a Resend/Discord hiccup on Luis's end isn't their
 * problem). The one exception is basic input validation, which does fail
 * loudly — a garbage submission isn't worth silently accepting.
 *
 * Note: because this creates no database row, a request is only ever as
 * durable as its notification. If neither channel is configured on the
 * owner shop, the request is effectively lost (logged server-side only) —
 * worth confirming crafted3d has at least one channel set up before relying
 * on this in production.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/service';
import { getShopNotificationSettings } from '@/lib/supabase/hub-queries';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sending address on the DNS-verified subdomain (mail.crafted3dworkshop.com) —
// same sender identity as notify-request/route.ts.
const FROM_ADDRESS = 'Printcue Alerts <alerts@mail.crafted3dworkshop.com>';

// Luis's own shop — this route always notifies HIM, regardless of who's
// asking for access, so this is a constant, never client-supplied.
const OWNER_SHOP_SLUG = 'crafted3d';

const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 320;
const MAX_DETAILS_LENGTH = 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; whatYouPrint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const whatYouPrint = typeof body.whatYouPrint === 'string' ? body.whatYouPrint.trim() : '';

  if (!name || !email || !whatYouPrint) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
  }
  if (
    name.length > MAX_NAME_LENGTH ||
    email.length > MAX_EMAIL_LENGTH ||
    whatYouPrint.length > MAX_DETAILS_LENGTH
  ) {
    return NextResponse.json({ error: 'One or more fields is too long' }, { status: 400 });
  }

  const supabase = createServiceClient();

  let settings;
  try {
    settings = await getShopNotificationSettings(supabase, OWNER_SHOP_SLUG);
  } catch (err) {
    console.warn('[Printcue] request-access: settings lookup failed (non-critical):', err);
    return NextResponse.json({ ok: true });
  }

  if (!settings || (!settings.notification_email && !settings.discord_webhook_url)) {
    console.warn(
      '[Printcue] request-access: no notification channel configured for the owner shop — this request was NOT delivered anywhere:',
      { name, email }
    );
    return NextResponse.json({ ok: true });
  }

  if (settings.notification_email) {
    if (!resend) {
      console.warn('[Printcue] request-access: RESEND_API_KEY not configured — email skipped.');
    } else {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: settings.notification_email,
          subject: `🎟️ New Printcue Access Request — ${name}`,
          html: `
            <h2>New Access Request</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>What they print:</strong> ${escapeHtml(whatYouPrint)}</p>
            <p>Reply directly to this address if you'd like to send them an invite code.</p>
          `,
        });
      } catch (err) {
        console.warn('[Printcue] request-access: email send failed (non-critical):', err);
      }
    }
  }

  if (settings.discord_webhook_url) {
    try {
      const discordRes = await fetch(settings.discord_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🎟️ New Printcue Access Request',
              color: 0x4f46e5,
              fields: [
                { name: '👤 Name', value: String(name), inline: true },
                { name: '✉️ Email', value: String(email), inline: true },
                { name: '🖨️ What they print', value: String(whatYouPrint), inline: false },
              ],
              footer: { text: 'Printcue — Access Request' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!discordRes.ok) {
        const text = await discordRes.text();
        console.warn(
          '[Printcue] request-access: Discord webhook responded with an error:',
          discordRes.status,
          text
        );
      }
    } catch (err) {
      console.warn('[Printcue] request-access: Discord notification failed (non-critical):', err);
    }
  }

  return NextResponse.json({ ok: true });
}
