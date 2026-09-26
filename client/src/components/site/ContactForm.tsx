import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { ApiError, sendMessage } from "../../lib/api";
import { IS_PREVIEW } from "../../lib/track";
import { burstConfetti } from "../../lib/motion";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOPICS = ["Job opportunity", "Freelance project", "Collaboration", "Just saying hi"];
type Fields = { name: string; email: string; subject: string; message: string; website: string };

export default function ContactForm({ ownerName }: { ownerName: string }) {
  const [form, setForm] = useState<Fields>({ name: "", email: "", subject: TOPICS[0], message: "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState("");

  const validate = (values: Fields) => {
    const next: typeof errors = {};
    if (values.name.trim().length < 2) next.name = "Tell me your name";
    if (!EMAIL.test(values.email.trim())) next.email = "Enter a valid email so I can reply";
    if (values.message.trim().length < 10) next.message = "Write at least 10 characters";
    return next;
  };

  const set = (key: keyof Fields, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched[key]) setErrors(validate(next));
  };
  const blur = (key: keyof Fields) => { setTouched(t => ({ ...t, [key]: true })); setErrors(validate(form)); };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(found).length) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (IS_PREVIEW) { setServerError("Messages are disabled in the studio preview."); return; }
    setState("sending"); setServerError("");
    try {
      await sendMessage({ ...form, source: "contact-form" });
      burstConfetti(document.querySelector(".contact-form"));
      setState("sent");
    } catch (error) {
      setState("idle");
      if (error instanceof ApiError && error.body?.fields) setErrors(error.body.fields as typeof errors);
      setServerError(error instanceof Error ? error.message : "Could not send your message");
    }
  }

  if (state === "sent") {
    return <div className="contact-form sent" role="status">
      <CheckCircle2 size={44}/>
      <h3>Message sent. Thank you, {form.name.split(" ")[0]}!</h3>
      <p>{ownerName.split(" ")[0]} usually replies within a day or two at <strong>{form.email}</strong>.</p>
      <button type="button" className="ghost-button" onClick={() => { setForm({ name: "", email: "", subject: TOPICS[0], message: "", website: "" }); setTouched({}); setErrors({}); setState("idle"); }}>Send another message</button>
    </div>;
  }

  const field = (key: "name" | "email", label: string, type: string, autoComplete: string) => <label className={errors[key] && touched[key] ? "form-field invalid" : "form-field"}>
    <span>{label}</span>
    <input id={`contact-${key}`} type={type} autoComplete={autoComplete} value={form[key]} onChange={event => set(key, event.target.value)} onBlur={() => blur(key)} aria-invalid={Boolean(errors[key] && touched[key])} aria-describedby={`contact-${key}-error`}/>
    <small id={`contact-${key}-error`}>{touched[key] ? errors[key] : ""}</small>
  </label>;

  return <form className="contact-form" onSubmit={submit} noValidate>
    <div className="form-row">
      {field("name", "Your name", "text", "name")}
      {field("email", "Email", "email", "email")}
    </div>
    <fieldset className="topic-chips">
      <legend>What's it about?</legend>
      {TOPICS.map(topic => <label key={topic} className={form.subject === topic ? "chip active" : "chip"}><input type="radio" name="subject" value={topic} checked={form.subject === topic} onChange={() => set("subject", topic)}/>{topic}</label>)}
    </fieldset>
    <label className={errors.message && touched.message ? "form-field invalid" : "form-field"}>
      <span>Message <em>{form.message.length}/4000</em></span>
      <textarea id="contact-message" rows={5} maxLength={4000} value={form.message} onChange={event => set("message", event.target.value)} onBlur={() => blur("message")} placeholder="A few lines about the role, project or idea…" aria-invalid={Boolean(errors.message && touched.message)} aria-describedby="contact-message-error"/>
      <small id="contact-message-error">{touched.message ? errors.message : ""}</small>
    </label>
    <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => set("website", event.target.value)}/></label>
    {serverError && <p className="form-error" role="alert">{serverError}</p>}
    <button className="primary-button" data-magnetic="0.2" type="submit" disabled={state === "sending"}>
      {state === "sending" ? <><Loader2 size={17} className="spin"/> Sending…</> : <>Send message <Send size={16}/></>}
    </button>
  </form>;
}
