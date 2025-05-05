import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

const preference = new Preference(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { returnUrl, cartItems, userProfile, externalReference } = req.body;

    if (!cartItems?.length || !userProfile) {
      return res.status(400).json({ error: "Missing cart items or user profile" });
    }

    const items = cartItems.map((item: any) => ({
      title: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.priceARS,
      currency_id: "ARS",
    }));

    const preferenceData = {
      items,
      payer: {
        name: userProfile.firstName,
        surname: userProfile.lastName,
        email: userProfile.email,
      },
      back_urls: {
        success: `${returnUrl}?status=success&ref=${externalReference}`,
        failure: `${returnUrl}?status=failure&ref=${externalReference}`,
        pending: `${returnUrl}?status=pending&ref=${externalReference}`,
      },
      auto_return: "approved",
      external_reference: externalReference,
    };

    const result = await preference.create({ body: preferenceData });

    res.status(200).json({
      init_point: result.init_point || result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("❌ Error creating MercadoPago preference:", error);
    res.status(500).json({ error: "Failed to create MercadoPago preference" });
  }
}
