import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home           from "./pages/Home";
import AdminLogin     from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ResetPassword  from "./pages/admin/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp }     from "./context/AppContext";

function AppContent() {
  const { cargando } = useApp();

  if (cargando) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FDF6EE",
        fontFamily: "'DM Sans', sans-serif",
        flexDirection: "column",
        gap: "1rem",
        color: "#6B4C38",
      }}>
        <div style={{ fontSize: "3rem" }}>🍲</div>
        <p style={{ fontSize: "1rem", fontWeight: 600 }}>Cargando Ollas Comunes Perú...</p>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid #F0E4D0",
          borderTopColor: "#E8622A",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default function App() {
  return <AppContent />;
}
