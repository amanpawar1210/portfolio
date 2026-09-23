import { readPortfolio } from "../lib/portfolio";
import PortfolioView from "./portfolio-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  const portfolio = await readPortfolio();
  return <PortfolioView portfolio={portfolio} />;
}
