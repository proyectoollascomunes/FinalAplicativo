export const config = { runtime: "edge" };

export default async function handler(req) {
  /* Solo aceptar POST */
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { titulo, monto, olla, nombre, correo } = body;

    /* Validar monto mínimo */
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum < 1) {
      return new Response(JSON.stringify({ error: "Monto inválido. Mínimo S/ 1." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    /* Llamar a la API de MercadoPago con el Access Token privado */
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title:       titulo || `Donación a ${olla || "Ollas Comunes Perú"}`,
          quantity:    1,
          unit_price:  montoNum,
          currency_id: "PEN",
        }],
        payer: {
          name:  nombre || "Donante",
          email: correo || "donante@ollascomunes.pe",
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL || "https://ollascomunes.vercel.app"}/`,
          failure: `${process.env.NEXT_PUBLIC_URL || "https://ollascomunes.vercel.app"}/`,
          pending: `${process.env.NEXT_PUBLIC_URL || "https://ollascomunes.vercel.app"}/`,
        },
        auto_return:          "approved",
        statement_descriptor: "Ollas Comunes Peru",
        external_reference:   `donacion-${Date.now()}`,
        notification_url:     `${process.env.NEXT_PUBLIC_URL || "https://ollascomunes.vercel.app"}/api/mp-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP Error:", data);
      return new Response(JSON.stringify({ error: "Error al crear preferencia de pago." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Error interno del servidor." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}