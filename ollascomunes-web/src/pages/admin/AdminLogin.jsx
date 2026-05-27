import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/Admin.css";

const MAX_INTENTOS  = 3;
const BLOQUEO_SEG   = 30;
const HCAPTCHA_SITE = "21d84ff0-f7b4-4c68-87d8-c3c2713205a2";

/* ══════════════════════════════════
   COMPONENTE hCaptcha
══════════════════════════════════ */
const HCaptcha = memo(function HCaptcha({ onVerify, onExpire, resetKey }) {
  const containerRef = useRef(null);
  const widgetId     = useRef(null);

  const render = useCallback(() => {
    if (!window.hcaptcha || !containerRef.current) return;
    if (widgetId.current !== null) {
      try { window.hcaptcha.reset(widgetId.current); } catch {}
      return;
    }
    widgetId.current = window.hcaptcha.render(containerRef.current, {
      sitekey:           HCAPTCHA_SITE,
      callback:          onVerify,
      "expired-callback": onExpire,
      theme:             "light",
      size:              "normal",
    });
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (window.hcaptcha) { render(); return; }
    const existing = document.querySelector('script[src*="hcaptcha"]');
    if (existing) { setTimeout(render, 500); return; }
    const script  = document.createElement("script");
    script.src    = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async  = true;
    script.defer  = true;
    script.onload = () => render();
    document.head.appendChild(script);
  }, [render]);

  useEffect(() => {
    if (window.hcaptcha && widgetId.current !== null) {
      try { window.hcaptcha.reset(widgetId.current); } catch {}
    }
  }, [resetKey]);

  return <div ref={containerRef} className="hcaptcha-wrap" />;
});

