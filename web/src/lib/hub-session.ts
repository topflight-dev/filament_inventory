/**
 * lib/hub-session.ts — Admin Hub Server-Side Session Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Signs and verifies the JWT that backs the Admin Hub's server-verified
 * session cookie, replacing the old client-side-only sessionStorage gate.
 * Uses `jose` (HS256) with a key derived from the server-only
 * HUB_SESSION_SECRET env var. Tokens are opaque to the browser beyond their
 * cookie name — payload contains only shop_slug/shop_name, no secrets.
 *
 * This module is safe to import from Route Handlers only (it is not marked
 * 'use client' and reads process.env directly).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { NextRequest } from 'next/server';

export const HUB_SESSION_COOKIE = 'c3dw_hub_session';

const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

export type HubSessionPayload = {
  shop_slug: string;
  shop_name: string | null;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.HUB_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'HUB_SESSION_SECRET is not set — cannot create or verify Hub session tokens.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createHubSessionToken(payload: HubSessionPayload): Promise<string> {
  const key = getSecretKey();

  return new SignJWT({ shop_slug: payload.shop_slug, shop_name: payload.shop_name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifyHubSessionToken(
  token: string
): Promise<(HubSessionPayload & JWTPayload) | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);

    if (typeof payload.shop_slug !== 'string') return null;

    return payload as HubSessionPayload & JWTPayload;
  } catch {
    return null;
  }
}

export async function getHubSessionFromRequest(
  request: NextRequest
): Promise<(HubSessionPayload & JWTPayload) | null> {
  const token = request.cookies.get(HUB_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyHubSessionToken(token);
}
