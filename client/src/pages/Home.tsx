import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { RotateCw } from "lucide-react";
import PortfolioView from "../components/PortfolioView";
import { usePortfolio } from "../lib/context";
import { track } from "../lib/track";

export function LoadingScreen() {
  return <main className="page-loading" aria-busy="true" aria-label="Loading"><span className="page-loading-mark"/></main>;
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <main className="page-loading page-error" role="alert"><h1>Couldn&apos;t load the portfolio</h1><p>{message}</p><button className="primary-button" onClick={retry}><RotateCw size={16}/> Try again</button></main>;
}

export default function Home() {
  const { portfolio, error, reload } = usePortfolio();
  const location = useLocation();

  useEffect(() => {
    if (!portfolio) return;
    document.title = `${portfolio.name} — ${portfolio.designation}`;
    track("view", "", true);
  }, [portfolio]);

  // Honour /#section links (e.g. coming back from a case study).
  useEffect(() => {
    if (!portfolio || !location.hash) return;
    const timer = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(timer);
  }, [portfolio, location.hash]);

  if (error) return <LoadError message={error} retry={reload}/>;
  if (!portfolio) return <LoadingScreen/>;
  return <PortfolioView portfolio={portfolio}/>;
}
