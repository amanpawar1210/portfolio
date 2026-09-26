import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { fileUrl, uploadImage } from "../../lib/api";
import { useToast } from "../../lib/context";

export function Field({ label, hint, count, max, children, wide }: { label: string; hint?: string; count?: number; max?: number; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? "studio-field wide" : "studio-field"}>
    <span>{label}{hint && <small>{hint}</small>}{max !== undefined && count !== undefined && <em className={count > max * 0.9 ? "near" : ""}>{count}/{max}</em>}</span>
    {children}
  </label>;
}

export function Text({ label, value, onChange, placeholder, hint, max, type = "text", wide }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string; max?: number; type?: string; wide?: boolean }) {
  return <Field label={label} hint={hint} count={value.length} max={max} wide={wide}><input type={type} value={value} maxLength={max} placeholder={placeholder ?? ""} onChange={event => onChange(event.target.value)}/></Field>;
}

export function Area({ label, value, onChange, rows = 4, placeholder, hint, max }: { label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string; hint?: string; max?: number }) {
  return <Field label={label} hint={hint} count={value.length} max={max} wide><textarea rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={event => onChange(event.target.value)}/></Field>;
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  return <label className="studio-toggle">
    <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)}/>
    <span className="switch" aria-hidden="true"/>
    <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
  </label>;
}

/** Chips input: Enter or comma adds, Backspace on empty removes last, paste splits lists. */
export function Tags({ label, value, onChange, placeholder = "Type and press Enter", hint, max = 40 }: { label: string; value: string[]; onChange: (value: string[]) => void; placeholder?: string; hint?: string; max?: number }) {
  const [draft, setDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const add = (raw: string) => {
    const items = raw.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
    const next = [...value];
    items.forEach(item => { if (!next.some(existing => existing.toLowerCase() === item.toLowerCase())) next.push(item); });
    onChange(next.slice(0, max));
    setDraft("");
  };
  const drop = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...value];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
  };
  return <div className="studio-field wide">
    <span>{label}<small>{hint ?? "Enter or comma to add · drag to reorder"}</small><em>{value.length}/{max}</em></span>
    <div className="tag-input" onClick={event => (event.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      {value.map((tag, index) => <span key={`${tag}-${index}`} className={dragIndex === index ? "tag dragging" : "tag"} draggable onDragStart={() => setDragIndex(index)} onDragOver={event => event.preventDefault()} onDrop={() => drop(index)} onDragEnd={() => setDragIndex(null)}>
        {tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((_, i) => i !== index))}><X size={12}/></button>
      </span>)}
      <input value={draft} placeholder={value.length ? "" : placeholder} aria-label={label}
        onChange={event => { if (/[,\n]/.test(event.target.value)) add(event.target.value); else setDraft(event.target.value); }}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); if (draft.trim()) add(draft); }
          else if (event.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft.trim() && add(draft)}
        onPaste={event => { const text = event.clipboardData.getData("text"); if (/[,\n]/.test(text)) { event.preventDefault(); add(text); } }}/>
    </div>
  </div>;
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Sortable, collapsible list of records with add / remove / move controls. */
export function RecordList<T>({ items, onChange, create, title, render, addLabel, empty, max = 30, defaultOpen }: {
  items: T[]; onChange: (items: T[]) => void; create: () => T; title: (item: T, index: number) => ReactNode; render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel: string; empty: string; max?: number; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen ? items.map((_, i) => i) : []));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const toast = useToast();

  const update = (index: number, patch: Partial<T>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setOpen(current => new Set([...current].filter(i => i !== index).map(i => i > index ? i - 1 : i)));
    toast("Removed. Save to publish, or discard changes to undo.", "info");
  };
  const reorder = (from: number, to: number) => {
    onChange(move(items, from, to));
    setOpen(current => {
      const next = new Set<number>();
      current.forEach(i => next.add(i === from ? to : i > from && i <= to ? i - 1 : i < from && i >= to ? i + 1 : i));
      return next;
    });
  };

  return <div className="record-list">
    {items.length === 0 && <p className="studio-empty">{empty}</p>}
    {items.map((item, index) => {
      const expanded = open.has(index);
      return <div key={index} className={`record${expanded ? " open" : ""}${dragIndex === index ? " dragging" : ""}${overIndex === index && dragIndex !== index ? " drop-target" : ""}`}
        onDragOver={event => { if (dragIndex !== null) { event.preventDefault(); setOverIndex(index); } }}
        onDrop={() => { if (dragIndex !== null && dragIndex !== index) reorder(dragIndex, index); setDragIndex(null); setOverIndex(null); }}>
        <div className="record-head">
          <span className="drag-handle" draggable onDragStart={event => { setDragIndex(index); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDragIndex(null); setOverIndex(null); }} title="Drag to reorder" aria-hidden="true"><GripVertical size={16}/></span>
          <button type="button" className="record-title" aria-expanded={expanded} onClick={() => setOpen(current => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; })}>
            <span className="record-index">{String(index + 1).padStart(2, "0")}</span>{title(item, index)}<ChevronDown size={16} className="record-chevron"/>
          </button>
          <div className="record-tools">
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => reorder(index, index - 1)}><ArrowUp size={15}/></button>
            <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => reorder(index, index + 1)}><ArrowDown size={15}/></button>
            <button type="button" aria-label="Remove" className="danger" onClick={() => remove(index)}><Trash2 size={15}/></button>
          </div>
        </div>
        {expanded && <div className="record-body">{render(item, patch => update(index, patch), index)}</div>}
      </div>;
    })}
    {items.length < max && <button type="button" className="add-record" onClick={() => { onChange([...items, create()]); setOpen(current => new Set(current).add(items.length)); }}><Plus size={16}/> {addLabel}</button>}
  </div>;
}

