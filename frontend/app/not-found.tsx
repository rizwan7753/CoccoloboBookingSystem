// Root-level fallback for a completely unmatched path (e.g. a mistyped URL
// with no matching route segment at all) — the root layout (app/layout.tsx)
// still wraps this, but app/(site)/layout.tsx's Header/Footer don't, since
// there's no matching route under that group to attach them to. Styled
// standalone with inline design-token values for that reason.
export default function NotFound() {
  return (
    <main
      className="site-body"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        background: "#fffdf7",
        color: "#164a59",
      }}
    >
      <p style={{ color: "#c9492f", fontSize: ".85rem", letterSpacing: ".16em", fontWeight: 500 }}>404</p>
      <h1 className="font-display" style={{ marginTop: ".5rem", fontSize: "2rem" }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ marginTop: ".75rem", opacity: 0.7, maxWidth: "34rem" }}>
        The link may be out of date, or the page may have moved. Head back to the homepage to keep browsing.
      </p>
      <a href="/" className="btn" style={{ marginTop: "2rem" }}>
        Back to home
      </a>
    </main>
  );
}
