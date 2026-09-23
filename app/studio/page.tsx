import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { OWNER_EMAIL } from "../../lib/owner";
import { readPortfolio } from "../../lib/portfolio";
import PortfolioEditor from "./portfolio-editor";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");
  if (user.email.trim().toLowerCase() !== OWNER_EMAIL) return <main className="studio-access"><span>OWNER STUDIO</span><h1>This studio is private.</h1><p>Signed in as {user.email}. Only the portfolio owner can edit this site.</p><a href={chatGPTSignOutPath("/studio")}>Switch account</a><a href="/">View portfolio</a></main>;
  const portfolio = await readPortfolio();
  return <PortfolioEditor initial={portfolio} signOutUrl={chatGPTSignOutPath("/")} />;
}
