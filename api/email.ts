export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  return res.status(200).json({ success: true, message: 'Email endpoint funcionando 🎉' });
}