/* ══════════════════════════════════
   MODAL RECUPERACIÓN DE CONTRASEÑA
══════════════════════════════════ */
function ModalRecuperacion({ onClose }) {
  const [correo,   setCorreo]   = useState("");
  const [enviado,  setEnviado]  = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!correo.trim())               { setError("Ingresa tu correo."); return; }
    if (!/\S+@\S+\.\S+/.test(correo)) { setError("Correo inválido."); return; }
    setCargando(true); setError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (err) throw err;
      setEnviado(true);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="recover-modal" onClick={e => e.stopPropagation()}>
        <button className="recover-close" onClick={onClose}>✕</button>
        {!enviado ? (
          <>
            <div className="recover-icon">🔑</div>
            <h3 className="recover-title">Recuperar contraseña</h3>
            <p className="recover-desc">
              Ingresa el correo del administrador y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleEnviar} className="recover-form">
              <div className="fg">
                <label htmlFor="recover-email">Correo electrónico</label>
                <input
                  id="recover-email" type="email"
                  placeholder="admin@ollascomunes.pe"
                  value={correo}
                  onChange={e => { setCorreo(e.target.value); setError(""); }}
                  required
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="btn-login" disabled={cargando}>
                {cargando ? "Enviando…" : "Enviar enlace de recuperación"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="recover-icon">✅</div>
            <h3 className="recover-title">¡Correo enviado!</h3>
            <p className="recover-desc">
              Revisa tu bandeja de entrada en <strong>{correo}</strong>. El enlace expira en 1 hora.
            </p>
            <p className="recover-nota">
              Si no lo ves, revisa la carpeta de spam o escríbenos a contacto@ollascomunes.pe
            </p>
            <button className="btn-login" onClick={onClose}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LOGIN PRINCIPAL
══════════════════════════════════ */
export default function AdminLogin() {
  const navigate = useNavigate();

  const [form,        setForm]     = useState({ email: "", password: "" });
  const [error,       setError]    = useState("");
  const [loading,     setLoading]  = useState(false);
  const [mostrarPass, setMostrarP] = useState(false);

  /* Rate limiting */
  const [intentos,  setIntentos]  = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [cuenta,    setCuenta]    = useState(0);
  const timerRef                  = useRef(null);

  /* hCaptcha */
  const [captchaToken, setCaptcha]  = useState("");
  const [captchaReset, setCapReset] = useState(0);

  /* Callbacks estables — useCallback evita re-render del captcha al escribir */
  const handleCaptchaVerify = useCallback((token) => setCaptcha(token), []);
  const handleCaptchaExpire = useCallback(() => setCaptcha(""), []);

  /* Modal recuperación */
  const [modalRecup, setModalR] = useState(false);

  /* Verificar sesión activa al cargar */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin/dashboard");
    });
  }, [navigate]);

  /* Contador de bloqueo */
  useEffect(() => {
    if (bloqueado) {
      setCuenta(BLOQUEO_SEG);
      timerRef.current = setInterval(() => {
        setCuenta(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setBloqueado(false);
            setIntentos(0);
            setError("");
            setCapReset(r => r + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [bloqueado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bloqueado) return;

    /* Solo verificar captcha si ya hubo al menos un intento fallido */
    if (intentos > 0 && !captchaToken) {
      setError("Por favor completa el captcha de seguridad.");
      return;
    }

    setError(""); setLoading(true);

    try {
      /* Autenticación real con Supabase */
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (data.session) navigate("/admin/dashboard");

    } catch (err) {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      setCapReset(r => r + 1);
      setCaptcha("");

      if (nuevosIntentos >= MAX_INTENTOS) {
        setBloqueado(true);
        setError(`Demasiados intentos fallidos. Espera ${BLOQUEO_SEG} segundos.`);
      } else {
        const restantes = MAX_INTENTOS - nuevosIntentos;
        setError(
          `Credenciales incorrectas. Te ${restantes === 1 ? "queda" : "quedan"} ${restantes} intento${restantes > 1 ? "s" : ""}.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputDeshabilitado = bloqueado || loading;

  return (
    <>
      {modalRecup && <ModalRecuperacion onClose={() => setModalR(false)} />}

      <div className="login-root">
        <div className="login-card">

          <div className="login-brand">
            <span className="login-logo">🍲</span>
            <h1>Panel Administrativo</h1>
            <p>Ollas Comunes Perú</p>
          </div>

          {/* Alerta de bloqueo */}
          {bloqueado && (
            <div className="login-bloqueo">
              <span className="bloqueo-icon">🔒</span>
              <div>
                <p className="bloqueo-titulo">Acceso bloqueado temporalmente</p>
                <p className="bloqueo-cuenta">Puedes intentarlo en <strong>{cuenta}s</strong></p>
              </div>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="fg">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email" type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={inputDeshabilitado}
                required autoComplete="email"
              />
            </div>

            <div className="fg">
              <label htmlFor="password">Contraseña</label>
              <div className="pass-wrap">
                <input
                  id="password"
                  type={mostrarPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  disabled={inputDeshabilitado}
                  required autoComplete="current-password"
                />
                <button type="button" className="pass-toggle"
                  onClick={() => setMostrarP(!mostrarPass)} tabIndex={-1}>
                  {mostrarPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Indicador de intentos */}
            {intentos > 0 && !bloqueado && (
              <div className="intentos-indicator">
                {Array.from({ length: MAX_INTENTOS }).map((_, i) => (
                  <span key={i} className={`intento-dot ${i < intentos ? "usado" : ""}`} />
                ))}
                <span className="intentos-texto">
                  {MAX_INTENTOS - intentos} intento{MAX_INTENTOS - intentos !== 1 ? "s" : ""} restante{MAX_INTENTOS - intentos !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {error && !bloqueado && <p className="login-error">{error}</p>}

            {/* hCaptcha — solo aparece después del primer intento fallido */}
            {intentos > 0 && (
              <div className="captcha-container">
                <HCaptcha
                  onVerify={handleCaptchaVerify}
                  onExpire={handleCaptchaExpire}
                  resetKey={captchaReset}
                />
                {!captchaToken && (
                  <p className="captcha-hint">Completa el captcha para continuar</p>
                )}
              </div>
            )}

            <button type="submit" className="btn-login"
              disabled={inputDeshabilitado || (intentos > 0 && !captchaToken)}>
              {loading ? "Verificando…" : bloqueado ? `Bloqueado (${cuenta}s)` : "Ingresar al panel"}
            </button>

            <button type="button" className="btn-forgot"
              onClick={() => setModalR(true)} disabled={bloqueado}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          <button className="btn-back" onClick={() => navigate("/")}>
            ← Volver a la página principal
          </button>
        </div>
      </div>
    </>
  );
}
