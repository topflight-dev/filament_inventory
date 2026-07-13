/**
 * api/notify-discord/route.ts — Secure Print-Job Discord Notification
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the legacy client-side `window.DISCORD_WEBHOOK_URL` fetch in
 * request.html, which exposed the Discord webhook URL directly to the
 * browser (flagged in Project_Log.md Phase 1 "Flagged Findings" #1 alongside
 * the retired /api/env leak). The webhook URL now lives exclusively as a
 * server-only env var (`DISCORD_WEBHOOK_URL`, no NEXT_PUBLIC_ prefix) and is
 * only ever read inside this Route Handler.
 *
 * The Request page Client Component POSTs the already-validated job summary
 * fields here (fire-and-forget from the caller's perspective) and this
 * handler performs the actual Discord embed POST server-side.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[C3DW] DISCORD_WEBHOOK_URL not configured — notification skipped.');
    // Non-critical — don't fail the caller's request flow over a missing webhook.
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 200 });
  }

  try {
    const { projectName, requestorName, colorPreference } = await request.json();

    if (!projectName || !requestorName || !colorPreference) {
      return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 });
    }

    const discordRes = await fetch(webhookUrl, {
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
            description: '[🔗 View Dashboard](https://www.crafted3dworkshop.com/hub)',
            footer: { text: 'C3DW Print Queue — Real-Time Alert' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      console.warn('[C3DW] Discord webhook responded with an error:', discordRes.status, text);
      return NextResponse.json({ ok: false, reason: 'discord_error' }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[C3DW] Discord notification failed (non-critical):', err);
    return NextResponse.json({ ok: false, reason: 'exception' }, { status: 200 });
  }
}
