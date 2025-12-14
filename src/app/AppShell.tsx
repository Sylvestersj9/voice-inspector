import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function Header() {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 800 }}>Voice Inspector</div>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/app" style={{ textDecoration: "none", color: "#0f172a" }}>
          Dashboard
        </Link>
        <Link to="/app/session/new" style={{ textDecoration: "none", color: "#0f172a" }}>
          Start inspection
        </Link>
        <Link to="/app/sessions" style={{ textDecoration: "none", color: "#0f172a" }}>
          Past sessions
        </Link>
        <button
          onClick={logout}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

function Dashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>Dashboard</h2>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Wire your real inspection workspace here (homes, sessions, reports).
      </p>
    </div>
  );
}

function StartSession() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>Start inspection</h2>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Hook up your start flow here (select home, snapshot framework, etc.).
      </p>
    </div>
  );
}

function Sessions() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>Past sessions</h2>
      <p style={{ color: "#6b7280", marginTop: 8 }}>List or filter previous inspections here.</p>
    </div>
  );
}

export default function AppShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session/new" element={<StartSession />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </div>
    </div>
  );
}
