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
 * UPDATED 2026-09-26 (icon pass): emoji icons replaced with lucide-react
 * icons throughout — real spinners (Loader2 + animate-spin) on every
 * "in-flight" state.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): retired the dark "Deep
 * Oceanic Stealth" theme for the neutral light SaaS theme shared across
 * every Hub/Request file — see HubShell.tsx's header comment for the full
 * reasoning. Status colors kept functionally distinct but re-tuned for a
 * light background: amber (pending), indigo (printing/in-progress — ties to
 * the one brand accent), emerald (completed), red (destructive).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  Link2,
  Loader2,
  Package,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  StickyNote,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type PrintJob, type QueueStatusFilter } from '@/lib/supabase/hub-queries';

type StatusKey = 'pending' | 'printing' | 'completed';

const NEXT_STATUS: Record<StatusKey, StatusKey> = {
  pending: 'printing',
  printing: 'completed',
  completed: 'pending',
};

const BADGE_CLASS: Record<StatusKey, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  printing: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const ACTION_BTN: Record<StatusKey, { className: string; label: string; icon: LucideIcon }> = {
  pending: { className: 'bg-indigo-600 text-white font-medium hover:bg-indigo-700', label: 'Start Printing', icon: Play },
  printing: { className: 'bg-emerald-600 text-white font-medium hover:bg-emerald-700', label: 'Mark Complete', icon: CheckCircle2 },
  completed: { className: 'bg-white text-zinc-600 border border-zinc-300 hover:bg-zinc-50', label: 'Reset to Pending', icon: RotateCcw },
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
      const res = await fetch(`/api/hub/queue?filter=${queueStatusFilter}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = (await res.json()) as PrintJob[];
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
  }, [queueStatusFilter]);

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
      const res = await fetch('/api/hub/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
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
      const res = await fetch(`/api/hub/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestor_name: editFields.requestor_name.trim(),
          project_name: editFields.project_name.trim(),
          color_preference: editFields.color_preference.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
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
      const res = await fetch(`/api/hub/queue/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: capitalize(next) }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
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
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-wide text-zinc-900">
          {queueStatusFilter === 'completed' ? (
            <Package className="h-5 w-5 text-zinc-400" />
          ) : (
            <Inbox className="h-5 w-5 text-zinc-400" />
          )}
          {queueStatusFilter === 'completed' ? 'Completed Archive' : 'Active Queue'}
        </h1>
        <span className="text-xs text-zinc-400">
          {queueStatusFilter === 'completed'
            ? '— finished / archived print jobs'
            : '— pending & in-progress incoming jobs'}
        </span>
      </div>

      {/* TOP CONTROL BAR */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-5 py-2.5">
          <Clock className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</span>
          <span className="min-w-[2ch] text-center text-xl font-bold text-amber-700">
            {loading ? '—' : pendingCount}
          </span>
        </div>

        <button
          onClick={fetchQueue}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-[10px] bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:not-disabled:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshing ? 'Refreshing...' : 'Manual Refresh'}
        </button>

        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className={`flex items-center gap-2 rounded-[10px] border px-5 py-3 text-sm font-medium transition-colors ${
            autoRefresh
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-50'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
          {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
        </button>

        <button
          onClick={handleDeleteSelected}
          disabled={selectedIds.size === 0 || deleting}
          className="ml-auto flex items-center gap-2 rounded-[10px] border border-red-300 bg-white px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:not-disabled:bg-red-50 disabled:border-zinc-200 disabled:text-zinc-300 disabled:cursor-not-allowed"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {deleting ? 'Deleting...' : 'Delete Selected'}
        </button>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
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
                  className="h-4 w-4 cursor-pointer accent-indigo-600"
                />
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Child Name</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Project</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Filament</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Status</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Action</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold tracking-widest uppercase text-zinc-400">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
                    <Loader2 className="h-9 w-9 animate-spin text-zinc-300" />
                    <p className="text-sm">Loading queue...</p>
                  </div>
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
                    <AlertTriangle className="h-9 w-9 text-amber-500" />
                    <p className="text-sm">Failed to load queue. Check your connection.</p>
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
                    <CheckCircle2 className="h-9 w-9 text-emerald-500" />
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
                const ActionIcon = actionBtn.icon;

                return (
                  <tr
                    key={job.id}
                    className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${
                      isSelected ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <td className="px-2.5 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCheckbox(job.id)}
                        className="h-4 w-4 cursor-pointer accent-indigo-600"
                      />
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.requestor_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, requestor_name: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.project_name}
                            onChange={(e) => setEditFields((f) => ({ ...f, project_name: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={editFields.color_preference}
                            onChange={(e) => setEditFields((f) => ({ ...f, color_preference: e.target.value }))}
                            className="w-full min-w-[80px] rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-sm font-medium text-zinc-900">{job.requestor_name || job.child_name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          <span className="text-sm font-medium text-zinc-900">{projectTitle}</span>
                          {stlUrl && (
                            <>
                              <br />
                              <a
                                href={stlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                              >
                                <Link2 className="h-3 w-3" />
                                View Model
                              </a>
                            </>
                          )}
                          {projectNote && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs italic text-zinc-400">
                              <StickyNote className="h-3 w-3 flex-shrink-0" />
                              {projectNote}
                            </span>
                          )}
                          {submitDateStr && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs italic text-zinc-400">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              {submitDateStr}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500">{job.color_preference || job.filament || '—'}</td>
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
                        className={`flex min-w-[150px] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors disabled:!bg-zinc-100 disabled:!text-zinc-400 disabled:cursor-not-allowed ${actionBtn.className}`}
                      >
                        {updatingId === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ActionIcon className="h-3.5 w-3.5" />
                        )}
                        {updatingId === job.id ? 'Updating...' : actionBtn.label}
                      </button>
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => saveEdit(job.id)}
                            disabled={savingEdit}
                            className="flex min-w-[60px] items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:not-disabled:bg-emerald-100"
                          >
                            {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex min-w-[60px] items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(job)}
                          className="flex min-w-[60px] items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
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

      <div className="mt-9 pb-5 text-center text-xs text-zinc-400">
        C3DW Workshop &mdash; Print Queue Manager
      </div>
    </div>
  );
}
