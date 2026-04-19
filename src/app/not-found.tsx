import Link from "next/link";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#08111f",
  color: "#e2e8f0",
  fontFamily: "system-ui, sans-serif",
  textAlign: "center",
  padding: "2rem",
};

const codeStyle: React.CSSProperties = {
  fontSize: "5rem",
  fontWeight: 700,
  color: "#f97316",
  lineHeight: 1,
  margin: 0,
};

const headingStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  margin: "1rem 0 0.5rem",
};

const bodyStyle: React.CSSProperties = {
  color: "#94a3b8",
  margin: "0 0 2rem",
};

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  background: "#f97316",
  color: "#fff",
  borderRadius: "9999px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
};

export default function NotFound() {
  return (
    <div style={shellStyle}>
      <div>
        <p style={codeStyle}>404</p>
        <h1 style={headingStyle}>Page not found</h1>
        <p style={bodyStyle}>That URL doesn&apos;t exist. Head back to the app.</p>
        <Link href="/today" style={linkStyle}>
          Go to Today
        </Link>
      </div>
    </div>
  );
}
