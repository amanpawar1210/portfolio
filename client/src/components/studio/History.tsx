import { useEffect, useState } from "react";
import { Eye, History as HistoryIcon, Loader2, RotateCcw } from "lucide-react";
import type { Portfolio, Revision } from "../../lib/types";
import { fetchRevision, fetchRevisions, restoreRevision } from "../../lib/api";
import { useToast } from "../../lib/context";
import { timeAgo } from "../../lib/hooks";

export default function History({ refreshKey, dirty, onLoadDraft, onRestored }: { refreshKey: string | null; dirty: boolean; onLoadDraft: (portfolio: Portfolio) => void; onRestored: (portfolio: Portfolio, updatedAt: string) => void }) {
  const toast = useToast();
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchRevisions().then(result => setRevisions(result.revisions)).catch(err => setError(err instanceof Error ? err.message : "Could not load history"));
  }, [refreshKey]);

  const load = async (revision: Revision) => {
    if (dirty && !confirm("Loading this version replaces your unsaved changes in the editor. Continue?")) return;
    setBusy(revision.id);
    try {
      const result = await fetchRevision(revision.id);
      onLoadDraft(result.portfolio);
      toast("Version loaded into the editor. Review it, then save to publish.", "info");
    } catch (err) { toast(err instanceof Error ? err.message : "Could not load version", "error"); }
    finally { setBusy(null); }
  };

  const restore = async (revision: Revision) => {
    if (!confirm(`Publish the version from ${new Date(revision.savedAt).toLocaleString("en-IN")}? Your current site is kept in history too.`)) return;
    setBusy(revision.id);
    try {
      const result = await restoreRevision(revision.id);
      onRestored(result.portfolio, result.updatedAt);
      toast("Version restored and published");
    } catch (err) { toast(err instanceof Error ? err.message : "Restore failed", "error"); }
    finally { setBusy(null); }
  };

  return <section className="studio-panel">
    <header><h2>Version history</h2><p>Every save is kept (the latest 20). Load one into the editor to review it, or restore it straight to the live site.</p></header>
    {error && <p className="studio-error">{error}</p>}
    {!revisions && !error && <div className="inbox-skeleton"><i/><i/><i/></div>}
    {revisions?.length === 0 && <div className="inbox-empty"><HistoryIcon size={28}/><p>No saved versions yet. Your first save will appear here.</p></div>}
    <ol className="history">{revisions?.map((revision, index) => <li key={revision.id}>
      <span className="history-dot" aria-hidden="true"/>
      <div className="history-info">
        <strong>{index === 0 ? "Live version" : revision.label}</strong>
        <time dateTime={revision.savedAt} title={new Date(revision.savedAt).toLocaleString("en-IN")}>{timeAgo(revision.savedAt)} · {new Date(revision.savedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
        <small>{revision.projects} projects · {revision.roles} roles · “{revision.headline.slice(0, 60)}{revision.headline.length > 60 ? "…" : ""}”</small>
      </div>
      {index > 0 && <div className="history-actions">
        <button className="studio-button small ghost" disabled={busy !== null} onClick={() => load(revision)}>{busy === revision.id ? <Loader2 size={14} className="spin"/> : <Eye size={14}/>} Load</button>
        <button className="studio-button small" disabled={busy !== null} onClick={() => restore(revision)}><RotateCcw size={14}/> Restore</button>
      </div>}
    </li>)}</ol>
  </section>;
}
