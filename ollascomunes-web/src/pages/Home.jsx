import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useApp } from "../context/AppContext";
import "../styles/Home.css";

/* Inicializar MercadoPago con Public Key de prueba */
initMercadoPago("APP_USR-a4bd76fd-fc69-4411-b569-452e9eabc192", { locale: "es-PE" });

/* Fix Leaflet default icon paths (Vite build issue) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* Ícono personalizado de olla para el mapa */
const ollaIcon = L.divIcon({
  html: `<div class="mapa-marker">🍲</div>`,
  className: "",
  iconSize:   [38, 38],
  iconAnchor: [19, 38],
  popupAnchor:[0, -38],
});

const TABS = [
  { id: "inicio",      label: "Inicio",        icon: "🏠" },
  { id: "ollas",       label: "Ollas Comunes",  icon: "🍲" },
  { id: "necesidades", label: "Necesidades",    icon: "📋" },
  { id: "noticias",    label: "Noticias",       icon: "📰" },
  { id: "donar",       label: "Donar",          icon: "💝" },
  { id: "contacto",    label: "Contacto",       icon: "📩" },
];

const REDES = [
  { key: "facebook",  src: "/icons/icon-facebook.png",  alt: "Facebook"  },
  { key: "instagram", src: "/icons/icon-instagram.png", alt: "Instagram" },
  { key: "tiktok",    src: "/icons/icon-tiktok.png",    alt: "TikTok"    },
  { key: "twitter",   src: "/icons/icon-twitter.png",   alt: "Twitter/X" },
];

function RedesSociales({ olla, size = "sm" }) {
  const activas = REDES.filter(r => olla[r.key] && olla[r.key].trim() !== "");
  if (activas.length === 0) return null;
  return (
    <div className={`redes-sociales redes-${size}`}>
      {activas.map(r => (
        <a key={r.key} href={olla[r.key]} target="_blank" rel="noopener noreferrer"
          className="red-social-link" title={r.alt} onClick={e => e.stopPropagation()}>
          <img src={r.src} alt={r.alt} className={`red-social-icon red-social-icon-${size}`} />
        </a>
      ))}
    </div>
  );
}

