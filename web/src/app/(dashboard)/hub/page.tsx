'use client';

/**
 * Hub ("/hub") — Admin Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Full 1:1 decomposition of legacy hub.html (2,689 lines) into
 * AuthGate + HubShell + QueueTable + InventoryManager components.
 * Auth uses the legacy sessionStorage + shops-table passcode gate
 * (Option A — real Supabase Auth/RLS deferred to a future session).
 * Legacy source: hub.html / src/pages/admin/hub.html (untouched).
 *
 * UPDATED 2026-09-26 (shop-name onboarding pass): shopName used to come
 * straight from sessionStorage, which AuthGate only ever writes at login —
 * so a shop with no shop_name yet (previously only ever set by hand in
 * Supabase) just silently never showed one, with no way to fix it from the
 * Hub itself. This now fetches /api/hub/session directly on mount (the
 * authoritative source — AuthGate has already confirmed the session is
 * valid by the time this renders) and, if it comes back with no shop_name,
 * opens ShopNameModal in its mandatory mode: a one-time "what's your shop
 * called?" prompt that blocks the dashboard until answered. The same modal
 * is reused, non-mandatory, for the "Shop Name" button HubShell's sidebar
 * footer now has, so a shop can change its name anytime afterward too.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import AuthGate from '@/components/hub/AuthGate';
import HubShell from '@/components/hub/HubShell';
import QueueTable from '@/components/hub/QueueTable';
import InventoryManager from '@/components/hub/InventoryManager';
import ShopNameModal from '@/components/hub/ShopNameModal';
import { useHubToast, HubToast } from '@/hooks/useHubToast';

export default function HubPage() {
  const { message, visible, showToast } = useHubToast();
  const [shopName, setShopName] = useState<string | null>(null);
  const [showShopNameModal, setShowShopNameModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch('/api/hub/session');
        const data = await res.json().catch(() => ({}));
        if (cancelled || !data?.authenticated) return;

        const name: string | null = data.shop_name || null;
        setShopName(name);

        if (name) {
          sessionStorage.setItem('c3dw_shop_name', name);
        } else {
          // First login for this shop (or a shop created without a name) —
          // block on the mandatory prompt instead of showing a blank label.
          setShowShopNameModal(true);
        }
      } catch (err) {
        console.warn('[C3DW] Session load for shop name failed (non-critical):', err);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthGate>
      <HubShell shopName={shopName} onEditShopName={() => setShowShopNameModal(true)}>
        {(activeTab, queueStatusFilter) => (
          <>
            {activeTab === 'queue' && (
              <QueueTable queueStatusFilter={queueStatusFilter} showToast={showToast} />
            )}
            {activeTab === 'inventory' && <InventoryManager showToast={showToast} />}
          </>
        )}
      </HubShell>
      <HubToast message={message} visible={visible} />
      <ShopNameModal
        open={showShopNameModal}
        mandatory={!shopName}
        onClose={() => setShowShopNameModal(false)}
        onSaved={(name) => {
          setShopName(name);
          setShowShopNameModal(false);
          sessionStorage.setItem('c3dw_shop_name', name);
        }}
      />
    </AuthGate>
  );
}
