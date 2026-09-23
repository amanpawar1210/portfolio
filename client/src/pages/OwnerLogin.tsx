import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LockKeyhole, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { ownerLogin } from "../lib/api";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await ownerLogin(password);
      navigate("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return <main className="owner-login">
    <div className="login-atmosphere" aria-hidden="true"><i/><i/><i/></div>
    <Link className="login-back" to="/"><ArrowLeft size={17}/> Back to portfolio</Link>
    <section className="login-card">
      <div className="login-mark">AP</div>
      <span className="login-overline">PRIVATE WORKSPACE</span>
      <h1>Owner Studio</h1>
      <p>Sign in with the owner password to update experience, skills, projects, links and your CV.</p>
      <div className="login-security"><ShieldCheck size={19}/><div><strong>Protected owner access</strong><span>Only you know this password.</span></div></div>
      <form className="login-form" onSubmit={submit}>
        <input type="password" required autoFocus placeholder="Owner password" value={password} onChange={event => setPassword(event.target.value)} />
        <button className="login-primary" type="submit" disabled={busy}><LockKeyhole size={18}/> {busy ? "Signing in…" : "Sign in"} <ArrowRight size={18}/></button>
      </form>
      {error && <small className="login-error">{error}</small>}
      <small>Your password is checked on the server — only a signed session cookie is kept in your browser.</small>
    </section>
  </main>;
}
