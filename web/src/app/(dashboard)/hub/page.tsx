/**
 * Hub ("/hub") — Admin dashboard placeholder stub.
 * Full decomposition (QueueTable, InventoryManager, AuthGate components,
 * Supabase Auth + RLS-based multi-tenant login) deferred to a dedicated
 * session per Phase 2 scope decision — this is the most complex legacy
 * file (2,689 lines) and warrants focused treatment.
 * Legacy source: hub.html / src/pages/admin/hub.html.
 */
export default function HubPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🖨️ C3DW Admin Hub</h1>
        <p className="mt-2 text-zinc-400">
          Dashboard migration coming in a dedicated session.
        </p>
      </div>
    </div>
  );
}
