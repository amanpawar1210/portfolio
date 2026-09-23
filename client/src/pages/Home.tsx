import { useEffect, useState } from "react";
import PortfolioView from "../components/PortfolioView";
import { fetchPortfolio } from "../lib/api";
import type { Portfolio } from "../lib/types";

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPortfolio()
      .then(result => setPortfolio(result.portfolio))
      .catch(err => setError(err instanceof Error ? err.message : "Could not load portfolio"));
  }, []);

  if (error) return <main className="portfolio-site"><p style={{ padding: 40 }}>{error}</p></main>;
  if (!portfolio) return <main className="portfolio-site page-loading" aria-busy="true"><span className="page-loading-mark">AP</span></main>;
  return <PortfolioView portfolio={portfolio} />;
}
