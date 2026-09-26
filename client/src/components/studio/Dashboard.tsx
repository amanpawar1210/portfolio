import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Eye, FolderOpen, Inbox, MousePointerClick, RefreshCw, Users } from "lucide-react";
import type { Analytics, Portfolio, Totals } from "../../lib/types";
import { fetchAnalytics } from "../../lib/api";
import { timeAgo } from "../../lib/hooks";
import { CompletionCard } from "./ContentEditors";

const RANGES = [7, 30, 90];

export default function Dashboard({ data, onOpenInbox, onJump }: { data: Portfolio; onOpenInbox: () => void; onJump: (label: string) => void }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (range = days) => {
    setLoading(true); setError("");
    fetchAnalytics(range).then(setStats).catch(err => setError(err instanceof Error ? err.message : "Could not load analytics")).finally(() => setLoading(false));
  };
  useEffect(() => { load(days); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const titles = useMemo(() => Object.fromEntries(data.projects.map(project => [project.id, project.title])), [data.projects]);
  const kpis: { key: keyof Totals; label: string; icon: React.ReactNode }[] = [
    { key: "views", label: "Page views", icon: <Eye size={16}/> },
    { key: "visitors", label: "Unique visitors", icon: <Users size={16}/> },
    { key: "projectViews", label: "Case study views", icon: <FolderOpen size={16}/> },
    { key: "cv", label: "CV downloads", icon: <Download size={16}/> },
    { key: "projectClicks", label: "Live project clicks", icon: <MousePointerClick size={16}/> },
    { key: "messages", label: "Messages", icon: <Inbox size={16}/> },
  ];

  return <div className="dashboard">
    <div className="dash-toolbar">
      <div className="segmented" role="group" aria-label="Date range">{RANGES.map(range => <button key={range} className={days === range ? "active" : ""} aria-pressed={days === range} onClick={() => setDays(range)}>{range} days</button>)}</div>
      <button className="studio-button small ghost" onClick={() => load()} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""}/> Refresh</button>
    </div>

    {error && <p className="studio-error" role="alert">{error}</p>}

    {stats && stats.unread > 0 && <button className="unread-banner" onClick={onOpenInbox}><Inbox size={18}/> You have <strong>{stats.unread} unread message{stats.unread === 1 ? "" : "s"}</strong><ArrowUpRight size={16}/></button>}

    <div className="kpi-grid">{kpis.map(kpi => {
      const value = stats?.current[kpi.key] ?? 0;
      const before = stats?.previous[kpi.key] ?? 0;
      const change = before === 0 ? (value > 0 ? 100 : 0) : Math.round((value - before) / before * 100);
      return <div key={kpi.key} className={loading && !stats ? "kpi skeleton" : "kpi"}>
        <span className="kpi-label">{kpi.icon}{kpi.label}</span>
        <strong>{value.toLocaleString("en-IN")}</strong>
        {stats && <span className={change > 0 ? "delta up" : change < 0 ? "delta down" : "delta"}>{change > 0 ? <ArrowUpRight size={13}/> : change < 0 ? <ArrowDownRight size={13}/> : null}{change === 0 ? "No change" : `${Math.abs(change)}%`} <small>vs previous {days}d</small></span>}
      </div>;
    })}</div>

    <div className="dash-grid">
      <section className="dash-card span-2">
        <header><h3>Daily page views</h3><span>{stats ? `${stats.current.views} views · ${stats.current.visitors} visitors` : ""}</span></header>
        {stats ? <AreaChart points={stats.daily}/> : <div className="chart-skeleton"/>}
      </section>

      <section className="dash-card">
        <header><h3>Top projects</h3><span>case study views</span></header>
        {stats && stats.projects.length > 0
          ? <BarList rows={stats.projects.map(item => ({ label: titles[item.id] ?? item.id, value: item.views, note: item.clicks ? `${item.clicks} live click${item.clicks === 1 ? "" : "s"}` : "" }))}/>
          : <Empty text="No project views in this period yet."/>}
      </section>

      <section className="dash-card">
        <header><h3>Where visitors come from</h3></header>
        {stats && stats.referrers.length > 0 ? <BarList rows={stats.referrers}/> : <Empty text="No visits in this period yet."/>}
        {stats && stats.devices.length > 0 && <DeviceSplit devices={stats.devices}/>}
      </section>

      <section className="dash-card">
        <header><h3>Recent activity</h3></header>
        {stats && stats.recent.length > 0
          ? <ul className="activity">{stats.recent.map((event, i) => <li key={i}><span className={`activity-dot type-${event.type}`}/><div><strong>{describe(event, titles)}</strong><small>{timeAgo(event.at)}{event.referrer ? ` · from ${event.referrer}` : ""}{event.device ? ` · ${event.device}` : ""}</small></div></li>)}</ul>
          : <Empty text="Nothing yet. Share your link and activity will show up here."/>}
      </section>

      <section className="dash-card">
        <CompletionCard data={data} onJump={onJump}/>
      </section>
    </div>
    <p className="dash-note">Visits by you (while signed in) and by the studio preview are not counted. Visitors are identified by an anonymous random id, never by IP address.</p>
  </div>;
}

function describe(event: Analytics["recent"][number], titles: Record<string, string>) {
  switch (event.type) {
    case "view": return "Someone visited your portfolio";
    case "project_view": return `Viewed the ${titles[event.target] ?? event.target} case study`;
    case "project_click": return `Opened ${titles[event.target] ?? event.target} live`;
    case "cv": return "Downloaded your CV";
    case "contact": return "Sent you a message";
    case "email_copy": return "Copied your email address";
    case "outbound": return `Opened your ${event.target.startsWith("repo:") ? "source code" : event.target}`;
    default: return event.type;
  }
}

function Empty({ text }: { text: string }) {
  return <p className="dash-empty">{text}</p>;
}

function BarList({ rows }: { rows: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  return <ul className="bar-list">{rows.map(row => <li key={row.label} title={`${row.label}: ${row.value}`}>
    <div className="bar-track"><i style={{ width: `${Math.max(2, row.value / max * 100)}%` }}/><span>{row.label}{row.note && <small> · {row.note}</small>}</span></div>
    <strong>{row.value}</strong>
  </li>)}</ul>;
}

function DeviceSplit({ devices }: { devices: { label: string; value: number }[] }) {
  const total = devices.reduce((sum, d) => sum + d.value, 0) || 1;
  const desktop = devices.find(d => d.label === "desktop")?.value ?? 0;
  const pct = Math.round(desktop / total * 100);
  return <div className="device-split">
    <div className="split-bar" role="img" aria-label={`${pct}% desktop, ${100 - pct}% mobile`}><i style={{ width: `${pct}%` }}/><b style={{ width: `${100 - pct}%` }}/></div>
    <div className="split-legend"><span><i className="key desktop"/>Desktop {pct}%</span><span><i className="key mobile"/>Mobile {100 - pct}%</span></div>
  </div>;
}

/** Single-series area chart with a hover crosshair + tooltip. */
function AreaChart({ points }: { points: { date: string; views: number; visitors: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720, height = 220, pad = { top: 16, right: 12, bottom: 26, left: 34 };
  const max = Math.max(4, ...points.map(p => p.views));
  const niceMax = Math.ceil(max / 4) * 4;
  const x = (i: number) => pad.left + (points.length === 1 ? 0 : i / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - v / niceMax) * (height - pad.top - pad.bottom);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = [0, niceMax / 4, niceMax / 2, niceMax * 3 / 4, niceMax];
  const labelEvery = Math.ceil(points.length / 6);
  const fmt = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const active = hover !== null ? points[hover] : null;

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width * width;
    const i = Math.round((px - pad.left) / (width - pad.left - pad.right) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  return <div className="area-chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Page views per day" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <defs><linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".28"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
      {ticks.map(t => <g key={t}><line className="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)}/><text className="axis" x={pad.left - 8} y={y(t) + 4} textAnchor="end">{t}</text></g>)}
      {points.map((p, i) => i % labelEvery === 0 && <text key={p.date} className="axis" x={x(i)} y={height - 6} textAnchor="middle">{fmt(p.date)}</text>)}
      <path d={area} fill="url(#area-fill)"/>
      <path d={line} className="series"/>
      {active && hover !== null && <g><line className="crosshair" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={y(0)}/><circle className="marker" cx={x(hover)} cy={y(active.views)} r="5"/></g>}
    </svg>
    {active && hover !== null && <div className="chart-tooltip" style={{ left: `${x(hover) / width * 100}%` }}><strong>{fmt(active.date)}</strong><span>{active.views} view{active.views === 1 ? "" : "s"}</span><span>{active.visitors} visitor{active.visitors === 1 ? "" : "s"}</span></div>}
    <details className="chart-table"><summary>View as table</summary><table><thead><tr><th>Date</th><th>Views</th><th>Visitors</th></tr></thead><tbody>{points.filter(p => p.views).map(p => <tr key={p.date}><td>{fmt(p.date)}</td><td>{p.views}</td><td>{p.visitors}</td></tr>)}</tbody></table></details>
  </div>;
}
