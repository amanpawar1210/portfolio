import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import PortfolioEditor from "../components/PortfolioEditor";
import { fetchPortfolio, ownerSession } from "../lib/api";
import { markOwner } from "../lib/track";
import type { Portfolio } from "../lib/types";
import { LoadError, LoadingScreen } from "./Home";

export default function Studio() {
  const navigate = useNavigate();
  const [state, setState] = useState<{ status: "loading" | "denied" | "error" | "ready"; portfolio?: Portfolio; updatedAt?: string | null; error?: string }>({ status: "loading" });

  const load = () => {
    setState({ status: "loading" });
    (async () => {
      try {
        const session = await ownerSession();
        markOwner(session.isOwner);
        if (!session.isOwner) { setState({ status: "denied" }); return; }
        const result = await fetchPortfolio();
        setState({ status: "ready", portfolio: result.portfolio, updatedAt: result.updatedAt });
      } catch (error) {
        setState({ status: "error", error: error instanceof Error ? error.message : "Could not load the studio" });
      }
    })();
  };
  useEffect(load, []);

  if (state.status === "loading") return <LoadingScreen/>;
  if (state.status === "error") return <LoadError message={state.error ?? ""} retry={load}/>;
  if (state.status === "denied") {
    return <main className="page-loading page-error">
      <LockKeyhole size={34}/>
      <h1>This studio is private.</h1>
      <p>Sign in as the owner to edit this site.</p>
      <div className="row-actions"><button className="primary-button" onClick={() => navigate("/owner-login")}>Sign in</button><Link className="ghost-button" to="/">View portfolio</Link></div>
    </main>;
  }
  return <PortfolioEditor initial={state.portfolio!} initialUpdatedAt={state.updatedAt ?? null}/>;
}
