import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/Admin.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password,   setPassword]   = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [mostrar1,   setMostrar1]   = useState(false);
  const [mostrar2,   setMostrar2]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [listo,      setListo]      = useState(false);
  const [sesionOk,   setSesionOk]   = useState(false);
  const [verificando,setVerificando]= useState(true);

  /* Verificar que el link del correo sea válido */
  useEffect(() => {
    /* Leer errores del hash de la URL (ej: #error=access_denied) */
    const hash   = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const urlError = params.get("error");
    const urlErrorDesc = params.get("error_description");

    if (urlError) {
      const msg = urlError === "access_denied" || params.get("error_code") === "otp_expired"
        ? "El enlace de recuperación expiró. Por favor solicita uno nuevo desde el login."
        : urlErrorDesc?.replace(/\+/g, " ") || "El enlace es inválido. Solicita uno nuevo.";
      setError(msg);
      setVerificando(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSesionOk(true);
      } else {
        setError("El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.");
      }
      setVerificando(false);
    });

    /* Escuchar el evento de recuperación de contraseña */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setSesionOk(true); setError(""); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validar = () => {
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres."); return false;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden."); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validar()) return;
    setLoading(true);

    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setListo(true);
      /* Redirigir al login después de 3 segundos */
      setTimeout(() => navigate("/admin"), 3000);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /* Fuerza del password */
  const fuerzaPassword = () => {
    if (password.length === 0) return null;
    if (password.length < 6)  return { nivel: 1, label: "Muy débil",  color: "#EF5350" };
    if (password.length < 8)  return { nivel: 2, label: "Débil",      color: "#FFA726" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
                              return { nivel: 3, label: "Media",       color: "#FFC107" };
    return                           { nivel: 4, label: "Fuerte",      color: "#66BB6A" };
  };

  const fuerza = fuerzaPassword();

  return (
    <div className="login-root">
      <div className="login-card">

        <div className="login-brand">
          <span className="login-logo">🍲</span>
          <h1>Nueva contraseña</h1>
          <p>Ollas Comunes Perú — Panel Admin</p>
        </div>

        {verificando ? (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--texto-suave)" }}>
            <p>Verificando enlace...</p>
          </div>
        ) : listo ? (
          <div className="reset-exito">
            <span className="reset-exito-icon">✅</span>
            <h3>¡Contraseña actualizada!</h3>
            <p>Tu contraseña fue cambiada correctamente. Serás redirigido al login en unos segundos...</p>
            <button className="btn-login" onClick={() => navigate("/admin")}>
              Ir al login ahora
            </button>
          </div>
        ) : error && !sesionOk ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
            <p className="login-error" style={{ marginBottom: "1rem" }}>{error}</p>
            <button className="btn-login" onClick={() => navigate("/admin")}>
              Volver al login
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <p style={{ fontSize: ".88rem", color: "var(--texto-suave)", marginBottom: ".5rem" }}>
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>

            {/* Nueva contraseña */}
            <div className="fg">
              <label htmlFor="new-pass">Nueva contraseña</label>
              <div className="pass-wrap">
                <input
                  id="new-pass"
                  type={mostrar1 ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="pass-toggle"
                  onClick={() => setMostrar1(!mostrar1)} tabIndex={-1}>
                  {mostrar1 ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Indicador de fuerza */}
              {fuerza && (
                <div className="pass-fuerza">
                  <div className="pass-fuerza-bar">
                    {[1,2,3,4].map(n => (
                      <div key={n} className="pass-fuerza-seg"
                        style={{ background: n <= fuerza.nivel ? fuerza.color : "var(--crema-oscuro)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: ".72rem", color: fuerza.color, fontWeight: 700 }}>
                    {fuerza.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="fg">
              <label htmlFor="confirm-pass">Confirmar contraseña</label>
              <div className="pass-wrap">
                <input
                  id="confirm-pass"
                  type={mostrar2 ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  value={confirmar}
                  onChange={e => { setConfirmar(e.target.value); setError(""); }}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="pass-toggle"
                  onClick={() => setMostrar2(!mostrar2)} tabIndex={-1}>
                  {mostrar2 ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Indicador de coincidencia */}
              {confirmar.length > 0 && (
                <span style={{
                  fontSize: ".72rem", fontWeight: 700,
                  color: password === confirmar ? "#66BB6A" : "#EF5350"
                }}>
                  {password === confirmar ? "✓ Las contraseñas coinciden" : "✗ No coinciden"}
                </span>
              )}
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
