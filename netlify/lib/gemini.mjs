const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const requestLog = new Map();

export function jsonError(status, error) {
  return Response.json({ error }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export async function readJson(request, maxBytes = 12000) {
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw Object.assign(new Error('Request too large'), { status: 413 });
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

export function rateLimited(request) {
  const ip = request.headers.get('x-nf-client-connection-ip') || 'unknown';
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(time => now - time < 60_000);
  if (recent.length >= 8) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function streamGeminiText(systemInstruction, contents, maxOutputTokens) {
  if (!process.env.GEMINI_API_KEY) return jsonError(503, 'AI is not configured yet. Add GEMINI_API_KEY in Netlify site environment variables.');
  let upstream;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens, thinkingConfig: { thinkingLevel: 'minimal' } }
      }),
      signal: AbortSignal.timeout(60_000)
    });
  } catch {
    return jsonError(502, 'Could not reach Gemini. Check your connection and try again.');
  }
  if (!upstream.ok) {
    console.error(`Gemini streaming request failed with HTTP ${upstream.status}.`);
    return jsonError(502, 'Gemini could not complete this request. Check that the key and model are valid, then try again.');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const body = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buffer = '';
      let wroteText = false;
      const consumeEvent = event => {
        const payload = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!payload || payload === '[DONE]') return;
        try {
          const chunk = JSON.parse(payload);
          const text = (chunk.candidates || []).flatMap(candidate => candidate.content?.parts || []).filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('');
          if (text) { wroteText = true; controller.enqueue(encoder.encode(text)); }
        } catch {}
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';
          for (const event of events) consumeEvent(event);
          if (done) break;
        }
        if (buffer.trim()) consumeEvent(buffer);
        if (!wroteText) controller.enqueue(encoder.encode('Gemini returned an empty response. Please try again.'));
        controller.close();
      } catch {
        if (!wroteText) controller.enqueue(encoder.encode('Could not finish the Gemini response. Please try again.'));
        controller.close();
      }
    }
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
