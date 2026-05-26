import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AppContext = createContext(null);

export function AppProvider({ children }) {

  /* ══════════════════════════════════
     ESTADO
  ══════════════════════════════════ */
  const [ollas,      setOllas]     = useState([]);
  const [necesidades,setNecs]      = useState([]);
  const [donaciones, setDons]      = useState([]);
  const [reuniones,  setReuniones] = useState([]);
  const [noticias,   setNoticias]  = useState([]);
  const [mensajes,   setMensajes]  = useState([]);
  const [hero,       setHero]      = useState({ titulo: "", subtitulo: "", yapeQR: null });
  const [cargando,   setCargando]  = useState(true);

  /* ══════════════════════════════════
     CARGA INICIAL — leer todo de Supabase
  ══════════════════════════════════ */
  useEffect(() => {
    const cargarTodo = async () => {
      setCargando(true);
      try {
        const [
          { data: ollasData },
          { data: necsData },
          { data: donsData },
          { data: reunData },
          { data: notData },
          { data: msgData },
          { data: configData },
        ] = await Promise.all([
          supabase.from("ollas").select("*").order("created_at", { ascending: true }),
          supabase.from("necesidades").select("*").order("created_at", { ascending: true }),
          supabase.from("donaciones").select("*").order("created_at", { ascending: false }),
          supabase.from("reuniones").select("*").order("fecha", { ascending: true }),
          supabase.from("noticias").select("*").order("created_at", { ascending: false }),
          supabase.from("mensajes").select("*").order("created_at", { ascending: false }),
          supabase.from("configuracion").select("*").limit(1).single(),
        ]);

        if (ollasData)  setOllas(ollasData);
        if (necsData)   setNecs(necsData);
        if (donsData)   setDons(donsData);
        if (reunData)   setReuniones(reunData);
        if (notData)    setNoticias(notData);
        if (msgData)    setMensajes(msgData);
        if (configData) setHero({
          titulo:    configData.titulo    || "",
          subtitulo: configData.subtitulo || "",
          yapeQR:    configData.yape_qr   || null,
        });
      } catch (err) {
      } finally {
        setCargando(false);
      }
    };

    cargarTodo();
  }, []);

  /* ══════════════════════════════════
     OLLAS
  ══════════════════════════════════ */
  const agregarOlla = async (olla) => {
    const { id, ...sinId } = olla;
    const { data, error } = await supabase
      .from("ollas")
      .insert([sinId])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando olla:", error.message, error.details); return; }
    if (data) setOllas(prev => [...prev, data]);
  };

  const editarOlla = async (olla) => {
    const { id, created_at, ...campos } = olla;
    const { data, error } = await supabase
      .from("ollas").update(campos).eq("id", id).select().single();
    if (error) { console.error("❌ Error editando olla:", error.message); return; }
    if (data) setOllas(prev => prev.map(o => o.id === id ? data : o));
  };

  const eliminarOlla = async (id) => {
    const { error } = await supabase.from("ollas").delete().eq("id", id);
    if (!error) setOllas(prev => prev.filter(o => o.id !== id));
  };

  /* ══════════════════════════════════
     NECESIDADES
  ══════════════════════════════════ */
  const agregarNec = async (nec) => {
    const { id, ...sinId } = nec;
    const { data, error } = await supabase
      .from("necesidades")
      .insert([{ ...sinId, cubierta: false }])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando necesidad:", error.message, error.details); return; }
    if (data) setNecs(prev => [...prev, data]);
  };

  const editarNec = async (nec) => {
    const { id, created_at, ...campos } = nec;
    const { data, error } = await supabase
      .from("necesidades")
      .update(campos)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setNecs(prev => prev.map(n => n.id === id ? data : n));
  };

  const cubrirNec = async (id) => {
    const { data, error } = await supabase
      .from("necesidades")
      .update({ cubierta: true })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setNecs(prev => prev.map(n => n.id === id ? data : n));
  };

  const eliminarNec = async (id) => {
    const { error } = await supabase.from("necesidades").delete().eq("id", id);
    if (!error) setNecs(prev => prev.filter(n => n.id !== id));
  };

  /* ══════════════════════════════════
     DONACIONES
  ══════════════════════════════════ */
  const agregarDon = async (don) => {
    const fecha = new Date().toLocaleDateString("es-PE");
    const { id, ...sinId } = don;
    const { data, error } = await supabase
      .from("donaciones")
      .insert([{ ...sinId, estado: "en espera", fecha }])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando donacion:", error.message, error.details); return; }
    if (data) setDons(prev => [data, ...prev]);
  };

  const editarEstadoDon = async (id, estado) => {
    const { data, error } = await supabase
      .from("donaciones")
      .update({ estado })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setDons(prev => prev.map(d => d.id === id ? data : d));
  };

  const eliminarDon = async (id) => {
    const { error } = await supabase.from("donaciones").delete().eq("id", id);
    if (!error) setDons(prev => prev.filter(d => d.id !== id));
  };

  /* ══════════════════════════════════
     REUNIONES
  ══════════════════════════════════ */
  const agregarReunion = async (r) => {
    const { id, ...sinId } = r;
    const payload = {
      ...sinId,
      lat: sinId.lat ? parseFloat(sinId.lat) : null,
      lng: sinId.lng ? parseFloat(sinId.lng) : null,
    };
    const { data, error } = await supabase
      .from("reuniones")
      .insert([payload])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando reunión:", error.message, error.details); return; }
    if (data) setReuniones(prev => [...prev, data]);
  };

  const editarReunion = async (r) => {
    const { id, created_at, ...campos } = r;
    const payload = {
      ...campos,
      lat: campos.lat ? parseFloat(campos.lat) : null,
      lng: campos.lng ? parseFloat(campos.lng) : null,
    };
    const { data, error } = await supabase
      .from("reuniones")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("❌ Error editando reunión:", error.message); return; }
    if (data) setReuniones(prev => prev.map(x => x.id === id ? data : x));
  };

  const eliminarReunion = async (id) => {
    const { error } = await supabase.from("reuniones").delete().eq("id", id);
    if (!error) setReuniones(prev => prev.filter(r => r.id !== id));
  };

  /* ══════════════════════════════════
     NOTICIAS
  ══════════════════════════════════ */
  const agregarNoticia = async (n) => {
    const { id, ...sinId } = n;
    const { data, error } = await supabase
      .from("noticias")
      .insert([sinId])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando noticia:", error.message, error.details); return; }
    if (data) setNoticias(prev => [data, ...prev]);
  };

  const editarNoticia = async (n) => {
    const { id, created_at, ...campos } = n;
    const { data, error } = await supabase
      .from("noticias")
      .update(campos)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setNoticias(prev => prev.map(x => x.id === id ? data : x));
  };

  const eliminarNoticia = async (id) => {
    const { error } = await supabase.from("noticias").delete().eq("id", id);
    if (!error) setNoticias(prev => prev.filter(n => n.id !== id));
  };

  /* ══════════════════════════════════
     MENSAJES
  ══════════════════════════════════ */
  const agregarMensaje = async (m) => {
    const fecha = new Date().toLocaleDateString("es-PE");
    const { id, ...sinId } = m;
    const { data, error } = await supabase
      .from("mensajes")
      .insert([{ ...sinId, leido: false, fecha }])
      .select()
      .single();
    if (error) { console.error("❌ Error insertando mensaje:", error.message, error.details); return; }
    if (data) setMensajes(prev => [data, ...prev]);
  };

  const marcarLeido = async (id) => {
    const { data, error } = await supabase
      .from("mensajes")
      .update({ leido: true })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) setMensajes(prev => prev.map(m => m.id === id ? data : m));
  };

  const eliminarMensaje = async (id) => {
    const { error } = await supabase.from("mensajes").delete().eq("id", id);
    if (!error) setMensajes(prev => prev.filter(m => m.id !== id));
  };

  /* ══════════════════════════════════
     HERO / CONFIGURACIÓN
  ══════════════════════════════════ */
  const actualizarHero = async (data) => {
    setHero(data);
    await supabase
      .from("configuracion")
      .update({
        titulo:    data.titulo,
        subtitulo: data.subtitulo,
        yape_qr:   data.yapeQR,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  };

  /* ══════════════════════════════════
     PROVIDER
  ══════════════════════════════════ */
  return (
    <AppContext.Provider value={{
      /* Estado */
      ollas, necesidades, donaciones, reuniones, noticias, mensajes, hero, cargando,
      /* Ollas */
      agregarOlla, editarOlla, eliminarOlla,
      /* Necesidades */
      agregarNec, editarNec, cubrirNec, eliminarNec,
      /* Donaciones */
      agregarDon, editarEstadoDon, eliminarDon,
      /* Reuniones */
      agregarReunion, editarReunion, eliminarReunion,
      /* Noticias */
      agregarNoticia, editarNoticia, eliminarNoticia,
      /* Mensajes */
      agregarMensaje, marcarLeido, eliminarMensaje,
      /* Hero */
      actualizarHero,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);