/** Ordered list of short strings (highlights, features). */
export function Lines({ label, value, onChange, placeholder, max = 16 }: { label: string; value: string[]; onChange: (value: string[]) => void; placeholder: string; max?: number }) {
  return <div className="studio-field wide">
    <span>{label}<em>{value.length}/{max}</em></span>
    <div className="lines">
      {value.map((line, index) => <div className="line" key={index}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <textarea rows={2} value={line} placeholder={placeholder} onChange={event => onChange(value.map((item, i) => i === index ? event.target.value : item))}/>
        <div className="record-tools">
          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onChange(move(value, index, index - 1))}><ArrowUp size={14}/></button>
          <button type="button" aria-label="Move down" disabled={index === value.length - 1} onClick={() => onChange(move(value, index, index + 1))}><ArrowDown size={14}/></button>
          <button type="button" aria-label="Remove" className="danger" onClick={() => onChange(value.filter((_, i) => i !== index))}><Trash2 size={14}/></button>
        </div>
      </div>)}
      {value.length < max && <button type="button" className="add-line" onClick={() => onChange([...value, ""])}><Plus size={14}/> Add line</button>}
    </div>
  </div>;
}

/** Drop-zone image uploader. Returns the stored image URL. */
export function ImageDrop({ value, onChange, label = "Screenshot", compact }: { value: string; onChange: (url: string) => void; label?: string; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast("Choose a JPG, PNG or WEBP image", "error"); return; }
    if (file.size > 4_000_000) { toast("Images must be under 4 MB", "error"); return; }
    setBusy(true);
    try {
      const result = await uploadImage(file);
      onChange(result.url);
      toast("Image uploaded — save to publish it");
    } catch (error) { toast(error instanceof Error ? error.message : "Upload failed", "error"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return <div className={`image-drop${over ? " over" : ""}${compact ? " compact" : ""}`}
    onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={event => { event.preventDefault(); setOver(false); void upload(event.dataTransfer.files[0]); }}>
    {value ? <img src={fileUrl(value)} alt=""/> : <div className="image-placeholder">{busy ? <Loader2 className="spin" size={22}/> : <ImagePlus size={22}/>}</div>}
    <div>
      <strong>{label}</strong>
      <p>Drag an image here, or choose one. JPG, PNG or WEBP, under 4 MB.</p>
      <div className="image-actions">
        <button type="button" className="studio-button small" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : value ? "Replace" : "Choose image"}</button>
        {value && <button type="button" className="studio-button small ghost" onClick={() => onChange("")}>Remove</button>}
      </div>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void upload(event.target.files?.[0])}/>
    </div>
  </div>;
}

export function Gallery({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  return <div className="studio-field wide">
    <span>Gallery<small>Extra screenshots shown on the case study page</small><em>{value.length}/8</em></span>
    <div className="gallery-editor">
      {value.map((src, index) => <figure key={src}>
        <img src={fileUrl(src)} alt={`Screenshot ${index + 1}`}/>
        <div className="record-tools">
          <button type="button" aria-label="Move left" disabled={index === 0} onClick={() => onChange(move(value, index, index - 1))}><ArrowUp size={14} style={{ rotate: "-90deg" }}/></button>
          <button type="button" aria-label="Move right" disabled={index === value.length - 1} onClick={() => onChange(move(value, index, index + 1))}><ArrowDown size={14} style={{ rotate: "-90deg" }}/></button>
          <button type="button" aria-label="Remove" className="danger" onClick={() => onChange(value.filter((_, i) => i !== index))}><Trash2 size={14}/></button>
        </div>
      </figure>)}
      {value.length < 8 && (adding
        ? <ImageDrop compact value="" label="Add screenshot" onChange={url => { if (url) onChange([...value, url]); setAdding(false); }}/>
        : <button type="button" className="gallery-add" onClick={() => setAdding(true)}><Plus size={18}/> Add screenshot</button>)}
    </div>
  </div>;
}
