import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <main className="page-loading page-error">
    <span className="not-found-code">404</span>
    <h1>This page wandered off.</h1>
    <p>The link may be old, or the project was renamed.</p>
    <Link className="primary-button" to="/"><ArrowLeft size={16}/> Back to the portfolio</Link>
  </main>;
}
