/**
 * api/notify-request/route.ts — Secure Per-Shop Print-Job Notifications
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the single-tenant /api/notify-discord route, which read one
 * hardcoded DISCORD_WEBHOOK_URL env var and alerted only Luis's own Discord
 * for every shop. Part of the multi-tenant notifications redesign — see
 * claude/notifications-redesign-plan.md in the Claude Project.
 *
 * Takes { shopSlug, projectName, requestorName, colorPreference } from the
 * public /request page (fire-and-forget, same calling convention as before).
 * Looks up THAT shop's notification_email / discord_webhook_url via the
 * service-role client — NEVER trusts an email address or webhook URL
 * supplied by the caller, since this is an unauthenticated public endpoint.
 * Sends whichever channel(s) that shop has configured; sends neither if the
 * shop has set up neither (silent no-op). A notification failure — missing
 * config, a bad webhook, Resend being down — must never block or fail a
 * customer's print-request submission, so every failure path here logs a
 * warning and still returns 200.
 *
 * UPDATED 2026-09-26 (domain-split prep): the "View Dashboard" link in both
 * the email and Discord embed used to hardcode
 * `https://www.crafted3dworkshop.com/hub` — wrong for any shop but Luis's own
 * (every shop's notification pointed at Luis's Hub), and it would have needed
 * a code change the moment the Hub moved to its own domain. It now reads
 * HUB_DASHBOARD_URL, which is correct for every shop (the link is just
 * "wherever /hub lives" — /hub itself resolves the right shop from the
 * viewer's own session after they log in, so one shared URL is right for
 * everyone). Falls back to the current live URL if the env var isn't set yet,
 * so this ships with zero behavior change until Luis adds the var.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/service';
import { getShopNotificationSettings } from '@/lib/supabase/hub-queries';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sending address on the DNS-verified subdomain (mail.crafted3dworkshop.com).
// Swap the display name / local part freely — the domain is what's verified.
const FROM_ADDRESS = 'Crafted 3D Workshop <alerts@mail.crafted3dworkshop.com>';

// Where /hub actually lives today. See the header comment above — update via
// the HUB_DASHBOARD_URL env var (no code change) once the dashboard moves to
// its own domain/subdomain.
const HUB_DASHBOARD_URL = (
  process.env.HUB_DASHBOARD_URL ?? 'https://www.crafted3dworkshop.com'
).replace(/\/+$/, '');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  let body: {
    shopSlug?: unknown;
    projectName?: unknown;
    requestorName?: unknown;
    colorPreference?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_body' }, { status: 400 });
  }

  const { shopSlug, projectName, requestorName, colorPreference } = body;

  if (
    typeof shopSlug !== 'string' ||
    !shopSlug ||
    typeof projectName !== 'string' ||
    typeof requestorName !== 'string' ||
    typeof colorPreference !== 'string'
  ) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 });
  }

  const supabase = createServiceClient();

  let settings;
  try {
    settings = await getShopNotificationSettings(supabase, shopSlug);
  } catch (err) {
    console.warn('[C3DW] notify-request: settings lookup failed (non-critical):', err);
    return NextResponse.json({ ok: false, reason: 'lookup_failed' }, { status: 200 });
  }

  if (!settings || (!settings.notification_email && !settings.discord_webhook_url)) {
    // Shop has configured no notification channel — silent no-op, not an error.
    return NextResponse.json({ ok: true, sent: [] });
  }

  const sent: string[] = [];

  if (settings.notification_email) {
    if (!resend) {
      console.warn('[C3DW] notify-request: RESEND_API_KEY not configured — email skipped.');
    } else {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: settings.notification_email,
          subject: `🖨️ New Print Request — ${projectName}`,
          html: `
            <h2>New Print Request Received!</h2>
            <p><strong>Project:</strong> ${escapeHtml(projectName)}</p>
            <p><strong>Requester:</strong> ${escapeHtml(requestorName)}</p>
            <p><strong>Filament:</strong> ${escapeHtml(colorPreference)}</p>
            <p><a href="${HUB_DASHBOARD_URL}/hub">View Dashboard</a></p>
          `,
        });
        sent.push('email');
      } catch (err) {
        console.warn('[C3DW] notify-request: email send failed (non-critical):', err);
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
              title: '🖨️ New Print Request Received!',
              color: 0x28a745,
              fields: [
                { name: '📋 Project', value: String(projectName), inline: true },
                { name: '👤 Requester', value: String(requestorName), inline: true },
                { name: '🎨 Filament', value: String(colorPreference), inline: false },
              ],
              description: `[🔗 View Dashboard](${HUB_DASHBOARD_URL}/hub)`,
              footer: { text: 'C3DW Print Queue — Real-Time Alert' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (discordRes.ok) {
        sent.push('discord');
      } else {
        const text = await discordRes.text();
        console.warn(
          '[C3DW] notify-request: Discord webhook responded with an error:',
          discordRes.status,
          text
        );
      }
    } catch (err) {
      console.warn('[C3DW] notify-request: Discord notification failed (non-critical):', err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
