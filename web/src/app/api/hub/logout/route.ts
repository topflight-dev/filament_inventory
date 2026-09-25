/**
 * api/hub/logout/route.ts — Admin Hub Server-Side Logout
 * ─────────────────────────────────────────────────────────────────────────────
 * Clears the httpOnly Hub session cookie, ending the server-verified session
 * (independent of any client-side sessionStorage cleanup, which callers may
 * still perform for display/query-scoping purposes).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextResponse } from 'next/server';
import { HUB_SESSION_COOKIE } from '@/lib/hub-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(HUB_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
