import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortfolioEditor from "../components/PortfolioEditor";
import { fetchPortfolio, ownerSession } from "../lib/api";
import type { Portfolio } from "../lib/types";

export default function Studio() {
  const [status, setStatus] = useState<"loading" | "denied" | "ready">("loading");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    (async () => {
      const session = await ownerSession().catch(() => ({ isOwner: false }));
      if (!session.isOwner) { setStatus("denied"); return; }
      const result = await fetchPortfolio();
      setPortfolio(result.portfolio);
      setStatus("ready");
    })();
  }, []);

  if (status === "loading") return <main className="studio-access page-loading-light" aria-busy="true"><span>OWNER STUDIO</span><h1>Loading…</h1></main>;

  if (status === "denied") {
    return <main className="studio-access">
      <span>OWNER STUDIO</span>
      <h1>This studio is private.</h1>
      <p>Sign in as the owner to edit this site.</p>
      <Link to="/owner-login">Sign in</Link>
      <Link to="/">View portfolio</Link>
    </main>;
  }

  return <PortfolioEditor initial={portfolio!} />;
}
