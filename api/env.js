/**
 * api/env.js — Vercel Serverless Config Endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * Safely exposes non-sensitive runtime configuration to the frontend by reading
 * secrets from Vercel Environment Variables (set in the Vercel Dashboard).
 *
 * NEVER hardcode secrets here. Add them in:
 *   Vercel Dashboard → Project → Settings → Environment Variables
 *     • DISCORD_WEBHOOK_URL  — Discord webhook URL for print request alerts
 *     • ADMIN_KEY            — Admin authentication key for hub access
 *
 * This endpoint is called once on page load by web/PWA targets.
 * Electron desktop targets bypass this entirely — secrets are injected
 * directly into the window context by main.cjs via executeJavaScript().
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Read secrets from Vercel environment — these are NEVER committed to git
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || null;
    const adminKey          = process.env.ADMIN_KEY          || null;

    // Return the config payload
    // Note: ADMIN_KEY is returned here because it is used as a client-side
    // session authentication token (not a server-side secret). It is validated
    // against the same value on the Render backend. RLS on Supabase provides
    // the true data security layer.
    res.status(200).json({
        DISCORD_WEBHOOK_URL: discordWebhookUrl,
        ADMIN_KEY:           adminKey
    });
}
