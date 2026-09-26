import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Inbox as InboxIcon, Mail, MailOpen, RefreshCw, Reply, Search, Star, Trash2 } from "lucide-react";
import type { Message } from "../../lib/types";
import { deleteMessage, fetchMessages, updateMessage } from "../../lib/api";
import { useToast } from "../../lib/context";
import { timeAgo } from "../../lib/hooks";

type Filter = "all" | "unread" | "starred";

export default function Inbox({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetchMessages().then(result => { setMessages(result.messages); setError(""); }).catch(err => setError(err instanceof Error ? err.message : "Could not load messages")).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => { if (messages) onUnreadChange(messages.filter(m => !m.read).length); }, [messages, onUnreadChange]);

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (messages ?? []).filter(m => (filter === "all" || (filter === "unread" ? !m.read : m.starred)) && (!q || `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q)));
  }, [messages, filter, query]);
  const current = messages?.find(m => m.id === selected) ?? null;

  const patch = async (id: string, change: Partial<Pick<Message, "read" | "starred">>) => {
    setMessages(list => list?.map(m => m.id === id ? { ...m, ...change } : m) ?? null);
    try { await updateMessage(id, change); } catch (err) { toast(err instanceof Error ? err.message : "Update failed", "error"); load(); }
  };
  const open = (message: Message) => { setSelected(message.id); if (!message.read) void patch(message.id, { read: true }); };
  const remove = async (message: Message) => {
    if (!confirm(`Delete the message from ${message.name}? This can't be undone.`)) return;
    try {
      await deleteMessage(message.id);
      setMessages(list => list?.filter(m => m.id !== message.id) ?? null);
      setSelected(null);
      toast("Message deleted");
    } catch (err) { toast(err instanceof Error ? err.message : "Delete failed", "error"); }
  };

  const counts = { all: messages?.length ?? 0, unread: messages?.filter(m => !m.read).length ?? 0, starred: messages?.filter(m => m.starred).length ?? 0 };

  return <div className={current ? "inbox has-selection" : "inbox"}>
    <div className="inbox-list">
      <div className="inbox-tools">
        <div className="search-field"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search messages" aria-label="Search messages"/></div>
        <button className="icon-button" onClick={load} aria-label="Refresh"><RefreshCw size={15} className={loading ? "spin" : ""}/></button>
      </div>
      <div className="segmented" role="group" aria-label="Filter">{(["all", "unread", "starred"] as Filter[]).map(key => <button key={key} className={filter === key ? "active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{key[0].toUpperCase() + key.slice(1)} <em>{counts[key]}</em></button>)}</div>
      {error && <p className="studio-error">{error}</p>}
      {!messages && !error && <div className="inbox-skeleton"><i/><i/><i/></div>}
      {messages && visible.length === 0 && <div className="inbox-empty"><InboxIcon size={28}/><p>{messages.length === 0 ? "No messages yet. When someone uses your contact form, it shows up here." : "No messages match."}</p></div>}
      <ul>{visible.map(m => <li key={m.id}>
        <button className={`inbox-row${m.read ? "" : " unread"}${selected === m.id ? " active" : ""}`} onClick={() => open(m)}>
          <span className="avatar" aria-hidden="true">{m.name.slice(0, 1).toUpperCase()}</span>
          <div><div className="row-top"><strong>{m.name}</strong><time dateTime={m.createdAt}>{timeAgo(m.createdAt)}</time></div><span className="row-subject">{m.subject || "No subject"}</span><span className="row-preview">{m.message}</span></div>
          {m.starred && <Star size={14} className="star on"/>}
        </button>
      </li>)}</ul>
    </div>

    <div className="inbox-detail">
      {current ? <article>
        <button className="studio-button small ghost back-to-list" onClick={() => setSelected(null)}><ArrowLeft size={14}/> All messages</button>
        <header>
          <span className="avatar large" aria-hidden="true">{current.name.slice(0, 1).toUpperCase()}</span>
          <div><h3>{current.subject || "No subject"}</h3><p><strong>{current.name}</strong> · <a href={`mailto:${current.email}`}>{current.email}</a></p><time dateTime={current.createdAt}>{new Date(current.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div>
        </header>
        <div className="message-body">{current.message}</div>
        <div className="message-actions">
          <a className="studio-button" href={`mailto:${current.email}?subject=${encodeURIComponent(`Re: ${current.subject || "Your message"}`)}&body=${encodeURIComponent(`Hi ${current.name.split(" ")[0]},\n\n\n\n---\nOn ${new Date(current.createdAt).toLocaleDateString("en-IN")}, you wrote:\n> ${current.message.split("\n").join("\n> ")}`)}`}><Reply size={15}/> Reply by email</a>
          <button className="studio-button ghost" onClick={() => navigator.clipboard.writeText(current.email).then(() => toast("Email copied"))}><Copy size={15}/> Copy email</button>
          <button className="studio-button ghost" onClick={() => patch(current.id, { starred: !current.starred })}><Star size={15} className={current.starred ? "star on" : "star"}/> {current.starred ? "Starred" : "Star"}</button>
          <button className="studio-button ghost" onClick={() => patch(current.id, { read: !current.read })}>{current.read ? <><Mail size={15}/> Mark unread</> : <><MailOpen size={15}/> Mark read</>}</button>
          <button className="studio-button ghost danger" onClick={() => remove(current)}><Trash2 size={15}/> Delete</button>
        </div>
      </article> : <div className="inbox-empty"><MailOpen size={28}/><p>Select a message to read it.</p></div>}
    </div>
  </div>;
}
