// src/app/api/create-mercado-pago-link/route.ts
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import type { PreferenceCreateData } from "mercadopago/dist/clients/preference/create/types";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("⚠️ MERCADO_PAGO_ACCESS_TOKEN is missing.");
}

const mp = new MercadoPagoConfig({
  accessToken: accessToken || "",
});

const preference = new Preference(mp);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { returnUrl, cartItems, userProfile, externalReference } = body;

    if (!cartItems?.length || !userProfile) {
      return NextResponse.json({ error: "Missing cart items or user profile" }, { status: 400 });
    }

    const items = cartItems.map((item: any) => ({
      title: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.priceARS,
      currency_id: "ARS",
    }));

    const preferenceData: PreferenceCreateData = {
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

    return NextResponse.json({
      init_point: result.init_point || result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("❌ Error creating MercadoPago preference:", error);
    return NextResponse.json({ error: "Failed to create MercadoPago preference" }, { status: 500 });
  }
}
