'use client';

/**
 * components/hub/QueueTable.tsx — Print Request Queue Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #queue-tab-pane: fetchQueue/renderQueue, inline edit
 * (editRow/saveRow/cancelEdit), cycleStatus, batch-delete checkbox selection,
 * auto-refresh toggle, and the Supabase Realtime postgres_changes INSERT
 * subscription (toast on new job). The Electron-only native Notification API
 * branch is intentionally dropped — this is a pure web target; Electron's
 * hub.html remains the desktop notification path, untouched.
 *
 * Visual palette: "Deep Oceanic Stealth" theme — arctic twilight blue canvas
 * (bg-slate-950), frosted navy slate panels (bg-slate-900/70,
 * border-slate-800/80, rounded-xl), vibrant cyan (sky-500) primary actions
 * with dark text for max contrast. Functional status colors unchanged:
 * amber (pending), sky (printing/in-progress), mint/emerald (completed).
 * Table headers shrunk to text-[11px] tracking-widest uppercase text-slate-500;
 * main row text text-sm font-medium text-slate-200; secondary row text
 * text-xs text-slate-400; row borders subtle border-slate-800/40.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  batchDeleteJobs,
  getQueueJobs,
  updateJobFields,
  updateJobStatus,
  type PrintJob,
  type QueueStatusFilter,
} from '@/lib/supabase/hub-queries';

type StatusKey = 'pending' | 'printing' | 'completed';

const NEXT_STATUS: Record<StatusKey, StatusKey> = {
  pending: 'printing',
  printing: 'completed',
  completed: 'pending',
};

const BADGE_CLASS: Record<StatusKey, string> = {
  pending: 'bg-amber-950 text-amber-400 border border-amber-800',
  printing: 'bg-sky-500/10 text-sky-400 border border-sky-500/40',
  completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40',
};

const ACTION_BTN: Record<StatusKey, { className: string; label: string }> = {
  pending: { className: 'bg-sky-500 text-slate-950 font-medium hover:bg-sky-600', label: '▶ Start Printing' },
  printing: { className: 'bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-600', label: '✅ Mark Complete' },
  completed: { className: 'bg-slate-900/70 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60', label: '🔄 Reset to Pending' },
};

function normalizeStatus(status: string | null): StatusKey {
  const s = (status || 'pending').toLowerCase();
  return (s === 'printing' || s === 'completed' ? s : 'pending') as StatusKey;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatSubmitDate(isoString: string | null) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export default function QueueTable({
  queueStatusFilter,
  showToast,
}: {
  queueStatusFilter: QueueStatusFilter;
  showToast: (msg: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const shopSlug = useMemo(
    () => (typeof window !== 'undefined' ? sessionStorage.getItem('c3dw_shop_slug') : null),
    []
  );

  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ requestor_name: string; project_name: string; color_preference: string }>({
    requestor_name: '',
    project_name: '',
    color_preference: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchQueue = useCallback(async () => {
    setRefreshing(true);
    setLoadError(false);
    try {
      const data = await getQueueJobs(supabase, shopSlug, queueStatusFilter);
      setJobs(data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Queue fetch failed:', err);
      setLoadError(true);
      showToast('❌ Could not load queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, shopSlug, queueStatusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // AUTO-REFRESH
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchQueue, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQueue]);

  // REALTIME SUBSCRIPTION — INSERT events on print_jobs
  const fetchQueueRef = useRef(fetchQueue);
  fetchQueueRef.current = fetchQueue;

  useEffect(() => {
    const channel = supabase
      .channel('print_jobs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'print_jobs' },
        () => {
          fetchQueueRef.current();
          showToast('🔔 New print request received!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const pendingCount = jobs.filter((j) => normalizeStatus(j.status) === 'pending').length;

  function toggleCheckbox(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(jobs.map((j) => j.id)) : new Set());
  }

  const allChecked = jobs.length > 0 && selectedIds.size === jobs.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < jobs.length;

  async function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the ${ids.length} selected print job${ids.length > 1 ? 's' : ''}?`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await batchDeleteJobs(supabase, ids);
      showToast(`🗑️ Deleted ${ids.length} job${ids.length !== 1 ? 's' : ''}`);
      await fetchQueue();
    } catch (err) {
      console.error('Batch delete failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`❌ Delete failed: ${message}`);
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(job: PrintJob) {
    setEditingId(job.id);
    setEditFields({
      requestor_name: job.requestor_name || '',
      project_name: job.project_name || '',
      color_preference: job.color_preference || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    try {
      await updateJobFields(supabase, id, {
        requestor_name: editFields.requestor_name.trim(),
        project_name: editFields.project_name.trim(),
        color_preference: editFields.color_preference.trim(),
      });
      showToast('✅ Job updated successfully');
      setEditingId(null);
      await fetchQueue();
    } catch (err) {
      console.error('Save failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`❌ Save failed: ${message}`);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCycleStatus(job: PrintJob) {
    const current = normalizeStatus(job.status);
    const next = NEXT_STATUS[current];
    setUpdatingId(job.id);
    try {
      await updateJobStatus(supabase, job.id, capitalize(next));
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: capitalize(next) } : j)));
      showToast(`✅ Job → ${capitalize(next)}`);
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('❌ Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      {/* VIEW-INDICATOR TITLE — replaces the retired hover-dropdown labels */}
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-wide text-slate-200">
          {queueStatusFilter === 'completed' ? '📦 Completed Archive' : '📥 Active Queue'}
        </h1>
        <span className="text-xs text-slate-500">
          {queueStatusFilter === 'completed'
            ? '— finished / archived print jobs'
            : '— pending & in-progress incoming jobs'}
        </span>
      </div>

      {/* TOP CONTROL BAR */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2.5 rounded-lg border-2 border-amber-400 bg-amber-950 px-5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">⏳ Pending</span>
          <span className="min-w-[2ch] text-center text-xl font-bold text-amber-400">
            {loading ? '—' : pendingCount}
          </span>
        </div>


        <button
          onClick={fetchQueue}
          disabled={refreshing}
          className="rounded-[10px] bg-sky-500 px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {refreshing ? '⏳ Refreshing...' : '🔄 Manual Refresh'}
        </button>

        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className={`rounded-[10px] border-2 px-5 py-3 text-sm font-medium transition-colors ${
            autoRefresh
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'border-slate-800/80 bg-slate-900/70 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          {autoRefresh ? '🟢 Auto-Refresh: ON' : '⚫ Auto-Refresh: OFF'}
        </button>

        <button
          onClick={handleDeleteSelected}
          disabled={selectedIds.size === 0 || deleting}
          className="ml-auto rounded-[10px] border-2 border-red-500 bg-red-950 px-5 py-3 text-sm font-medium text-red-300 transition-colors hover:not-disabled:bg-red-900 hover:not-disabled:text-white disabled:border-slate-800/80 disabled:bg-slate-900/70 disabled:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {deleting ? '⏳ Deleting...' : '🗑️ Delete Selected'}
        </button>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/70">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b-2 border-slate-800/80 bg-slate-950">
            <tr>
              <th className="w-10 px-2.5 py-2 text-center">
                <input
                  type="checkbox"
                  title="Select all"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-sky-500"
                />
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Child Name</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Project</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Filament</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Status</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Action</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-slate-500">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-16 text-center text-slate-400">
                    <span className="mb-4 block text-5xl">⏳</span>
                    <p className="text-sm">Loading queue...</p>
                  </div>
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-16 text-center text-slate-400">
                    <span className="mb-4 block text-5xl">⚠️</span>
                    <p className="text-sm">Failed to load queue. Check your connection.</p>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-16 text-center text-slate-400">
                    <span className="mb-4 block text-5xl">✅</span>
                    <p className="text-sm">Queue is empty — all caught up!</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const statusKey = normalizeStatus(job.status);
                const isEditing = editingId === job.id;
                const isSelected = selectedIds.has(job.id);
                const rawProject = job.project_name || '—';
                const separatorIdx = rawProject.indexOf(' | 📝 ');
                const projectTitle = separatorIdx !== -1 ? rawProject.slice(0, separatorIdx) : rawProject;
                const projectNote = separatorIdx !== -1 ? rawProject.slice(separatorIdx + 6) : '';
                const stlUrl = (job.stl_url || '').trim();
                const submitDateStr = formatSubmitDate(job.created_at);
                const actionBtn = ACTION_BTN[statusKey];

                return (
                  <tr
                    key={job.id}
                    className={`border-b border-slate-800/40 transition-colors hover:bg-white/5 ${
                      isSelected ? 'bg-sky-500/10' : ''
                    }`}
                  >
                    <td className="px-2.5 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCheckbox(job.id)}
                        className="h-4 w-4 cursor-pointer accent-sky-500"
                      />
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.requestor_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, requestor_name: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-slate-800/80 bg-slate-950 px-2 py-1 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.project_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, project_name: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-slate-800/80 bg-slate-950 px-2 py-1 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.color_preference}
                            onChange={(e) => setEditFields((f) => ({ ...f, color_preference: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-slate-800/80 bg-slate-950 px-2 py-1 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-sm font-medium text-slate-200">{job.requestor_name || job.child_name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          <span className="text-sm font-medium text-slate-200">{projectTitle}</span>
                          {stlUrl && (
                            <>
                              <br />
                              <a
                                href={stlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                              >
                                🔗 View Model
                              </a>
                            </>
                          )}
                          {projectNote && (
                            <span className="mt-0.5 block text-xs italic text-slate-500">📝 {projectNote}</span>
                          )}
                          {submitDateStr && (
                            <span className="mt-0.5 block text-xs italic text-slate-500">🕐 {submitDateStr}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">{job.color_preference || job.filament || '—'}</td>
                      </>
                    )}

                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest ${BADGE_CLASS[statusKey]}`}>
                        {capitalize(statusKey)}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleCycleStatus(job)}
                        disabled={isEditing || updatingId === job.id}
                        className={`min-w-[140px] rounded-lg px-4 py-2 text-center text-sm font-medium shadow-md transition-colors disabled:!bg-slate-700 disabled:!text-slate-500 disabled:cursor-not-allowed disabled:shadow-none ${actionBtn.className}`}
                      >
                        {updatingId === job.id ? '⏳ Updating...' : actionBtn.label}
                      </button>
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => saveEdit(job.id)}
                            disabled={savingEdit}
                            className="min-w-[60px] rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:not-disabled:bg-emerald-500/20 hover:not-disabled:text-white"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="min-w-[60px] rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/40"
                          >
                            ✖ Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(job)}
                          className="min-w-[60px] rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20 hover:text-white"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-9 pb-5 text-center text-xs text-slate-500">
        C3DW Workshop &mdash; Print Queue Manager
      </div>
    </div>
  );
}
