/**
 * api/hub/notification-settings/route.ts — Admin Hub Notification Settings
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets an already-authenticated shop view and update its own print-request
 * notification channels (notification_email / discord_webhook_url on the
 * shops table). shop_slug is always derived from the verified Hub session
 * cookie (getHubSessionFromRequest) — never from the request body — so a
 * caller can never read or write another shop's settings.
 *
 * GET returns the current settings (used to prefill the Hub's
 * NotificationSettingsModal on open).
 *
 * PATCH accepts { notificationEmail, discordWebhookUrl } — either field may
 * be an empty string to explicitly clear that channel, or omitted entirely
 * to leave it unchanged. Light format validation only (a real email shape /
 * an https URL) — no attempt to verify the address or webhook actually
 * work, same "trust it, fire-and-forget" philosophy as /api/notify-request
 * itself, which is what actually uses these values.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import {
  getShopNotificationSettings,
  updateShopNotificationSettings,
} from '@/lib/supabase/hub-queries';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const settings = await getShopNotificationSettings(supabase, session.shop_slug);
    return NextResponse.json({
      notificationEmail: settings?.notification_email ?? null,
      discordWebhookUrl: settings?.discord_webhook_url ?? null,
    });
  } catch (err) {
    console.error('[C3DW Hub Notification Settings] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load notification settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { notificationEmail?: unknown; discordWebhookUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const fields: Partial<{ notification_email: string | null; discord_webhook_url: string | null }> = {};

  if (typeof body.notificationEmail === 'string') {
    const trimmed = body.notificationEmail.trim();
    if (trimmed === '') {
      fields.notification_email = null;
    } else if (!EMAIL_PATTERN.test(trimmed)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    } else {
      fields.notification_email = trimmed;
    }
  }

  if (typeof body.discordWebhookUrl === 'string') {
    const trimmed = body.discordWebhookUrl.trim();
    if (trimmed === '') {
      fields.discord_webhook_url = null;
    } else if (!/^https:\/\/.+/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Discord webhook URL must start with https://' },
        { status: 400 }
      );
    } else {
      fields.discord_webhook_url = trimmed;
    }
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    await updateShopNotificationSettings(supabase, session.shop_slug, fields);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[C3DW Hub Notification Settings] PATCH failed:', err);
    return NextResponse.json({ error: 'Failed to save notification settings' }, { status: 500 });
  }
}