/* Componente auxiliar para centrar el mapa en una olla */
function MapaCentrar({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.flyTo(posicion, 15, { duration: 1 });
  }, [posicion, map]);
  return null;
}

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
export default function Home() {
  const navigate                      = useNavigate();
  const [tabActiva, setTabActiva]     = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { hero, ollas, donaciones, reuniones, noticias } = useApp();

  /* ── Toast de reunión próxima ── */
  const [toast, setToast]           = useState(null);
  const [toastVisible, setToastV]   = useState(false);
  const [badgeNot, setBadgeNot]     = useState(false);
  const [badgeCerrado, setBadgeC]   = useState(false);

  useEffect(() => {
    // Mostrar toast si hay reuniones en los próximos 7 días
    const hoy   = new Date();
    hoy.setHours(0,0,0,0);
    const enSiete = new Date(hoy); enSiete.setDate(hoy.getDate() + 7);
    const proxima = reuniones
      .filter(r => { const d = new Date(r.fecha + "T00:00:00"); return d >= hoy && d <= enSiete; })
      .sort((a,b) => new Date(a.fecha) - new Date(b.fecha))[0];

    if (proxima) {
      const fechaFmt = new Date(proxima.fecha + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
      setToast({ olla: proxima.olla, fecha: fechaFmt, hora: proxima.hora, direccion: proxima.direccion });
      setTimeout(() => setToastV(true), 1200);
    }

    // Badge de noticias nuevas hoy
    const hoyStr = new Date().toISOString().split("T")[0];
    const hayHoy = noticias.some(n => n.fecha === hoyStr);
    if (hayHoy) setBadgeNot(true);
  }, [reuniones, noticias]);

  const cambiarTab = (id) => {
    setTabActiva(id);
    setMenuAbierto(false);
    if (id === "noticias") setBadgeNot(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home-root">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">🍲</span>
          <span className="navbar-title">Ollas Comunes Perú</span>
        </div>
        <button className="navbar-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
          <span /><span /><span />
        </button>
        <ul className={`navbar-links ${menuAbierto ? "open" : ""}`}>
          {TABS.map(tab => (
            <li key={tab.id}>
              <button className={`nav-tab-btn ${tabActiva === tab.id ? "active" : ""}`} onClick={() => cambiarTab(tab.id)}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        <button className="btn-admin-access" onClick={() => navigate("/admin")}>Panel Admin</button>
      </nav>

      <main className="tab-main">
        {tabActiva === "inicio" && (
          <section className="hero-tab">
            <div className="hero-overlay" />
            <div className="hero-content">
              <span className="hero-badge">🇵🇪 Red solidaria del Perú</span>
              <h1 className="hero-title">{hero.titulo}</h1>
              <p className="hero-subtitle">{hero.subtitulo}</p>
              <div className="hero-actions">
                <button className="btn-primary"   onClick={() => cambiarTab("ollas")}>Ver ollas comunes</button>
                <button className="btn-secondary" onClick={() => cambiarTab("donar")}>Quiero donar</button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-num">{ollas.length}</span>
                  <span className="stat-label">Ollas registradas</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{ollas.reduce((a,o) => a+(Number(o.beneficiarios)||0),0).toLocaleString()}</span>
                  <span className="stat-label">Beneficiarios</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{[...new Set(ollas.map(o=>o.distrito))].length}</span>
                  <span className="stat-label">Distritos</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {tabActiva === "ollas"       && <TabOllas cambiarTab={cambiarTab} />}
        {tabActiva === "necesidades" && <TabNecesidades cambiarTab={cambiarTab} />}
        {tabActiva === "noticias"    && <TabNoticias />}
        {tabActiva === "donar"       && <TabDonar donaciones={donaciones} />}
        {tabActiva === "contacto"    && <TabContacto />}
      </main>

      {/* ── Toast reunión próxima ── */}
      {toast && toastVisible && (
        <div className="toast-reunion">
          <button className="toast-close" onClick={() => setToastV(false)}>✕</button>
          <p className="toast-titulo">📍 Próxima reunión</p>
          <p className="toast-olla">{toast.olla}</p>
          <p className="toast-dato">📅 {toast.fecha} · 🕐 {toast.hora} hrs</p>
          <p className="toast-motiv">¡Únete y marca la diferencia en tu comunidad!</p>
          <button className="toast-btn" onClick={() => { cambiarTab("ollas"); setToastV(false); }}>
            Ver en el mapa →
          </button>
        </div>
      )}

      {/* ── Badge noticias nuevas hoy ── */}
      {badgeNot && !badgeCerrado && (
        <div className="badge-noticias" onClick={() => { cambiarTab("noticias"); setBadgeC(true); }}>
          <span>📰 Hay noticias nuevas hoy</span>
          <button onClick={e => { e.stopPropagation(); setBadgeC(true); }}>✕</button>
        </div>
      )}

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <span>🍲 Ollas Comunes Perú</span>
            <p>Plataforma sin fines de lucro para visibilizar y apoyar ollas comunes en todo el Perú.</p>
          </div>
          <div className="footer-links">
            <span>Secciones</span>
            {TABS.map(tab => <button key={tab.id} onClick={() => cambiarTab(tab.id)}>{tab.label}</button>)}
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Ollas Comunes Perú · Proyecto académico UPN · Todos los derechos reservados</p>
          <button className="footer-admin-link" onClick={() => navigate("/admin")}>🔐 Acceso Admin</button>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════
   MODAL DE DONACIÓN — MercadoPago Checkout Pro
══════════════════════════════════ */
function ModalDonacion({ tipoInicial, ollaInicial, onClose }) {
  const { ollas, agregarDon, hero } = useApp();
  const FORM_VACIO = { nombre: "", numero: "", correo: "", olla: ollaInicial || "", monto: "", comentario: "" };
  const [tipo,         setTipo]       = useState(tipoInicial || "económica");
  const [paso,         setPaso]       = useState(1);
  const [form,         setForm]       = useState(FORM_VACIO);
  const [errors,       setErrors]     = useState({});
  const [preferenceId, setPrefId]     = useState(null);
  const [cargandoMP,   setCargandoMP] = useState(false);

  const esEco = tipo === "económica";
  const opcionesOlla = ["Ninguna (apoyo general)", ...ollas.map(o => o.nombre)];

  const f = (k) => v => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())   e.nombre = "Este campo es requerido";
    if (!esEco) {
      if (!form.numero.trim()) e.numero = "Requerido para coordinar la entrega";
      if (!form.correo.trim()) e.correo = "Requerido para contactarte";
      else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = "Correo inválido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const registrar = (estadoInicial = "en espera") => agregarDon({
    tipo,
    nombre:     form.nombre,
    numero:     form.numero,
    correo:     form.correo,
    olla:       form.olla || "Ninguna (apoyo general)",
    monto:      esEco ? form.monto : "",
    detalle:    esEco
      ? (form.monto ? `S/ ${form.monto}` : "Pago económico")
      : tipo === "insumos" ? form.comentario || "Donación de insumos"
      : form.comentario || "Oferta de capacitación",
    comentario: form.comentario,
    estado:     estadoInicial,
  });

  const crearPreferencia = async () => {
    setCargandoMP(true);
    try {
      /* Llama a la Edge Function de Vercel — el Access Token vive en el servidor */
      const res = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: `Donación a ${form.olla || "Ollas Comunes Perú"}`,
          monto:  parseFloat(form.monto) || 10,
          olla:   form.olla,
          nombre: form.nombre,
          correo: form.correo || "donante@ollascomunes.pe",
        }),
      });
      const data = await res.json();
      if (data.id) {
        setPrefId(data.id);
        registrar("en espera");
      } else {
        console.error("Error MP:", data.error);
        registrar("en espera");
        setPaso(3);
      }
    } catch (err) {
      console.error("Error creando preferencia:", err);
      registrar("en espera");
      setPaso(3);
    } finally {
      setCargandoMP(false);
    }
  };

  const siguientePaso = () => {
    if (!validar()) return;
    if (esEco) { setPaso(2); crearPreferencia(); }
    else       { registrar("en espera"); setPaso(3); }
  };

  return (
    <div className="modal-overlay" onClick={() => { setCargandoMP(false); setPrefId(null); onClose(); }}>
      <div className="modal-card modal-don" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => {
          setCargandoMP(false);
          setPrefId(null);
          onClose();
        }}>✕</button>

        {paso === 1 && (
          <>
            <div className="don-header">
              <h2 className="don-title">Hacer una donación</h2>
              <div className="don-tipo-tabs">
                {[
                  { id: "económica",    icon: "💵", label: "Económica"    },
                  { id: "insumos",      icon: "🛒", label: "Insumos"      },
                  { id: "capacitación", icon: "📚", label: "Capacitación" },
                ].map(t => (
                  <button key={t.id} className={`don-tipo-btn ${tipo === t.id ? "act" : ""}`}
                    onClick={() => { setTipo(t.id); setErrors({}); }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {!esEco && (
                <div className="don-aviso">
                  {tipo === "insumos"
                    ? "📦 Cuéntanos qué productos puedes donar — nos contactaremos para coordinar la entrega."
                    : "📅 Cuéntanos sobre el taller que ofrecerás — nos contactaremos para coordinar la fecha."
                  }
                </div>
              )}
            </div>
            <div className="don-form">
              <div className="don-grid">
                <div className="don-field">
                  <label>Nombre completo <span className="req">*</span></label>
                  <input type="text" value={form.nombre} onChange={e => f("nombre")(e.target.value)} placeholder="¿Cómo te llamas?" />
                  {errors.nombre && <span className="don-error">{errors.nombre}</span>}
                </div>
                <div className="don-field">
                  <label>Número de celular {esEco ? <span className="opt">(opcional)</span> : <span className="req">*</span>}</label>
                  <input type="tel" value={form.numero} onChange={e => f("numero")(e.target.value)} placeholder="+51 999 000 000" />
                  {errors.numero && <span className="don-error">{errors.numero}</span>}
                </div>
                <div className="don-field">
                  <label>Correo electrónico {esEco ? <span className="opt">(opcional)</span> : <span className="req">*</span>}</label>
                  <input type="email" value={form.correo} onChange={e => f("correo")(e.target.value)} placeholder="correo@ejemplo.com" />
                  {errors.correo && <span className="don-error">{errors.correo}</span>}
                </div>
                <div className="don-field">
                  <label>¿A qué olla quieres apoyar?</label>
                  <select value={form.olla} onChange={e => f("olla")(e.target.value)}>
                    {opcionesOlla.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {esEco && (
                  <div className="don-field">
                    <label>Monto a donar <span className="opt">(opcional)</span></label>
                    <div className="don-monto-wrap">
                      <span className="don-monto-prefix">S/</span>
                      <input type="number" min="1" step="0.01" value={form.monto}
                        onChange={e => f("monto")(e.target.value)} placeholder="0.00" className="don-monto-input" />
                    </div>
                  </div>
                )}
              </div>
              <div className="don-field don-field-full">
                <label>
                  {esEco ? "Comentario" : tipo === "insumos" ? "¿Qué productos puedes donar?" : "¿Qué taller o capacitación ofreces?"}
                  {" "}<span className="opt">(opcional)</span>
                </label>
                <textarea value={form.comentario} onChange={e => f("comentario")(e.target.value)} rows={3}
                  placeholder={esEco ? "¿Algún mensaje para la olla?" : tipo === "insumos" ? "Ej: arroz 10kg, aceite 5L..." : "Ej: Taller de nutrición básica, disponible fines de semana."} />
              </div>
              <button className="btn-primary don-btn-next" onClick={siguientePaso} disabled={cargandoMP}>
                {cargandoMP ? "Preparando pago..." : esEco ? "Continuar al pago →" : "Enviar solicitud →"}
              </button>
            </div>
          </>
        )}

        {paso === 2 && (
          <div className="don-pago-wrap">
            <div className="don-header">
              <h2 className="don-title">Elige cómo pagar</h2>
              <p className="don-sub">
                {form.monto ? `Monto: S/ ${form.monto}` : "Donación solidaria"}
                {form.olla && form.olla !== "Ninguna (apoyo general)" ? ` · Para: ${form.olla}` : ""}
              </p>
            </div>

            <div className="don-pago-opciones">
              {/* MercadoPago — tarjeta + Yape + Plin */}
              <div className="don-mp-wrap">
                <p className="don-mp-label">💳 Tarjeta, Yape o Plin — procesado por MercadoPago</p>
                {preferenceId ? (
                  <Wallet
                    initialization={{ preferenceId, redirectMode: "modal" }}
                    customization={{ texts: { valueProp: "smart_option" } }}
                    onSubmit={() => setPaso(3)}
                    onError={(err) => console.error("MP error:", err)}
                  />
                ) : (
                  <div className="don-mp-loading">
                    <div className="don-mp-spinner" />
                    <span>Preparando checkout seguro...</span>
                  </div>
                )}
              </div>

              {/* Yape manual con QR del dashboard */}
              {hero.yapeQR && (
                <>
                  <div className="don-separador"><span>o escanea el QR de Yape</span></div>
                  <div className="don-qr-box">
                    <img src={hero.yapeQR} alt="QR Yape" className="don-qr-real" />
                    <p className="don-qr-nota">Escanea desde tu app de Yape y luego cierra esta ventana.</p>
                    <button className="btn-primary" style={{ marginTop: "0.8rem", width: "100%" }}
                      onClick={() => setPaso(3)}>
                      Ya pagué con Yape →
                    </button>
                  </div>
                </>
              )}
            </div>

            <button className="btn-sm-outline don-btn-back" onClick={() => { setPaso(1); setPrefId(null); }}>
              ← Volver al formulario
            </button>
          </div>
        )}

        {paso === 3 && (
          <div className="don-gracias">
            <span className="don-gracias-ico">{esEco ? "🎉" : tipo === "insumos" ? "📦" : "📚"}</span>
            <h2 className="don-gracias-titulo">{esEco ? "¡Gracias por tu apoyo!" : "¡Recibimos tu solicitud!"}</h2>
            <p className="don-gracias-msg">
              {esEco
                ? "Tu donación ha sido registrada. Cada sol ayuda a que más familias reciban una comida caliente cada día."
                : "Nos contactaremos contigo pronto para coordinar todos los detalles. ¡Gracias por sumarte a esta causa!"
              }
            </p>
            {form.olla && form.olla !== "Ninguna (apoyo general)" && (
              <div className="don-gracias-olla">Tu apoyo irá a: <strong>{form.olla}</strong></div>
            )}
            <button className="btn-primary" style={{ marginTop: "1.2rem" }} onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
/*══════════════════════════════════
   TAB: OLLAS COMUNES — con mapa Leaflet
══════════════════════════════════ */
function TabOllas({ cambiarTab }) {
  const { ollas, reuniones }            = useApp();
  const [seleccionada, setSeleccionada] = useState(null);
  const [donModal, setDonModal]         = useState(null);
  const [filtro, setFiltro]             = useState("");
  const [centroMapa, setCentroMapa]     = useState(null);

  const distritos = [...new Set(ollas.map(o => o.distrito))].sort();
  const ollasFilt = filtro ? ollas.filter(o => o.distrito === filtro || o.nombre === filtro) : ollas;

  /* Reuniones activas con coordenadas */
  const reunionesConCoords = reuniones.filter(r => r.lat && r.lng);

  /* Filtrar reuniones por olla seleccionada */
  const reunionesFilt = filtro
    ? reunionesConCoords.filter(r => r.olla === filtro || ollas.find(o => o.nombre === r.olla && o.distrito === filtro))
    : reunionesConCoords;

  const handleFiltro = (val) => {
    setFiltro(val);
    /* Si filtramos por olla concreta, centra el mapa en su reunión */
    if (val) {
      const r = reunionesConCoords.find(r => r.olla === val);
      if (r) setCentroMapa([r.lat, r.lng]);
    } else {
      setCentroMapa(null);
    }
  };

  const formatFecha = (f) => f ? new Date(f + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }) : "—";

  return (
    <section className="tab-section">
      <div className="section-header">
        <h2>Ollas Comunes registradas</h2>
        <p>Encuentra una olla cercana a ti y conoce cómo puedes apoyar</p>
      </div>

      {/* ── MAPA LEAFLET ── */}
      <div className="mapa-wrapper">
        <div className="map-filter map-filter-top">
          <label htmlFor="dist-sel">Filtrar por olla o distrito:</label>
          <select id="dist-sel" value={filtro} onChange={e => handleFiltro(e.target.value)}>
            <option value="">Todas las ollas</option>
            <optgroup label="Por olla">
              {ollas.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
            </optgroup>
            <optgroup label="Por distrito">
              {distritos.map(d => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          </select>
        </div>

        {reunionesConCoords.length > 0 ? (
          <MapContainer
            center={[-12.05, -77.03]}
            zoom={11}
            style={{ height: "380px", width: "100%", borderRadius: "var(--radio)", zIndex: 1 }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {centroMapa && <MapaCentrar posicion={centroMapa} />}
            {reunionesFilt.map(r => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={ollaIcon}>
                <Popup>
                  <div className="mapa-popup">
                    <strong>🍲 {r.olla}</strong>
                    <p>📍 {r.direccion}</p>
                    <p>📅 {formatFecha(r.fecha)}</p>
                    <p>🕐 {r.hora} hrs</p>
                    {r.notas && <p>📝 {r.notas}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="map-placeholder">
            <div className="map-inner">
              <span className="map-icon">🗺️</span>
              <p>Mapa interactivo</p>
              <small>Las reuniones aparecerán aquí cuando el administrador las registre</small>
            </div>
          </div>
        )}
      </div>

      {/* ── GRID DE CARDS ── */}
      {ollasFilt.length === 0
        ? <p className="pub-empty">No hay ollas{filtro ? ` en "${filtro}"` : ""}.</p>
        : (
          <div className="ollas-grid">
            {ollasFilt.map(o => (
              <OllaCard key={o.id} olla={o} onVer={() => setSeleccionada(o)} />
            ))}
          </div>
        )
      }

      {seleccionada && (
        <OllaModal
          olla={seleccionada}
          onClose={() => setSeleccionada(null)}
          onDonar={() => { setDonModal({ tipo: "económica", olla: seleccionada.nombre }); setSeleccionada(null); }}
        />
      )}
      {donModal && (
        <ModalDonacion tipoInicial={donModal.tipo} ollaInicial={donModal.olla} onClose={() => setDonModal(null)} />
      )}
    </section>
  );
}

function OllaCard({ olla, onVer }) {
  return (
    <div className="olla-card">
      <div className="olla-card-img">
        {olla.imagen
          ? <img src={olla.imagen} alt={olla.nombre} />
          : <div className="olla-img-ph"><span>🍲</span><small>Imagen próximamente</small></div>
        }
      </div>
      <div className="olla-card-body">
        <span className={`olla-badge ${olla.estado === "activa" ? "badge-activa" : "badge-apoyo"}`}>{olla.estado}</span>
        <h3>{olla.nombre}</h3>
        <p className="olla-distrito">📍 {olla.distrito}</p>
        <p className="olla-benef">👥 {olla.beneficiarios} beneficiarios</p>
        {olla.necesidad_urgente && (
          <p className="olla-necesidad"><strong>Necesidad urgente:</strong> {olla.necesidad_urgente}</p>
        )}
        <button className="btn-outline" onClick={onVer}>Ver detalle →</button>
        <RedesSociales olla={olla} size="sm" />
      </div>
    </div>
  );
}

function OllaModal({ olla, onClose, onDonar }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-img">
          {olla.imagen
            ? <img src={olla.imagen} alt={olla.nombre} />
            : <div className="modal-img-ph"><span>🍲</span><p>Imagen no disponible aún</p></div>
          }
        </div>
        <div className="modal-body">
          <span className={`olla-badge ${olla.estado === "activa" ? "badge-activa" : "badge-apoyo"}`}>{olla.estado}</span>
          <div className="modal-titulo-row">
            <h2>{olla.nombre}</h2>
            <RedesSociales olla={olla} size="md" />
          </div>
          <p className="modal-distrito">📍 {olla.distrito}</p>
          <div className="modal-info-grid">
            <div className="modal-info-item">
              <span className="modal-info-label">Beneficiarios</span>
              <span className="modal-info-val">👥 {olla.beneficiarios} personas</span>
            </div>
            <div className="modal-info-item">
              <span className="modal-info-label">Necesidad urgente</span>
              <span className="modal-info-val">🛒 {olla.necesidad_urgente || "—"}</span>
            </div>
            <div className="modal-info-item">
              <span className="modal-info-label">Líder del proyecto</span>
              <span className="modal-info-val">👤 {olla.lider || "Por definir"}</span>
            </div>
            <div className="modal-info-item">
              <span className="modal-info-label">Contacto</span>
              <span className="modal-info-val">📞 {olla.contacto || "Por definir"}</span>
            </div>
          </div>
          {olla.descripcion && (
            <div className="modal-descripcion">
              <h4>Sobre esta olla</h4>
              <p>{olla.descripcion}</p>
            </div>
          )}
          <button className="btn-primary modal-btn-donar" onClick={onDonar}>💝 Apoyar esta olla</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   TAB: NECESIDADES
══════════════════════════════════ */
function TabNecesidades({ cambiarTab }) {
  const { necesidades } = useApp();
  const [donModal, setDonModal] = useState(null);
  const activas = necesidades.filter(n => !n.cubierta);

  const mapTipo = (t) => {
    const l = (t || "").toLowerCase();
    if (l.includes("econ")) return "económica";
    if (l.includes("insum")) return "insumos";
    return "capacitación";
  };

  return (
    <section className="tab-section tab-dark">
      <div className="section-header invert">
        <h2>Necesidades actuales</h2>
        <p>Publicadas en tiempo real por los administradores de cada olla</p>
      </div>
      {activas.length === 0
        ? <p className="pub-empty invert">No hay necesidades activas en este momento.</p>
        : (
          <div className="necesidades-list">
            {activas.map(n => (
              <div key={n.id} className={`necesidad-item prioridad-${n.prioridad}`}>
                <div className="necesidad-meta">
                  <span className={`tag-prioridad ${n.prioridad}`}>{n.prioridad === "alta" ? "🔴 Alta" : "🟡 Media"}</span>
                  <span className="tag-tipo">{n.tipo}</span>
                  <span className="necesidad-fecha">{n.fecha}</span>
                </div>
                <p className="necesidad-olla">{n.olla}</p>
                <p className="necesidad-desc">{n.descripcion}</p>
                <button className="btn-primary btn-sm"
                  onClick={() => setDonModal({ tipo: mapTipo(n.tipo), olla: n.olla })}>
                  Apoyar esta necesidad
                </button>
              </div>
            ))}
          </div>
        )
      }
      {donModal && (
        <ModalDonacion tipoInicial={donModal.tipo} ollaInicial={donModal.olla} onClose={() => setDonModal(null)} />
      )}
    </section>
  );
}

/* ══════════════════════════════════
   TAB: DONAR
══════════════════════════════════ */
function TabDonar({ donaciones }) {
  const [modal, setModal] = useState(null);
  const eco = donaciones.filter(d => d.tipo === "económica").length;
  const ins = donaciones.filter(d => d.tipo === "insumos").length;
  const cap = donaciones.filter(d => d.tipo === "capacitación").length;

  return (
    <section className="tab-section tab-cream">
      <div className="section-header">
        <h2>Haz tu donación</h2>
        <p>Elige cómo quieres apoyar — cada aporte marca la diferencia</p>
      </div>
      <div className="donate-grid">
        <div className="donate-card" onClick={() => setModal("económica")}>
          <span className="donate-icon">💵</span>
          <h3>Económica</h3>
          <p>Apoya con un monto económico directamente a la olla que elijas</p>
          <button className="btn-primary" onClick={e => { e.stopPropagation(); setModal("económica"); }}>Donar dinero</button>
        </div>
        <div className="donate-card featured" onClick={() => setModal("insumos")}>
          <span className="donate-icon">🛒</span>
          <h3>Insumos</h3>
          <p>Dona alimentos u otros productos según las necesidades actuales</p>
          <button className="btn-primary" onClick={e => { e.stopPropagation(); setModal("insumos"); }}>Donar insumos</button>
        </div>
        <div className="donate-card" onClick={() => setModal("capacitación")}>
          <span className="donate-icon">📚</span>
          <h3>Capacitación</h3>
          <p>Ofrece un taller o charla a las administradoras</p>
          <button className="btn-primary" onClick={e => { e.stopPropagation(); setModal("capacitación"); }}>Ofrecer capacitación</button>
        </div>
      </div>
      <div className="transparency-box">
        <h3>Transparencia de donaciones</h3>
        <div className="transparency-stats">
          <div><strong>{donaciones.length}</strong><span>Total donaciones</span></div>
          <div><strong>{eco}</strong><span>Económicas</span></div>
          <div><strong>{ins}</strong><span>Insumos</span></div>
          <div><strong>{cap}</strong><span>Capacitaciones</span></div>
        </div>
        <p className="transparency-note">Todas las donaciones quedan registradas y son trazables.</p>
      </div>
      {modal && <ModalDonacion tipoInicial={modal} ollaInicial="" onClose={() => setModal(null)} />}
    </section>
  );
}

/* ══════════════════════════════════
   TAB: NOTICIAS
   Grid de cards con imagen, descripción y link externo
══════════════════════════════════ */
function TabNoticias() {
  const { noticias } = useApp();

  /* Extraer ID de YouTube para miniatura automática */
  const ytThumb = (link) => {
    if (!link) return null;
    const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const getImagen = (n) => {
    if (n.imagen) return n.imagen;
    const yt = ytThumb(n.link);
    if (yt) return yt;
    return null;
  };

  const getRedIcon = (link) => {
    if (!link) return null;
    if (link.includes("youtube") || link.includes("youtu.be")) return "▶️ YouTube";
    if (link.includes("facebook"))  return "📘 Facebook";
    if (link.includes("instagram")) return "📸 Instagram";
    if (link.includes("tiktok"))    return "🎵 TikTok";
    if (link.includes("twitter") || link.includes("x.com")) return "🐦 Twitter/X";
    return "🔗 Ver publicación";
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h2>Noticias y actividades</h2>
        <p>Lo que están haciendo las ollas comunes — fotos, videos y más</p>
      </div>

      {noticias.length === 0 ? (
        <p className="pub-empty">No hay noticias publicadas todavía.</p>
      ) : (
        <div className="noticias-grid">
          {[...noticias].reverse().map(n => {
            const img = getImagen(n);
            const redLabel = getRedIcon(n.link);
            return (
              <div key={n.id} className="noticia-card">
                {/* Imagen o placeholder */}
                <div className="noticia-img">
                  {img
                    ? <img src={img} alt={n.descripcion} />
                    : (
                      <div className="noticia-img-ph">
                        <span>📰</span>
                        <small>Sin imagen</small>
                      </div>
                    )
                  }
                  {/* Badge de red social */}
                  {redLabel && (
                    <span className="noticia-red-badge">{redLabel}</span>
                  )}
                </div>

                {/* Cuerpo */}
                <div className="noticia-body">
                  {n.olla && <p className="noticia-olla">🍲 {n.olla}</p>}
                  <p className="noticia-desc">{n.descripcion}</p>
                  <div className="noticia-footer">
                    <span className="noticia-fecha">
                      {n.fecha ? new Date(n.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : ""}
                    </span>
                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="noticia-link-btn"
                      >
                        Ver publicación →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ══════════════════════════════════
   TAB: CONTACTO
══════════════════════════════════ */
function TabContacto() {
  const { agregarMensaje } = useApp();
  const [form, setForm]       = useState({ nombre: "", correo: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.correo || !form.mensaje) return;
    agregarMensaje(form);
    setEnviado(true);
    setForm({ nombre: "", correo: "", mensaje: "" });
    setTimeout(() => setEnviado(false), 4000);
  };

  return (
    <section className="tab-section">
      <div className="section-header">
        <h2>Contacto</h2>
        <p>¿Tienes una olla común y quieres registrarla? ¿Quieres ser voluntario?</p>
      </div>
      <div className="contact-grid">
        <div className="contact-info">
          <p>📧 contacto@ollascomunes.pe</p>
          <p>📱 +51 999 888 777</p>
          <p>📍 Lima, Perú</p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          {enviado && (
            <div className="contact-exito">
              ✓ Mensaje enviado. Nos contactaremos pronto.
            </div>
          )}
          <input
            type="text" placeholder="Tu nombre" required
            value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
          />
          <input
            type="email" placeholder="Tu correo" required
            value={form.correo} onChange={e => setForm({...form, correo: e.target.value})}
          />
          <textarea
            placeholder="Tu mensaje" rows={4} required
            value={form.mensaje} onChange={e => setForm({...form, mensaje: e.target.value})}
          />
          <button type="submit" className="btn-primary">Enviar mensaje</button>
        </form>
      </div>
    </section>
  );
}
