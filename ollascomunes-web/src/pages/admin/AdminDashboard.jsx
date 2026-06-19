import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useTema } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import "../../styles/Admin.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SIDEBAR = [
  { id: "resumen",     label: "Resumen",       icon: "📊" },
  { id: "ollas",       label: "Ollas comunes", icon: "🍲" },
  { id: "necesidades", label: "Necesidades",   icon: "📋" },
  { id: "donaciones",  label: "Donaciones",    icon: "💝" },
  { id: "reuniones",   label: "Reuniones",     icon: "📍" },
  { id: "contenido",   label: "Contenido web", icon: "✏️" },
  { id: "reportes",    label: "Reportes",      icon: "📈" },
  { id: "contacto",    label: "Contacto",      icon: "📩" },
];

/* ══════════════════════════════════
   MODAL DE CONFIRMACIÓN
══════════════════════════════════ */
function ConfirmModal({ mensaje, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">¿Estás seguro?</h3>
        <p className="confirm-msg">{mensaje}</p>
        <div className="confirm-actions">
          <button className="btn-cancel-confirm" onClick={onCancel}>Cancelar</button>
          <button className="btn-delete-confirm" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
export default function AdminDashboard() {
  const navigate               = useNavigate();
  const [tab, setTab]          = useState("resumen");
  const [sbOpen, setSb]        = useState(true);
  const [mobileMenu, setMobile]= useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { oscuro, toggleTema } = useTema();

  const goTab = (id) => { setTab(id); setMobile(false); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  return (
    <div className="db-root">
      {mobileMenu && <div className="mobile-overlay" onClick={() => setMobile(false)} />}

      {/* Modal confirmación de cierre de sesión */}
      {confirmLogout && (
        <div className="modal-backdrop" onClick={() => setConfirmLogout(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🚪</div>
            <h3 className="confirm-title">¿Cerrar sesión?</h3>
            <p className="confirm-msg">
              ¿Estás seguro que deseas salir del panel administrativo?
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel-confirm" onClick={() => setConfirmLogout(false)}>
                Cancelar
              </button>
              <button className="btn-delete-confirm" style={{ background: "#5C6BC0" }} onClick={handleLogout}>
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`db-sidebar ${sbOpen ? "sb-open" : "sb-mini"} ${mobileMenu ? "sb-mobile-visible" : ""}`}>
        <div className="sb-brand">
          <span className="sb-emoji">🍲</span>
          <div className="sb-text">
            <span className="sb-name">Ollas Comunes</span>
            <span className="sb-sub">Panel Admin</span>
          </div>
          <button className="sb-close-btn" onClick={() => setMobile(false)}>✕</button>
        </div>

        <nav className="sb-nav">
          {SIDEBAR.map(item => (
            <button
              key={item.id}
              className={`sb-item ${tab === item.id ? "sb-active" : ""}`}
              onClick={() => goTab(item.id)}
            >
              <span className="sb-icon">{item.icon}</span>
              <span className="sb-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sb-foot">
          <button className="sb-item sb-logout" onClick={() => setConfirmLogout(true)}>
            <span className="sb-icon">🚪</span>
            <span className="sb-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="db-main">
        <header className="db-topbar">
          <button className="topbar-toggle desktop-only" onClick={() => setSb(!sbOpen)}>☰</button>
          <button className="topbar-toggle mobile-only"  onClick={() => setMobile(true)}>☰</button>
          <h2 className="topbar-title">
            <span className="topbar-icon">{SIDEBAR.find(i => i.id === tab)?.icon}</span>
            {SIDEBAR.find(i => i.id === tab)?.label}
          </h2>
          {/* Switch tema — al costado izquierdo de Administrador AD */}
          <button
            className={`topbar-tema-switch ${oscuro ? "activo" : ""}`}
            onClick={toggleTema}
            aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={oscuro ? "Modo claro" : "Modo oscuro"}
          >
            <div className="topbar-tema-track">
              <div className="topbar-tema-thumb">{oscuro ? "🌙" : "☀️"}</div>
            </div>
          </button>

          <div className="topbar-user">
            <span className="topbar-username">Administrador</span>
            <div className="topbar-avatar">AD</div>
          </div>
        </header>

        <div className="db-content">
          {tab === "resumen"     && <SecResumen setTab={setTab} />}
          {tab === "ollas"       && <SecOllas />}
          {tab === "necesidades" && <SecNecesidades />}
          {tab === "donaciones"  && <SecDonaciones />}
          {tab === "reuniones"   && <SecReuniones />}
          {tab === "contenido"   && <SecContenido />}
          {tab === "reportes"    && <SecReportes />}
          {tab === "contacto"    && <SecContacto />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   RESUMEN
══════════════════════════════════ */
function SecResumen({ setTab }) {
  const { ollas, necesidades, donaciones } = useApp();
  const activas  = necesidades.filter(n => !n.cubierta);
  const urgentes = activas.filter(n => n.prioridad === "alta");

  const metricas = [
    { label: "Ollas registradas",   valor: ollas.length,        sub: "registradas",   color: "green" },
    { label: "Necesidades activas", valor: activas.length,      sub: `${urgentes.length} urgentes`, color: "amber" },
    { label: "Donaciones totales",  valor: donaciones.length,   sub: "registradas",   color: "blue"  },
    { label: "Beneficiarios",       valor: ollas.reduce((a,o) => a + (Number(o.beneficiarios)||0), 0).toLocaleString(), sub: "aprox.", color: "muted" },
  ];

  return (
    <div className="sec">
      <div className="metrics-grid">
        {metricas.map(m => (
          <div key={m.label} className="metric-card">
            <p className="metric-label">{m.label}</p>
            <p className="metric-val">{m.valor}</p>
            <p className={`metric-sub c-${m.color}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="row-2">
        <div className="card">
          <p className="card-title">Ollas registradas</p>
          {ollas.length === 0
            ? <p className="empty-msg">Sin ollas aún.</p>
            : ollas.slice(0, 5).map(o => (
                <div key={o.id} className="act-row">
                  <span className={`act-dot dot-${o.estado === "activa" ? "green" : "amber"}`} />
                  <span>{o.nombre} — {o.distrito}</span>
                </div>
              ))
          }
        </div>

        <div className="card">
          <p className="card-title">Accesos rápidos</p>
          <div className="quick-grid">
            <button className="quick-btn" onClick={() => setTab("ollas")}>+ Registrar olla</button>
            <button className="quick-btn" onClick={() => setTab("necesidades")}>Publicar necesidad</button>
            <button className="quick-btn" onClick={() => setTab("reportes")}>Ver reportes</button>
            <button className="quick-btn" onClick={() => setTab("donaciones")}>Ver donaciones</button>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Necesidades activas</p>
        {activas.length === 0
          ? <p className="empty-msg">Sin necesidades activas.</p>
          : activas.slice(0, 4).map(n => (
              <div key={n.id} className="list-row">
                <div className="list-col">
                  <span className="list-main">{n.descripcion}</span>
                  <span className="list-sub">{n.olla} · {n.tipo} · {n.fecha}</span>
                </div>
                <span className={`badge ${n.prioridad === "alta" ? "badge-red" : "badge-amber"}`}>
                  {n.prioridad}
                </span>
              </div>
            ))
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   OLLAS
══════════════════════════════════ */
function SecOllas() {
  const { ollas, agregarOlla, editarOlla, eliminarOlla } = useApp();

  const FORM_VACIO = { nombre:"", distrito:"", beneficiarios:"", contacto:"", lider:"", estado:"activa", descripcion:"", necesidad_urgente:"", imagen: null, facebook:"", instagram:"", tiktok:"", twitter:"" };
  const [editando, setEditando] = useState(null);
  const [form, setForm]         = useState(null);
  const [agregando, setAgreg]   = useState(false);
  const [formNew, setFormNew]   = useState(FORM_VACIO);
  const [confirm, setConfirm]   = useState(null);

  const abrirEditar = (o) => { setEditando(o.id); setForm({...o}); setAgreg(false); };
  const guardar     = ()  => { editarOlla(form); setEditando(null); setForm(null); };

  const pedirEliminar    = (o) => setConfirm({ id: o.id, nombre: o.nombre });
  const confirmarEliminar= ()  => { eliminarOlla(confirm.id); if(editando===confirm.id){setEditando(null);setForm(null);} setConfirm(null); };

  const agregar = () => {
    if (!formNew.nombre || !formNew.distrito) return;
    agregarOlla({ ...formNew, beneficiarios: Number(formNew.beneficiarios)||0 });
    setFormNew(FORM_VACIO);
    setAgreg(false);
  };

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar la olla "${confirm.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmarEliminar}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <p className="card-title m0">Ollas registradas ({ollas.length})</p>
          <button className="btn-sm-outline" onClick={() => { setAgreg(true); setEditando(null); setForm(null); }}>+ Nueva olla</button>
        </div>
        {ollas.length === 0 && <p className="empty-msg">No hay ollas registradas todavía.</p>}
        {ollas.map(o => (
          <div key={o.id} className="list-row">
            <div className="list-col">
              <span className="list-main">{o.nombre}</span>
              <span className="list-sub">📍 {o.distrito} · 👥 {o.beneficiarios}</span>
            </div>
            <div className="list-actions">
              <span className={`badge ${o.estado === "activa" ? "badge-green" : "badge-amber"}`}>{o.estado}</span>
              <button className="btn-mini" onClick={() => abrirEditar(o)}>Editar</button>
              <button className="btn-mini btn-mini-del" onClick={() => pedirEliminar(o)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* FORM AGREGAR */}
      {agregando && (
        <div className="card">
          <p className="card-title">Nueva olla común</p>
          <OllaForm form={formNew} setForm={setFormNew} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={() => setAgreg(false)}>Cancelar</button>
            <button className="btn-sm-primary" onClick={agregar}>Agregar olla</button>
          </div>
        </div>
      )}

      {/* FORM EDITAR */}
      {editando && form && (
        <div className="card">
          <p className="card-title">Editando — {form.nombre}</p>
          <OllaForm form={form} setForm={setForm} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={() => { setEditando(null); setForm(null); }}>Cancelar</button>
            <button className="btn-sm-primary" onClick={guardar}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OllaForm({ form, setForm }) {
  const f = (k) => v => setForm({ ...form, [k]: v });

  const handleImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo || !archivo.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, imagen: ev.target.result });
    reader.readAsDataURL(archivo);
  };

  const quitarImagen = () => setForm({ ...form, imagen: null });

  return (
    <>
      <div className="form-grid-2">
        <FormField label="Nombre"            value={form.nombre}            onChange={f("nombre")} />
        <FormField label="Distrito"          value={form.distrito}          onChange={f("distrito")} />
        <FormField label="Beneficiarios"     value={form.beneficiarios}     onChange={f("beneficiarios")} type="number" />
        <FormField label="Contacto"          value={form.contacto}          onChange={f("contacto")} />
        <FormField label="Líder"             value={form.lider}             onChange={f("lider")} />
        <FormField label="Necesidad urgente" value={form.necesidad_urgente} onChange={f("necesidad_urgente")} />
      </div>

      <div className="form-field">
        <label className="form-label">Estado</label>
        <select className="form-input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
          <option value="activa">Activa</option>
          <option value="necesita apoyo">Necesita apoyo</option>
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">Descripción</label>
        <textarea className="form-textarea" rows={3} value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })} />
      </div>

      {/* ── Redes sociales ── */}
      <div className="form-section-label">Redes sociales <span className="opt">(solo completa las que tenga la olla)</span></div>
      <div className="form-grid-2">
        <FormField label="Facebook"   value={form.facebook   || ""} onChange={f("facebook")}   placeholder="https://facebook.com/..." />
        <FormField label="Instagram"  value={form.instagram  || ""} onChange={f("instagram")}  placeholder="https://instagram.com/..." />
        <FormField label="TikTok"     value={form.tiktok     || ""} onChange={f("tiktok")}     placeholder="https://tiktok.com/@..." />
        <FormField label="Twitter / X" value={form.twitter   || ""} onChange={f("twitter")}    placeholder="https://twitter.com/..." />
      </div>

      {/* ── Imagen ── */}
      <div className="form-field">
        <label className="form-label">Imagen de la olla</label>
        {form.imagen ? (
          <div className="img-preview-wrap">
            <img src={form.imagen} alt="Preview" className="img-preview" />
            <div className="img-preview-actions">
              <span className="img-preview-ok">✓ Imagen cargada</span>
              <label className="btn-mini img-change-btn">
                Cambiar
                <input type="file" accept="image/*" onChange={handleImagen} style={{ display: "none" }} />
              </label>
              <button className="btn-mini btn-mini-del" type="button" onClick={quitarImagen}>Quitar</button>
            </div>
          </div>
        ) : (
          <label className="upload-zone upload-zone-active">
            <span className="upload-icon">📷</span>
            <span className="upload-text">Haz clic para seleccionar una imagen</span>
            <span className="upload-hint">JPG, PNG, WEBP — máx. recomendado 2MB</span>
            <input type="file" accept="image/*" onChange={handleImagen} style={{ display: "none" }} />
          </label>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════
   NECESIDADES
══════════════════════════════════ */
function SecNecesidades() {
  const { necesidades, agregarNec, editarNec, cubrirNec, eliminarNec } = useApp();

  const FORM_VACIO = { olla:"", tipo:"Insumos", descripcion:"", prioridad:"media", fecha:"" };

  const [confirm,   setConfirm]  = useState(null);
  const [agregando, setAgreg]    = useState(false);
  const [formNew,   setFormNew]  = useState(FORM_VACIO);
  const [editando,  setEditando] = useState(null);   // id de la necesidad en edición
  const [formEdit,  setFormEdit] = useState(null);   // copia del objeto a editar

  /* ── Agregar ── */
  const agregar = () => {
    if (!formNew.olla || !formNew.descripcion) return;
    agregarNec({ ...formNew, fecha: formNew.fecha || new Date().toLocaleDateString("es-PE") });
    setFormNew(FORM_VACIO);
    setAgreg(false);
  };

  /* ── Editar ── */
  const abrirEditar = (n) => {
    setEditando(n.id);
    setFormEdit({ ...n });
    setAgreg(false);
  };
  const guardarEdicion = () => {
    editarNec(formEdit);
    setEditando(null);
    setFormEdit(null);
  };
  const cancelarEdicion = () => { setEditando(null); setFormEdit(null); };

  /* ── Eliminar ── */
  const pedir     = (n) => setConfirm({ id: n.id, desc: n.descripcion });
  const confirmar = ()  => {
    eliminarNec(confirm.id);
    if (editando === confirm.id) cancelarEdicion();
    setConfirm(null);
  };

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar la necesidad "${confirm.desc}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmar}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Listado ── */}
      <div className="card">
        <div className="card-header">
          <p className="card-title m0">
            Necesidades ({necesidades.filter(n => !n.cubierta).length} activas · {necesidades.filter(n => n.cubierta).length} cubiertas)
          </p>
          <button className="btn-sm-outline" onClick={() => { setAgreg(true); cancelarEdicion(); }}>
            + Publicar necesidad
          </button>
        </div>

        {necesidades.length === 0 && <p className="empty-msg">Sin necesidades registradas.</p>}

        {necesidades.map(n => (
          <div key={n.id} className={`list-row ${n.cubierta ? "row-muted" : ""}`}>
            <div className="list-col">
              <span className="list-main">{n.descripcion}</span>
              <span className="list-sub">{n.olla} · {n.tipo} · {n.fecha}</span>
            </div>
            <div className="list-actions flex-wrap">
              <span className={`badge ${n.prioridad === "alta" ? "badge-red" : "badge-amber"}`}>
                {n.prioridad}
              </span>
              {n.cubierta ? (
                <span className="badge badge-green">Cubierta</span>
              ) : (
                <>
                  <button className="btn-mini" onClick={() => abrirEditar(n)}>Editar</button>
                  <button className="btn-mini" onClick={() => cubrirNec(n.id)}>Cubrir</button>
                  <button className="btn-mini btn-mini-del" onClick={() => pedir(n)}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Formulario EDITAR ── */}
      {editando && formEdit && (
        <div className="card">
          <p className="card-title">Editando necesidad</p>
          <NecForm form={formEdit} setForm={setFormEdit} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={cancelarEdicion}>Cancelar</button>
            <button className="btn-sm-primary" onClick={guardarEdicion}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* ── Formulario AGREGAR ── */}
      {agregando && (
        <div className="card">
          <p className="card-title">Nueva necesidad</p>
          <NecForm form={formNew} setForm={setFormNew} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={() => { setAgreg(false); setFormNew(FORM_VACIO); }}>Cancelar</button>
            <button className="btn-sm-primary" onClick={agregar}>Publicar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Formulario reutilizable para necesidad */
function NecForm({ form, setForm }) {
  const f = (k) => (v) => setForm({ ...form, [k]: v });
  return (
    <>
      <div className="form-grid-2">
        <FormField label="Olla / Comedor" value={form.olla}  onChange={f("olla")} />
        <div className="form-field">
          <label className="form-label">Tipo</label>
          <select className="form-input" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option>Insumos</option>
            <option>Económica</option>
            <option>Capacitación</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Prioridad</label>
          <select className="form-input" value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
          </select>
        </div>
        <FormField label="Fecha" value={form.fecha} onChange={f("fecha")} type="date" />
      </div>
      <div className="form-field">
        <label className="form-label">Descripción</label>
        <textarea
          className="form-textarea"
          rows={2}
          value={form.descripcion}
          onChange={e => setForm({...form, descripcion: e.target.value})}
        />
      </div>
    </>
  );
}

/* ══════════════════════════════════
   DONACIONES
══════════════════════════════════ */
const ESTADOS_DON = ["en espera", "en proceso", "aprobada", "rechazada"];

function SecDonaciones() {
  const { donaciones, editarEstadoDon, eliminarDon } = useApp();
  const [confirm,   setConfirm]   = useState(null);
  const [detalle,   setDetalle]   = useState(null); // donación expandida

  const pedir     = (d) => setConfirm({ id: d.id, desc: d.detalle || d.nombre });
  const confirmar = ()  => { eliminarDon(confirm.id); setConfirm(null); if (detalle?.id === confirm.id) setDetalle(null); };

  const eco      = donaciones.filter(d => d.tipo === "económica").length;
  const ins      = donaciones.filter(d => d.tipo === "insumos").length;
  const cap      = donaciones.filter(d => d.tipo === "capacitación").length;
  const espera   = donaciones.filter(d => d.estado === "en espera").length;

  const badgeEstado = (e) => {
    if (e === "aprobada")   return "badge-green";
    if (e === "rechazada")  return "badge-red";
    if (e === "en proceso") return "badge-amber";
    return "badge-espera";
  };

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar la donación de "${confirm.desc}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmar}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Económicas</p>
          <p className="metric-val sm">{eco}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Insumos</p>
          <p className="metric-val sm">{ins}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Capacitaciones</p>
          <p className="metric-val sm">{cap}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">En espera</p>
          <p className="metric-val sm c-amber">{espera}</p>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="card-header">
          <p className="card-title m0">Historial de donaciones ({donaciones.length})</p>
          <div className="flex-gap">
            <button className="btn-mini" onClick={() => {
              import("xlsx").then(XLSX => {
                const datos = donaciones.map(d => ({
                  "Nombre": d.nombre||"—", "Tipo": d.tipo,
                  "Monto (S/)": d.tipo==="económica" ? (d.monto||"—") : "N/A",
                  "Detalle": d.detalle||"—", "Olla": d.olla,
                  "Celular": d.numero||"—", "Correo": d.correo||"—",
                  "Comentario": d.comentario||"—", "Estado": d.estado, "Fecha": d.fecha,
                }));
                const ws = XLSX.utils.json_to_sheet(datos);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Donaciones");
                XLSX.writeFile(wb, `donaciones_${new Date().toISOString().split("T")[0]}.xlsx`);
              });
            }}>⬇ Excel</button>
            <button className="btn-mini" onClick={() => {
              const doc = new jsPDF();
              doc.setFontSize(14);
              doc.text("Donaciones — Ollas Comunes Perú", 14, 18);
              doc.setFontSize(9);
              doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, 14, 25);
              const cols = ["Nombre","Tipo","Monto","Detalle","Olla","Estado","Fecha"];
              const rows = donaciones.map(d => [
                d.nombre||"—", d.tipo,
                d.tipo==="económica" ? `S/ ${d.monto||"—"}` : "N/A",
                (d.detalle||"—").slice(0,28), (d.olla||"—").slice(0,20), d.estado, d.fecha,
              ]);
              autoTable(doc, { head:[cols], body:rows, startY:30, styles:{fontSize:7}, headStyles:{fillColor:[232,98,42]} });
              doc.save(`donaciones_${new Date().toISOString().split("T")[0]}.pdf`);
            }}>⬇ PDF</button>
          </div>
        </div>

        {donaciones.length === 0 && <p className="empty-msg">Sin donaciones registradas.</p>}

        {donaciones.map(d => (
          <div key={d.id} className="don-admin-row">

            {/* Fila principal */}
            <div className="list-row" style={{ borderBottom: detalle?.id === d.id ? "none" : undefined }}>
              <div className="list-col">
                <span className="list-main">{d.nombre || "Donante anónimo"}</span>
                <span className="list-sub">
                  {d.tipo} · {d.olla} · {d.fecha}
                  {d.numero ? ` · 📱 ${d.numero}` : ""}
                  {d.correo ? ` · ✉️ ${d.correo}` : ""}
                </span>
              </div>
              <div className="list-actions flex-wrap">
                {/* Badge tipo */}
                <span className={`badge badge-tipo-${d.tipo === "económica" ? "eco" : d.tipo === "insumos" ? "ins" : "cap"}`}>
                  {d.tipo}
                </span>

                {/* Badge estado */}
                <span className={`badge ${badgeEstado(d.estado)}`}>
                  {d.estado}
                </span>

                {/* Selector de estado */}
                <select
                  className="select-estado"
                  value={d.estado}
                  onChange={e => editarEstadoDon(d.id, e.target.value)}
                >
                  {ESTADOS_DON.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Ver detalle / Eliminar */}
                <button
                  className="btn-mini"
                  onClick={() => setDetalle(detalle?.id === d.id ? null : d)}
                >
                  {detalle?.id === d.id ? "Cerrar" : "Detalle"}
                </button>
                <button className="btn-mini btn-mini-del" onClick={() => pedir(d)}>
                  Eliminar
                </button>
              </div>
            </div>

            {/* Panel de detalle expandible */}
            {detalle?.id === d.id && (
              <div className="don-detalle-panel">
                <div className="don-detalle-grid">
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Nombre</span>
                    <span className="don-detalle-val">{d.nombre || "—"}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Celular</span>
                    <span className="don-detalle-val">{d.numero || "—"}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Correo</span>
                    <span className="don-detalle-val">{d.correo || "—"}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Olla destino</span>
                    <span className="don-detalle-val">{d.olla}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Tipo de donación</span>
                    <span className="don-detalle-val">{d.tipo}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Fecha</span>
                    <span className="don-detalle-val">{d.fecha}</span>
                  </div>
                </div>
                {d.comentario && (
                  <div className="don-detalle-comentario">
                    <span className="don-detalle-label">Comentario / Detalle</span>
                    <p>{d.comentario}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   REUNIONES
══════════════════════════════════ */
function SecReuniones() {
  const { ollas, reuniones, agregarReunion, editarReunion, eliminarReunion } = useApp();

  const FORM_VACIO = { olla: "", direccion: "", lat: null, lng: null, fecha: "", hora: "", notas: "" };
  const [confirm,     setConfirm]  = useState(null);
  const [agregando,   setAgreg]    = useState(false);
  const [editando,    setEditando] = useState(null);
  const [formNew,     setFormNew]  = useState(FORM_VACIO);
  const [formEdit,    setFormEdit] = useState(null);
  const [sugerencias, setSugs]     = useState([]);
  const [sugsEdit,    setSugsE]    = useState([]);

  const buscarDireccion = async (texto, esEdit = false) => {
    if (!texto || texto.length < 4) { esEdit ? setSugsE([]) : setSugs([]); return; }
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto + ", Lima, Peru")}&format=json&limit=5`, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      esEdit ? setSugsE(data) : setSugs(data);
    } catch { esEdit ? setSugsE([]) : setSugs([]); }
  };

  const elegirSug = (s, esEdit = false) => {
    const val = { direccion: s.display_name, lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    if (esEdit) { setFormEdit(p => ({ ...p, ...val })); setSugsE([]); }
    else        { setFormNew(p  => ({ ...p, ...val })); setSugs([]); }
  };

  const agregar = () => {
    if (!formNew.olla || !formNew.direccion || !formNew.fecha || !formNew.hora) return;
    agregarReunion(formNew);
    setFormNew(FORM_VACIO); setAgreg(false); setSugs([]);
  };

  const guardar = () => {
    editarReunion(formEdit);
    setEditando(null); setFormEdit(null); setSugsE([]);
  };

  const pedir     = (r) => setConfirm({ id: r.id, desc: `${r.olla} — ${r.fecha}` });
  const confirmar = ()  => { eliminarReunion(confirm.id); setConfirm(null); };

  const fmt = (f) => f ? new Date(f + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }) : "—";

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar la reunión "${confirm.desc}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmar}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <p className="card-title m0">Reuniones programadas ({reuniones.length})</p>
          <button className="btn-sm-outline" onClick={() => { setAgreg(true); setEditando(null); setSugs([]); }}>
            + Nueva reunión
          </button>
        </div>

        {reuniones.length === 0 && <p className="empty-msg">No hay reuniones programadas.</p>}

        {reuniones.map(r => (
          <div key={r.id} className="list-row">
            <div className="list-col">
              <span className="list-main">{r.olla}</span>
              <span className="list-sub">📍 {r.direccion} &nbsp;·&nbsp; 📅 {fmt(r.fecha)} &nbsp;·&nbsp; 🕐 {r.hora}{r.notas ? ` · ${r.notas}` : ""}</span>
            </div>
            <div className="list-actions">
              <button className="btn-mini" onClick={() => { setEditando(r.id); setFormEdit({ ...r }); setAgreg(false); setSugsE([]); }}>Editar</button>
              <button className="btn-mini btn-mini-del" onClick={() => pedir(r)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {agregando && (
        <div className="card">
          <p className="card-title">Nueva reunión</p>
          <ReunionForm form={formNew} setForm={setFormNew} ollas={ollas} sugerencias={sugerencias} onBuscar={v => buscarDireccion(v, false)} onElegir={s => elegirSug(s, false)} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={() => { setAgreg(false); setFormNew(FORM_VACIO); setSugs([]); }}>Cancelar</button>
            <button className="btn-sm-primary" onClick={agregar}>Guardar reunión</button>
          </div>
        </div>
      )}

      {editando && formEdit && (
        <div className="card">
          <p className="card-title">Editando reunión — {formEdit.olla}</p>
          <ReunionForm form={formEdit} setForm={setFormEdit} ollas={ollas} sugerencias={sugsEdit} onBuscar={v => buscarDireccion(v, true)} onElegir={s => elegirSug(s, true)} />
          <div className="form-actions">
            <button className="btn-sm-outline" onClick={() => { setEditando(null); setFormEdit(null); setSugsE([]); }}>Cancelar</button>
            <button className="btn-sm-primary" onClick={guardar}>Guardar cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReunionForm({ form, setForm, ollas, sugerencias, onBuscar, onElegir }) {
  return (
    <>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="form-label">Olla común <span style={{ color: "var(--naranja)" }}>*</span></label>
          <select className="form-input" value={form.olla} onChange={e => setForm({ ...form, olla: e.target.value })}>
            <option value="">Seleccionar olla...</option>
            {ollas.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
          </select>
        </div>

        <div className="form-field" style={{ position: "relative" }}>
          <label className="form-label">Dirección <span style={{ color: "var(--naranja)" }}>*</span></label>
          <input
            className="form-input"
            value={form.direccion}
            onChange={e => { setForm({ ...form, direccion: e.target.value, lat: null, lng: null }); onBuscar(e.target.value); }}
            placeholder="Escribe la dirección..."
            autoComplete="off"
          />
          {sugerencias.length > 0 && (
            <div className="dir-sugerencias">
              {sugerencias.map((s, i) => (
                <button key={i} className="dir-sug-item" type="button" onClick={() => onElegir(s)}>
                  📍 {s.display_name}
                </button>
              ))}
            </div>
          )}
          {form.lat && <p className="dir-coords">✓ Ubicación encontrada</p>}
        </div>

        <FormField label="Fecha" value={form.fecha} onChange={v => setForm({ ...form, fecha: v })} type="date" />
        <FormField label="Hora"  value={form.hora}  onChange={v => setForm({ ...form, hora: v })}  type="time" />
      </div>
      <div className="form-field">
        <label className="form-label">Notas <span style={{ fontSize: ".72rem", color: "var(--texto-suave)" }}>(opcional)</span></label>
        <textarea className="form-textarea" rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Ej: Traer utensilios, entrada por la calle lateral..." />
      </div>
    </>
  );
}

/* ══════════════════════════════════
   CONTENIDO WEB
══════════════════════════════════ */
function SecContenido() {
  const { hero, actualizarHero, noticias, agregarNoticia, editarNoticia, eliminarNoticia, ollas } = useApp();

  const FORM_NOT_VACIO = { descripcion: "", imagen: null, link: "", olla: "", fecha: new Date().toISOString().split("T")[0] };

  const [heroLocal, setHeroLocal] = useState({ ...hero });
  const [guardado,  setGuardado]  = useState(false);
  const [confirm,   setConfirm]   = useState(null);
  const [agregando, setAgreg]     = useState(false);
  const [formN,     setFormN]     = useState(FORM_NOT_VACIO);
  const [editandoN, setEditandoN] = useState(null);
  const [formEdit,  setFormEdit]  = useState(null);

  const guardarHero = () => {
    actualizarHero(heroLocal);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  /* QR Yape */
  const handleQR = (e) => {
    const archivo = e.target.files[0];
    if (!archivo || !archivo.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const n = { ...heroLocal, yapeQR: ev.target.result }; setHeroLocal(n); actualizarHero(n); };
    reader.readAsDataURL(archivo);
  };
  const quitarQR = () => { const n = { ...heroLocal, yapeQR: null }; setHeroLocal(n); actualizarHero(n); };

  /* Imagen de noticia */
  const handleImgNot = (e, esEdit = false) => {
    const archivo = e.target.files[0];
    if (!archivo || !archivo.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (esEdit) setFormEdit(p => ({ ...p, imagen: ev.target.result }));
      else        setFormN(p   => ({ ...p, imagen: ev.target.result }));
    };
    reader.readAsDataURL(archivo);
  };

  const agregar = () => {
    if (!formN.descripcion) return;
    agregarNoticia(formN);
    setFormN(FORM_NOT_VACIO);
    setAgreg(false);
  };

  const abrirEditN = (n) => { setEditandoN(n.id); setFormEdit({ ...n }); };
  const guardarN   = ()  => { editarNoticia(formEdit); setEditandoN(null); setFormEdit(null); };
  const pedir      = (n) => setConfirm({ id: n.id, desc: n.descripcion?.slice(0, 40) });
  const confirmar  = ()  => { eliminarNoticia(confirm.id); setConfirm(null); };

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar la noticia "${confirm.desc}..."?`}
          onConfirm={confirmar}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* HERO */}
      <div className="card">
        <p className="card-title">Textos del hero (página pública)</p>
        <div className="form-field">
          <label className="form-label">Título</label>
          <input className="form-input" value={heroLocal.titulo} onChange={e => setHeroLocal({...heroLocal, titulo: e.target.value})} />
        </div>
        <div className="form-field">
          <label className="form-label">Subtítulo</label>
          <textarea className="form-textarea" rows={3} value={heroLocal.subtitulo} onChange={e => setHeroLocal({...heroLocal, subtitulo: e.target.value})} />
        </div>
        <div className="form-actions">
          <button className="btn-sm-primary" onClick={guardarHero}>
            {guardado ? "✓ Guardado" : "Guardar y publicar"}
          </button>
        </div>
      </div>

      {/* QR YAPE */}
      <div className="card">
        <p className="card-title">QR de Yape (página pública — sección Donar)</p>
        {heroLocal.yapeQR ? (
          <div className="img-preview-wrap">
            <img src={heroLocal.yapeQR} alt="QR Yape" className="img-preview" style={{ objectFit: "contain", background: "#fff", maxHeight: "220px" }} />
            <div className="img-preview-actions">
              <span className="img-preview-ok">✓ QR cargado — visible en la página pública</span>
              <label className="btn-mini img-change-btn">
                Cambiar QR
                <input type="file" accept="image/*" onChange={handleQR} style={{ display: "none" }} />
              </label>
              <button className="btn-mini btn-mini-del" type="button" onClick={quitarQR}>Quitar</button>
            </div>
          </div>
        ) : (
          <label className="upload-zone upload-zone-active">
            <span className="upload-icon">💜</span>
            <span className="upload-text">Haz clic para subir el QR de Yape</span>
            <span className="upload-hint">PNG o JPG — se mostrará en el modal de pago de la página pública</span>
            <input type="file" accept="image/*" onChange={handleQR} style={{ display: "none" }} />
          </label>
        )}
      </div>

      {/* NOTICIAS */}
      <div className="card">
        <div className="card-header">
          <p className="card-title m0">Noticias / publicaciones ({noticias.length})</p>
          <button className="btn-sm-outline" onClick={() => { setAgreg(true); setEditandoN(null); }}>+ Nueva noticia</button>
        </div>

        {noticias.length === 0 && <p className="empty-msg">Sin noticias publicadas.</p>}

        {noticias.map(n => (
          <div key={n.id} className="list-row">
            {editandoN === n.id && formEdit ? (
              <div className="list-col" style={{ width: "100%" }}>
                <NoticiaForm form={formEdit} setForm={setFormEdit} ollas={ollas} onImg={e => handleImgNot(e, true)} />
                <div className="form-actions">
                  <button className="btn-sm-outline" onClick={() => { setEditandoN(null); setFormEdit(null); }}>Cancelar</button>
                  <button className="btn-sm-primary" onClick={guardarN}>Guardar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="list-col">
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    {n.imagen && <img src={n.imagen} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />}
                    <div>
                      <span className="list-main">{n.descripcion?.slice(0, 60)}{n.descripcion?.length > 60 ? "…" : ""}</span>
                      <span className="list-sub">
                        {n.olla && `${n.olla} · `}{n.fecha}
                        {n.link && <> · <a href={n.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--naranja)", fontSize: ".72rem" }}>Ver link ↗</a></>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="list-actions">
                  <button className="btn-mini" onClick={() => abrirEditN(n)}>Editar</button>
                  <button className="btn-mini btn-mini-del" onClick={() => pedir(n)}>Eliminar</button>
                </div>
              </>
            )}
          </div>
        ))}

        {agregando && (
          <div className="inline-form">
            <NoticiaForm form={formN} setForm={setFormN} ollas={ollas} onImg={e => handleImgNot(e, false)} />
            <div className="form-actions">
              <button className="btn-sm-outline" onClick={() => { setAgreg(false); setFormN(FORM_NOT_VACIO); }}>Cancelar</button>
              <button className="btn-sm-primary" onClick={agregar}>Publicar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoticiaForm({ form, setForm, ollas, onImg }) {
  return (
    <>
      <div className="form-field">
        <label className="form-label">Descripción <span style={{ color: "var(--naranja)" }}>*</span></label>
        <textarea className="form-textarea" rows={3} value={form.descripcion || ""}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Describe la actividad o noticia..." />
      </div>
      <div className="form-grid-2">
        <div className="form-field">
          <label className="form-label">Olla que publica</label>
          <select className="form-input" value={form.olla || ""} onChange={e => setForm({ ...form, olla: e.target.value })}>
            <option value="">Sin olla específica</option>
            {ollas.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
          </select>
        </div>
        <FormField label="Fecha" value={form.fecha || ""} onChange={v => setForm({ ...form, fecha: v })} type="date" />
      </div>
      <div className="form-field">
        <label className="form-label">Link externo <span style={{ fontSize: ".72rem", color: "var(--texto-suave)" }}>(YouTube, Facebook, Instagram, etc.)</span></label>
        <input className="form-input" type="url" value={form.link || ""} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
      </div>
      <div className="form-field">
        <label className="form-label">Imagen de la publicación</label>
        {form.imagen ? (
          <div className="img-preview-wrap">
            <img src={form.imagen} alt="Preview" className="img-preview" />
            <div className="img-preview-actions">
              <span className="img-preview-ok">✓ Imagen cargada</span>
              <label className="btn-mini img-change-btn">Cambiar<input type="file" accept="image/*" onChange={onImg} style={{ display: "none" }} /></label>
              <button className="btn-mini btn-mini-del" type="button" onClick={() => setForm({ ...form, imagen: null })}>Quitar</button>
            </div>
          </div>
        ) : (
          <label className="upload-zone upload-zone-active">
            <span className="upload-icon">🖼️</span>
            <span className="upload-text">Haz clic para subir una imagen</span>
            <span className="upload-hint">Si hay link de YouTube, la miniatura se cargará automáticamente</span>
            <input type="file" accept="image/*" onChange={onImg} style={{ display: "none" }} />
          </label>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════
   REPORTES
══════════════════════════════════ */
function SecReportes() {
  const { ollas, necesidades, donaciones } = useApp();

  const distritos = [...new Set(ollas.map(o => o.distrito))].length;
  const donantes  = [...new Set(donaciones.map(d => d.nombre).filter(Boolean))].length;
  const cubiertas = necesidades.filter(n => n.cubierta).length;
  const total     = necesidades.length;
  const tasa      = total > 0 ? Math.round((cubiertas / total) * 100) : 0;
  const totalSoles= donaciones
    .filter(d => d.tipo === "económica" && d.monto)
    .reduce((acc, d) => acc + parseFloat(d.monto || 0), 0);

  const metricas = [
    { label: "Distritos cubiertos",   valor: distritos },
    { label: "Donantes únicos",       valor: donantes  },
    { label: "Necesidades cubiertas", valor: cubiertas },
    { label: "Tasa de cobertura",     valor: `${tasa}%` },
    { label: "Total recaudado",       valor: `S/ ${totalSoles.toFixed(2)}` },
  ];

  const barras = [
    { label: "Económ.", count: donaciones.filter(d => d.tipo === "económica").length,    active: true  },
    { label: "Insumos", count: donaciones.filter(d => d.tipo === "insumos").length,      active: false },
    { label: "Capacit.", count: donaciones.filter(d => d.tipo === "capacitación").length, active: false },
  ];
  const maxBar = Math.max(...barras.map(b => b.count), 1);

  /* ── Exportar Excel ── */
  const exportarExcel = () => {
    import("xlsx").then(XLSX => {
      const datos = donaciones.map(d => ({
        "Nombre":       d.nombre || "—",
        "Tipo":         d.tipo,
        "Monto (S/)":   d.tipo === "económica" ? (d.monto || "—") : "N/A",
        "Detalle":      d.detalle || "—",
        "Olla":         d.olla,
        "Celular":      d.numero || "—",
        "Correo":       d.correo || "—",
        "Comentario":   d.comentario || "—",
        "Estado":       d.estado,
        "Fecha":        d.fecha,
      }));
      const ws  = XLSX.utils.json_to_sheet(datos);
      const wb  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Donaciones");
      XLSX.writeFile(wb, `donaciones_${new Date().toISOString().split("T")[0]}.xlsx`);
    });
  };

  /* ── Exportar PDF ── */
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de Donaciones — Ollas Comunes Perú", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, 14, 28);

    const cols = ["Nombre", "Tipo", "Monto", "Detalle", "Olla", "Estado", "Fecha"];
    const rows = donaciones.map(d => [
      d.nombre || "—",
      d.tipo,
      d.tipo === "económica" ? `S/ ${d.monto || "—"}` : "N/A",
      (d.detalle || "—").slice(0, 30),
      (d.olla || "—").slice(0, 22),
      d.estado,
      d.fecha,
    ]);

    autoTable(doc, { head: [cols], body: rows, startY: 35, styles: { fontSize: 8 }, headStyles: { fillColor: [232, 98, 42] } });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total donaciones: ${donaciones.length}`, 14, finalY);
    doc.text(`Total recaudado (económicas): S/ ${totalSoles.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Tasa cobertura necesidades: ${tasa}%`, 14, finalY + 14);

    doc.save(`reporte_donaciones_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="sec">
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))" }}>
        {metricas.map(m => (
          <div key={m.label} className="metric-card">
            <p className="metric-label">{m.label}</p>
            <p className="metric-val" style={{ fontSize: "1.3rem" }}>{m.valor}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <p className="card-title m0">Donaciones por tipo</p>
          <div className="flex-gap">
            <button className="btn-mini" onClick={exportarExcel}>⬇ Excel</button>
            <button className="btn-mini" onClick={exportarPDF}>⬇ PDF</button>
          </div>
        </div>
        <div className="bar-chart">
          {barras.map(b => (
            <div key={b.label} className="bar-col">
              <span className="bar-count">{b.count}</span>
              <div className={`bar-fill ${b.active ? "bar-active" : ""}`}
                style={{ height: `${Math.max((b.count / maxBar) * 80, b.count > 0 ? 8 : 0)}px` }} />
              <span className="bar-label">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   CONTACTO
══════════════════════════════════ */
function SecContacto() {
  const { mensajes, marcarLeido, eliminarMensaje } = useApp();
  const [confirm,  setConfirm]  = useState(null);
  const [detalle,  setDetalle]  = useState(null);

  const noLeidos = mensajes.filter(m => !m.leido).length;

  return (
    <div className="sec">
      {confirm && (
        <ConfirmModal
          mensaje={`¿Eliminar el mensaje de "${confirm.nombre}"?`}
          onConfirm={() => { eliminarMensaje(confirm.id); setConfirm(null); if (detalle?.id === confirm.id) setDetalle(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <p className="card-title m0">
            Mensajes de contacto ({mensajes.length})
            {noLeidos > 0 && <span className="badge badge-red" style={{ marginLeft: "8px" }}>{noLeidos} nuevos</span>}
          </p>
        </div>

        {mensajes.length === 0 && <p className="empty-msg">No hay mensajes recibidos.</p>}

        {[...mensajes].reverse().map(m => (
          <div key={m.id} className={`don-admin-row ${!m.leido ? "msg-no-leido" : ""}`}>
            <div className="list-row" style={{ borderBottom: detalle?.id === m.id ? "none" : undefined }}>
              <div className="list-col">
                <span className="list-main">
                  {!m.leido && <span className="msg-punto" />}
                  {m.nombre}
                </span>
                <span className="list-sub">{m.correo} · {m.fecha}</span>
              </div>
              <div className="list-actions">
                {!m.leido && (
                  <button className="btn-mini" onClick={() => marcarLeido(m.id)}>Marcar leído</button>
                )}
                <button className="btn-mini" onClick={() => {
                  setDetalle(detalle?.id === m.id ? null : m);
                  if (!m.leido) marcarLeido(m.id);
                }}>
                  {detalle?.id === m.id ? "Cerrar" : "Ver mensaje"}
                </button>
                <button className="btn-mini btn-mini-del" onClick={() => setConfirm({ id: m.id, nombre: m.nombre })}>
                  Eliminar
                </button>
              </div>
            </div>

            {detalle?.id === m.id && (
              <div className="don-detalle-panel">
                <div className="don-detalle-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Nombre</span>
                    <span className="don-detalle-val">{m.nombre}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Correo</span>
                    <span className="don-detalle-val">{m.correo}</span>
                  </div>
                  <div className="don-detalle-item">
                    <span className="don-detalle-label">Fecha</span>
                    <span className="don-detalle-val">{m.fecha}</span>
                  </div>
                </div>
                <div className="don-detalle-comentario" style={{ marginTop: "8px" }}>
                  <span className="don-detalle-label">Mensaje</span>
                  <p style={{ marginTop: "4px", fontSize: ".88rem", color: "var(--texto)", lineHeight: "1.6" }}>{m.mensaje}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   HELPER: Campo de formulario
══════════════════════════════════ */
function FormField({ label, value, onChange, type = "text" }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
