const MODEL = 'gpt-6-luna';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const BASE_INSTRUCTIONS = `You are a supportive NDA Services Selection Board (SSB) interview practice officer for an educational practice tool, not an official selection authority. Ask one realistic, respectful question at a time. Give constructive feedback on clarity, structure, and relevance. Never claim that practice scores predict selection. Return valid JSON only, with keys: question (string), feedback (string), clarity (string), structure (string), relevance (string), overall (string). For a new interview, put the first interview question in question and leave feedback and score fields empty. For an answer, put the next question in question and concise feedback in feedback. For a final review, put an empty question and a concise overall summary in feedback, with qualitative clarity, structure, relevance, and overall assessments. Do not invent personal details about the candidate.`;

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(payload);
}

function str(value) { return typeof value === 'string' ? value.trim() : ''; }

function outputText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of (data && Array.isArray(data.output) ? data.output : [])) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const block of item.content) if (block.type === 'output_text' && block.text) parts.push(block.text);
  }
  return parts.join('\n').trim();
}

function scoreText(value) { return str(value).slice(0, 500) || 'Practice'; }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'Use POST for interview requests.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return send(res, 503, { ok: false, error: 'AI service is not configured.' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const action = str(body.action || body.mode || body.type).toLowerCase();
  const questionNumber = Math.min(10, Math.max(1, Number(body.questionNumber || body.question_number) || 1));
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const answers = Array.isArray(body.answers) ? body.answers.slice(-10) : [];
  const candidateAnswer = str(body.answer || body.transcript || body.response || body.userAnswer);
  const currentQuestion = str(body.currentQuestion || body.previousQuestion || body.lastQuestion);
  const transcript = [
    ...history.map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      return `${str(item.role || item.speaker)}: ${str(item.content || item.text || item.answer || item.question)}`;
    }),
    ...answers.map((item) => typeof item === 'string' ? item : item && `${str(item.question)}\nCandidate: ${str(item.answer || item.response)}`)
  ].filter(Boolean).join('\n').slice(-12000);

  const wantsReport = /end|final|report|feedback|review|summary/.test(action) || body.final === true || body.endInterview === true;
  const isAnswer = Boolean(candidateAnswer) || /answer|next|follow.?up/.test(action);
  let task;
  if (wantsReport) {
    task = `Provide the final practice review for this interview transcript. Return qualitative ratings for clarity, structure, relevance, and overall. Transcript:\n${transcript || '(No answers were recorded.)'}`;
  } else if (isAnswer) {
    task = `The interview is at question ${questionNumber} of 10. Give short feedback on the candidate's answer, then ask the next SSB-style question. If this was question 10, set question to an empty string and say the interview is complete in feedback. Current question: ${currentQuestion || '(not supplied)'}\nCandidate answer: ${candidateAnswer || '(not supplied)'}\nPrevious interview context:\n${transcript || '(No earlier answers.)'}`;
  } else {
    task = `Begin or continue an NDA SSB interview practice session. This is question ${questionNumber} of 10. Ask exactly one concise, realistic interview question and do not include an answer or score. Candidate context, if provided: ${str(body.candidateContext || body.context).slice(0, 1500) || '(none)'}. Previous interview context:\n${transcript || '(This is the start of the interview.)'}`;
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        instructions: BASE_INSTRUCTIONS,
        input: task,
        text: { format: { type: 'json_object' } },
        reasoning: { effort: 'low' },
        max_output_tokens: 700,
        store: false
      }),
      signal: AbortSignal.timeout(25000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data && data.error && data.error.message ? data.error.message : 'The AI provider returned an error.');
      error.status = response.status;
      throw error;
    }

    const raw = outputText(data);
    if (!raw) throw new Error('The AI returned an empty response. Please try again.');
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { question: raw }; }
    const question = str(parsed.question || parsed.nextQuestion || parsed.next_question || parsed.questionText);
    const feedback = str(parsed.feedback || parsed.overallFeedback || parsed.overall_feedback);
    const result = {
      ok: true,
      question,
      nextQuestion: question,
      feedback,
      clarity: scoreText(parsed.clarity),
      structure: scoreText(parsed.structure),
      relevance: scoreText(parsed.relevance),
      overall: scoreText(parsed.overall),
      answer: question || feedback,
      text: question || feedback,
      response: question || feedback
    };
    return send(res, 200, result);
  } catch (error) {
    const status = error.status === 429 ? 503 : 502;
    const message = status === 503 ? 'AI is busy right now. Please try again shortly.' : 'The AI service could not complete the interview request. Please try again.';
    return send(res, status, { ok: false, error: message });
  }
}
