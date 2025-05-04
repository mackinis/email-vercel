import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return res.status(500).json({ error: 'Missing Mercado Pago access token' });

  const { returnUrl, cartItems, userProfile, externalReference } = req.body;

  if (!cartItems?.length || !userProfile) {
    return res.status(400).json({ error: 'Missing cart items or user profile' });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const items = cartItems.map((item: any) => ({
    id: item.product.id,
    title: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.priceARS,
    currency_id: 'ARS',
    picture_url: item.product.imageUrl,
    description: item.product.description || '',
    category_id: item.product.category || undefined,
  }));

  const payer = {
    name: userProfile.firstName,
    surname: userProfile.lastName,
    email: userProfile.email,
    phone: { number: userProfile.phone || '' },
  };

  const preferenceData = {
    items,
    payer,
    back_urls: {
      success: `${returnUrl}?status=success&ref=${externalReference}`,
      failure: `${returnUrl}?status=failure&ref=${externalReference}`,
      pending: `${returnUrl}?status=pending&ref=${externalReference}`,
    },
    auto_return: 'approved',
    external_reference: externalReference,
  };

  try {
    const result = await preference.create({ body: preferenceData });
    const initPoint = result.sandbox_init_point || result.init_point;
    if (!initPoint) throw new Error('Missing init_point');

    res.status(200).json({ init_point: initPoint });
  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error);
    res.status(500).json({ error: error.message || 'Failed to create preference' });
  }
}
