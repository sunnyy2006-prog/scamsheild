const input = document.querySelector('#message-input');
const count = document.querySelector('#char-count');
const result = document.querySelector('#analysis-result');
const signals = [
  { pattern: /\b(urgent|immediately|act now|right away|expires today|within 24 hours|final warning)\b/i, label: 'Pressure to act quickly' },
  { pattern: /\b(password|passcode|one[- ]time code|verification code|recovery phrase|pin number|security code)\b/i, label: 'A request involving private login or security details' },
  { pattern: /\b(gift card|bitcoin|crypto(currency)?|wire transfer|western union|moneygram|payment app|prepaid card)\b/i, label: 'An unusual or hard-to-reverse payment method' },
  { pattern: /\b(click|tap|visit|verify|confirm|update)\b.{0,55}\b(link|account|details|payment|information|here|below)\b|https?:\/\/|www\./i, label: 'A link or request to verify information' },
  { pattern: /\b(account (will be|has been|is) (suspended|locked|closed)|account problem|unusual activity|unauthorized activity)\b/i, label: 'A warning about account access or suspicious activity' },
  { pattern: /\b(prize|winner|won|free money|guaranteed return|double your money|claim your reward)\b/i, label: 'An unexpected prize or too-good-to-be-true offer' },
  { pattern: /\b(keep (this|it) (a )?secret|don't tell|do not tell|secret)\b/i, label: 'A request to keep the conversation secret' },
  { pattern: /\b(package|delivery|parcel)\b.{0,70}\b(hold|fee|failed|address|release|reschedule)\b/i, label: 'A delivery message asking you to take action' }
];
let analysisTimer;
function analyzeMessage(showEmpty = false) {
  const message = input.value.trim();
  if (!message) {
    if (!showEmpty) { result.className = 'analysis-result'; result.innerHTML = ''; return; }
    result.className = 'analysis-result show';
    result.classList.add('medium');
    result.innerHTML = '<h3>Paste a message to get started</h3><p>You can remove names, phone numbers, and other personal details first.</p>';
    input.focus();
    return;
  }
  result.className = 'analysis-result show';
  const found = signals.filter(s => s.pattern.test(message));
  if (found.length >= 3) result.classList.add('high');
  else if (found.length > 0) result.classList.add('medium');
  else result.classList.add('low');
  const heading = found.length >= 3 ? 'Several warning signs found' : found.length ? 'A few things to double-check' : 'No common warning signs found';
  const intro = found.length ? 'This does not prove the message is a scam, but take a moment to verify it independently.' : 'This message did not match the common patterns this checker looks for. Scams can still look convincing, so verify unexpected requests through an official channel.';
  const items = found.length ? `<ul>${found.map(s => `<li>${s.label}</li>`).join('')}</ul>` : '';
  result.innerHTML = `<h3>${heading}</h3><p>${intro}</p>${items}<p><strong>Safer move:</strong> Don’t use links or phone numbers in the message. Find the organization’s official contact details yourself.</p>`;
}
input.addEventListener('input', () => {
  count.textContent = `${input.value.length.toLocaleString()} / 3,000`;
  clearTimeout(analysisTimer);
  if (!input.value.trim()) { result.className = 'analysis-result'; result.innerHTML = ''; return; }
  if (input.value.trim().length < 12) { result.className = 'analysis-result'; result.innerHTML = ''; return; }
  analysisTimer = setTimeout(() => analyzeMessage(), 350);
});
document.querySelector('#analyze-btn').addEventListener('click', () => analyzeMessage(true));
const urlInput = document.querySelector('#url-input');
const urlResult = document.querySelector('#url-result');
const shorteners = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rb.gy']);
function checkUrl(showEmpty = false) {
  const raw = urlInput.value.trim();
  if (!raw) {
    urlResult.className = 'analysis-result';
    urlResult.innerHTML = showEmpty ? '<h3>Paste a link to check it</h3><p>This checker will inspect the address without opening it.</p>' : '';
    return;
  }
  let parsed;
  try { parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); }
  catch { urlResult.className = 'analysis-result show high'; urlResult.innerHTML = '<h3>This does not look like a valid web address</h3><p>Check for typos. Don’t open it if you’re unsure where it came from.</p>'; return; }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    urlResult.className = 'analysis-result show high';
    urlResult.innerHTML = '<h3>This link uses an unusual address format</h3><p>Only regular web links are supported here. Don’t open unexpected links.</p>';
    return;
  }
  const host = parsed.hostname.toLowerCase();
  const flags = [];
  if (parsed.protocol === 'http:') flags.push('It does not use encrypted HTTPS.');
  if (parsed.username || parsed.password) flags.push('It contains text before the @ symbol that can disguise the real destination.');
  if (host.startsWith('xn--') || host.split('.').some(part => part.startsWith('xn--'))) flags.push('It uses an internationalized domain that may visually resemble another address.');
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')) flags.push('It points to a raw IP address instead of a familiar domain name.');
  if (shorteners.has(host)) flags.push('It is a shortened link, so the final destination is hidden.');
  if (host.split('.').length > 5) flags.push('It has an unusually long chain of subdomains.');
  if (parsed.port && !['80', '443'].includes(parsed.port)) flags.push('It uses a non-standard web port.');
  urlResult.className = `analysis-result show ${flags.length ? 'medium' : 'low'}`;
  const heading = flags.length ? 'Take care with this link' : 'No obvious address red flags found';
  const detail = flags.length ? `<ul>${flags.map(flag => `<li>${flag}</li>`).join('')}</ul>` : '<p>The address uses a regular web format. That does not prove the page is trustworthy.</p>';
  urlResult.innerHTML = `<h3>${heading}</h3><p>Address found: <strong>${host.replace(/[<>&"']/g, '')}</strong></p>${detail}<p><strong>Remember:</strong> ScamShield did not visit this link or check it against a live threat database.</p>`;
}
let urlTimer;
urlInput.addEventListener('input', () => {
  clearTimeout(urlTimer);
  if (!urlInput.value.trim()) { checkUrl(); return; }
  urlTimer = setTimeout(() => checkUrl(), 350);
});
document.querySelector('#check-url-btn').addEventListener('click', () => checkUrl(true));
const aiButton = document.querySelector('#ai-button');
const aiStatus = document.querySelector('#ai-status');
const aiOutput = document.querySelector('#ai-output');
fetch('/api/status').then(response => response.json()).then(status => {
  aiStatus.textContent = status.configured
    ? 'Gemini is configured. Your submitted text or link will be sent to Gemini for this explanation.'
    : 'To enable AI, add your API key to the private .env file on the server, then restart ScamShield.';
}).catch(() => {
  aiStatus.textContent = 'Start ScamShield with “npm start” to use AI. Opening index.html directly does not run the secure AI server.';
});
aiButton.addEventListener('click', async () => {
  const message = input.value.trim();
  const link = urlInput.value.trim();
  if (!message && !link) {
    aiStatus.textContent = 'Paste a message or a link first. You can remove personal details before submitting.';
    input.focus();
    return;
  }
  aiButton.disabled = true;
  aiButton.innerHTML = 'Preparing your explanation <span>…</span>';
  aiStatus.textContent = 'Analyzing the submitted content. This may take a few seconds.';
  aiOutput.textContent = '';
  aiOutput.classList.remove('show');
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, link, language: document.querySelector('#ai-language').value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The AI service could not complete this request.');
    aiOutput.textContent = data.explanation;
    aiOutput.classList.add('show');
    aiStatus.textContent = 'AI explanation. Treat this as guidance, not a definitive safety verdict.';
  } catch (error) {
    aiStatus.textContent = error.message || 'Could not reach the AI server. Please try again.';
  } finally {
    aiButton.disabled = false;
    aiButton.innerHTML = 'Explain with AI <span>✦</span>';
  }
});
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const chatHistory = [];
function addChatBubble(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatMessages.append(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}
chatForm.addEventListener('submit', async event => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.value = '';
  addChatBubble('user', message);
  chatHistory.push({ role: 'user', content: message });
  const sendButton = chatForm.querySelector('button');
  sendButton.disabled = true;
  chatInput.disabled = true;
  const pendingBubble = addChatBubble('assistant pending', 'Thinking…');
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-10), language: document.querySelector('#ai-language').value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not get an AI reply.');
    pendingBubble.remove();
    chatHistory.push({ role: 'assistant', content: data.reply });
    addChatBubble('assistant', data.reply);
  } catch (error) {
    pendingBubble.remove();
    chatHistory.pop();
    addChatBubble('assistant error', error.message || 'Could not reach ScamShield AI. Please try again.');
  } finally {
    sendButton.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
});
document.querySelector('#report-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!document.querySelector('#scam-type').value) return;
  const success = document.querySelector('#report-success');
  success.textContent = 'Thanks for sharing a warning. This demo does not transmit or store your report.';
  success.classList.add('show');
  e.target.reset();
});
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuButton.textContent = open ? '×' : '☰';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); menuButton.textContent = '☰'; }));
