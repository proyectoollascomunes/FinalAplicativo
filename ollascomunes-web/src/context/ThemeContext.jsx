import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [oscuro, setOscuro] = useState(() => {
    /* Recordar preferencia del usuario */
    return localStorage.getItem("tema") === "oscuro";
  });

  useEffect(() => {
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
    /* Aplicar clase al body para que las variables CSS funcionen globalmente */
    document.body.classList.toggle("tema-oscuro", oscuro);
  }, [oscuro]);

  const toggleTema = () => setOscuro(prev => !prev);

  return (
    <ThemeContext.Provider value={{ oscuro, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTema = () => useContext(ThemeContext);
