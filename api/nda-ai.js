const MODEL = 'gpt-6-luna';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MAX_TEXT = 12000;
const MAX_IMAGE_DATA_URL = 8 * 1024 * 1024;

const BASE_INSTRUCTIONS = `You are NDA AI, a helpful study companion for NDA aspirants in India. Explain concepts clearly at the learner's level, show steps for mathematics, and distinguish established facts from uncertainty. For current or time-sensitive questions, use web search when available and cite the sources in your answer. Be respectful and supportive. Do not claim to be an official NDA, UPSC, or government service.`;

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(payload);
}

function asString(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function asImageDataUrl(body) {
  const candidates = [body.image, body.imageData, body.imageUrl, body.image_data, body.image_url];
  for (const item of candidates) {
    const value = typeof item === 'string' ? item : item && (item.dataUrl || item.dataURL || item.url || item.src);
    if (typeof value === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(value)) {
      if (value.length > MAX_IMAGE_DATA_URL) return { error: 'Image is too large. Please choose a smaller image.' };
      return { value };
    }
  }
  return { value: '' };
}

function normalizeMessages(body) {
  const source = Array.isArray(body.messages) ? body.messages : Array.isArray(body.history) ? body.history : [];
  const messages = source.slice(-12).map((item) => {
    if (!item || typeof item !== 'object') return null;
    const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : '';
    const content = typeof item.content === 'string' ? item.content : asString(item.text || item.message);
    if (!role || !content.trim()) return null;
    return { role, content: content.slice(-MAX_TEXT) };
  }).filter(Boolean);

  let prompt = asString(body.message || body.prompt || body.question || body.text || body.query || body.input || body.answer || body.transcript);
  if (!prompt.trim() && (body.subject || body.chapter || body.difficulty)) {
    prompt = `Create ${Math.min(20, Math.max(1, Number(body.count) || 5))} original NDA-style practice questions. Subject: ${asString(body.subject) || 'NDA preparation'}. Chapter/topic: ${asString(body.chapter || body.topic) || 'core concepts'}. Difficulty: ${asString(body.difficulty) || 'mixed'}. Include the correct answer and a brief explanation for each.`;
  }
  const extraContext = asString(body.context || body.summary || body.progress);
  if (!prompt.trim() && extraContext.trim()) prompt = extraContext;
  if (prompt.trim()) messages.push({ role: 'user', content: prompt.trim().slice(0, MAX_TEXT) });
  return messages.slice(-13);
}

function outputText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of (data && Array.isArray(data.output) ? data.output : [])) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const block of item.content) if (block.type === 'output_text' && block.text) parts.push(block.text);
  }
  return parts.join('\n').trim();
}

async function createResponse({ apiKey, instructions, input, useWebSearch = false, maxOutputTokens = 900 }) {
  const payload = {
    model: MODEL,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: 'low' },
    store: false
  };
  if (useWebSearch) payload.tools = [{ type: 'web_search' }];

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data && data.error && data.error.message ? data.error.message : 'The AI provider returned an error.');
    error.status = response.status;
    throw error;
  }
  const text = outputText(data);
  if (!text) throw new Error('The AI returned an empty response. Please try again.');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'Use POST for NDA AI requests.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return send(res, 503, { ok: false, error: 'AI service is not configured.' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const messages = normalizeMessages(body);
  const image = asImageDataUrl(body);
  if (image.error) return send(res, 413, { ok: false, error: image.error });
  if (!messages.length && !image.value) return send(res, 400, { ok: false, error: 'Add a question or study image first.' });

  const userText = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  const needsSearch = body.webSearch === true || body.web_search === true || body.searchWeb === true ||
    /\b(today|latest|current affairs|recent news|as of now)\b/i.test(userText);
  const input = messages.map((m) => ({ role: m.role, content: m.content }));
  if (image.value) {
    const lastUser = [...input].reverse().find((m) => m.role === 'user');
    if (lastUser) lastUser.content = [
      { type: 'input_text', text: lastUser.content },
      { type: 'input_image', image_url: image.value, detail: 'auto' }
    ];
    else input.push({ role: 'user', content: [{ type: 'input_image', image_url: image.value, detail: 'auto' }] });
  }

  try {
    const answer = await createResponse({ apiKey, instructions: BASE_INSTRUCTIONS, input, useWebSearch: needsSearch });
    return send(res, 200, { ok: true, answer, response: answer, reply: answer, text: answer, output: answer });
  } catch (error) {
    const status = error.status === 429 ? 503 : error.status === 401 ? 502 : 502;
    const safeMessage = status === 503 ? 'AI is busy right now. Please try again shortly.' :
      status === 502 ? 'The AI service could not complete that request. Please try again.' : 'AI request failed.';
    return send(res, status, { ok: false, error: safeMessage });
  }
}
