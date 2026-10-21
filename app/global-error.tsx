"use client";

/**
 * Last-resort boundary: replaces the whole document when the root layout
 * itself fails, so it has to render its own <html> and inline its styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          background: "#0A0A0A",
          color: "#F5F2EC",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#B8935A",
            margin: 0,
          }}
        >
          YT Onyx
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 300, margin: 0 }}>
          The site could not be loaded
        </h1>
        <p style={{ color: "rgba(245,242,236,0.6)", maxWidth: "28rem", margin: 0 }}>
          Please refresh the page. If the problem continues, it is on our side
          and we are already looking at it.
        </p>
        {error.digest ? (
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(245,242,236,0.35)",
              margin: 0,
            }}
          >
            Reference {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            background: "#B8935A",
            color: "#0A0A0A",
            border: "none",
            padding: "0.85rem 1.75rem",
            fontSize: "0.72rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
