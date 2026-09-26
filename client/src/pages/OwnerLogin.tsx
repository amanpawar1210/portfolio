import "../styles/studio.css";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, History, Inbox, KeyRound, Loader2, LockKeyhole, PenLine, ShieldCheck } from "lucide-react";
import { ApiError, ownerLogin, ownerSession } from "../lib/api";
import { markOwner } from "../lib/track";

const FEATURES = [
  { icon: <PenLine size={18}/>, title: "Edit every section", text: "With a live preview beside the editor." },
  { icon: <Inbox size={18}/>, title: "Read your messages", text: "Everything sent from the contact form." },
  { icon: <BarChart3 size={18}/>, title: "See who's visiting", text: "Views, CV downloads and top projects." },
  { icon: <History size={18}/>, title: "Undo with confidence", text: "Restore any of your last 20 saves." },
];

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lockedFor, setLockedFor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.title = "Owner studio — sign in";
    ownerSession().then(session => { if (session.isOwner) navigate("/studio", { replace: true }); }).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (lockedFor <= 0) return;
    const timer = setInterval(() => setLockedFor(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [lockedFor > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password || lockedFor > 0) return;
    setBusy(true); setError("");
    try {
      await ownerLogin(password);
      markOwner(true);
      navigate("/studio");
    } catch (err) {
      setShake(true); setTimeout(() => setShake(false), 500);
      setError(err instanceof Error ? err.message : "Sign in failed");
      if (err instanceof ApiError) {
        if (typeof err.body?.remaining === "number") setRemaining(err.body.remaining);
        if (typeof err.body?.retryAfterSec === "number" && err.body.retryAfterSec > 0) setLockedFor(err.body.retryAfterSec);
      }
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  const checkCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  const lockLabel = `${Math.floor(lockedFor / 60)}:${String(lockedFor % 60).padStart(2, "0")}`;

  return <main className="owner-login">
    <section className="login-showcase" aria-hidden="true">
      <div className="login-orbits"><i/><i/><i/></div>
      <Link className="login-back" to="/"><ArrowLeft size={16}/> Back to portfolio</Link>
      <div className="showcase-copy">
        <span className="section-index">PORTFOLIO STUDIO</span>
        <h2>Your portfolio,<br/><em>always current.</em></h2>
        <ul className="showcase-features">{FEATURES.map((feature, i) => <li key={feature.title} style={{ animationDelay: `${200 + i * 110}ms` }}><span>{feature.icon}</span><div><strong>{feature.title}</strong><small>{feature.text}</small></div></li>)}</ul>
      </div>
    </section>

    <section className="login-panel">
      <Link className="login-back mobile-only" to="/"><ArrowLeft size={16}/> Back to portfolio</Link>
      <form className={shake ? "login-card shake" : "login-card"} onSubmit={submit}>
        <div className="login-mark"><KeyRound size={22}/></div>
        <span className="section-index">PRIVATE WORKSPACE</span>
        <h1>Welcome back</h1>
        <p>Sign in with the owner password to manage your portfolio.</p>

        <label className="form-field">
          <span>Owner password</span>
          <div className="password-input">
            <LockKeyhole size={17}/>
            <input type={show ? "text" : "password"} autoComplete="current-password" autoFocus required value={password} disabled={lockedFor > 0}
              onChange={event => setPassword(event.target.value)} onKeyDown={checkCaps} onKeyUp={checkCaps} aria-invalid={Boolean(error)} aria-describedby="login-help"/>
            <button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
          </div>
        </label>
        <div id="login-help" className="login-notes" aria-live="polite">
          {capsLock && <p className="note warn"><AlertTriangle size={15}/> Caps Lock is on</p>}
          {lockedFor > 0
            ? <p className="note error"><LockKeyhole size={15}/> Too many attempts. Try again in {lockLabel}.</p>
            : error && <p className="note error"><AlertTriangle size={15}/> {error}{remaining !== null && remaining > 0 && remaining < 5 ? ` · ${remaining} attempt${remaining === 1 ? "" : "s"} left` : ""}</p>}
        </div>

        <button className="primary-button wide" type="submit" disabled={busy || !password || lockedFor > 0}>
          {busy ? <><Loader2 size={17} className="spin"/> Checking…</> : <>Sign in <ArrowRight size={17}/></>}
        </button>

        <div className="login-security"><ShieldCheck size={18}/><p>Your password is checked on the server. Only a signed, HTTP-only session cookie is stored, and sign-ins lock for 15 minutes after 5 wrong attempts.</p></div>
      </form>
    </section>
  </main>;
}
