import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [session,  setSession]  = useState(undefined); // undefined = cargando
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    /* Verificar sesión actual */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });

    /* Escuchar cambios de sesión */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FDF6EE",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "1rem",
        color: "#6B4C38",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🍲</div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/admin" replace />;

  return children;
}