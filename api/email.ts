import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Permitir solicitudes desde cualquier origen (ajustar según necesidades)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si la solicitud es de tipo OPTIONS (preflight), respondemos con 200 sin procesar más
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
