"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
        background: "#faf9f7",
        color: "#332b24",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "1.5rem",
      }}
    >
      <main
        style={{ textAlign: "center", maxWidth: "24rem" }}
        role="main"
        aria-label="Página sin conexión"
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }} aria-hidden="true">
          📡
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Sin conexión
        </h1>
        <p style={{ color: "#6b5d52", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          No tienes conexión a internet. Comprueba tu WiFi o datos móviles e
          inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "#F97316",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
          }}
        >
          Reintentar
        </button>
      </main>
    </div>
  );
}
