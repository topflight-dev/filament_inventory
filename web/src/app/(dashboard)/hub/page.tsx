'use client';

/**
 * Hub ("/hub") — Admin Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Full 1:1 decomposition of legacy hub.html (2,689 lines) into
 * AuthGate + HubShell + QueueTable + InventoryManager components.
 * Auth uses the legacy sessionStorage + shops-table passcode gate
 * (Option A — real Supabase Auth/RLS deferred to a future session).
 * Legacy source: hub.html / src/pages/admin/hub.html (untouched).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import AuthGate from '@/components/hub/AuthGate';
import HubShell from '@/components/hub/HubShell';
import QueueTable from '@/components/hub/QueueTable';
import InventoryManager from '@/components/hub/InventoryManager';
import { useHubToast, HubToast } from '@/hooks/useHubToast';

export default function HubPage() {
  const { message, visible, showToast } = useHubToast();
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    setShopName(sessionStorage.getItem('c3dw_shop_name'));
  }, []);

  return (
    <AuthGate>
      <HubShell shopName={shopName}>
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
    </AuthGate>
  );
}
