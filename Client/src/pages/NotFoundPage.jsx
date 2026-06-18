import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="empty-state">
        Page not found.
        <Link className="primary-button" to="/">Go Home</Link>
      </div>
    </main>
  );
}

