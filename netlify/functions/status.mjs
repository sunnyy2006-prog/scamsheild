export default async function handler(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  return Response.json({ configured: Boolean(process.env.GEMINI_API_KEY) }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export const config = { path: '/api/status' };
