import { LockKeyhole, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { chatGPTSignInPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default function OwnerLoginPage() {
  return <main className="owner-login">
    <div className="login-atmosphere" aria-hidden="true"><i/><i/><i/></div>
    <a className="login-back" href="/"><ArrowLeft size={17}/> Back to portfolio</a>
    <section className="login-card">
      <div className="login-mark">AP</div>
      <span className="login-overline">PRIVATE WORKSPACE</span>
      <h1>Owner Studio</h1>
      <p>Sign in with the owner account to update experience, skills, projects, links and your CV.</p>
      <div className="login-security"><ShieldCheck size={19}/><div><strong>Protected owner access</strong><span>Only amanrpawar18@gmail.com is authorized.</span></div></div>
      <a className="login-primary" href={chatGPTSignInPath("/studio")} target="_top"><LockKeyhole size={18}/> Sign in securely <ArrowRight size={18}/></a>
      <a className="login-local" href="/studio">Open local development studio</a>
      <small>Your password is handled by the secure sign-in provider and is never stored inside this portfolio.</small>
    </section>
  </main>;
}
