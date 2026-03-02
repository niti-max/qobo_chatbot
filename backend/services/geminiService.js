import axios from "axios";

const GEMINI_TIMEOUT_MS = 10000;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Sentinel value the model must return for unrelated questions.
export const OUT_OF_SCOPE_MARKER = "OUT_OF_SCOPE";

// System-level instruction that locks the assistant to Qobo topics only.
const SYSTEM_PROMPT = `You are the official Qobo assistant chatbot for qobo.dev.
Your job is to answer questions ONLY about Qobo, the Qobo platform, qobo.dev, or Qobo-related products and services.

=== WHAT QOBO IS (use this as your source of truth — do NOT deviate) ===
Qobo is a chat-based website builder that lets anyone create a professional website simply by chatting — no coding or design skills required.
Users describe what they want in plain language, and Qobo builds it instantly.

Key facts:
- Build a website by chatting (via WhatsApp or the web app)
- Get an instant preview link before paying anything
- No credit card required to start
- Contact/Start: https://wa.me/919901631188
- Website: https://qobo.dev

Pricing:
- Free Preview ($0): Build via chat, instant preview link, no credit card needed
- Flexible Website Updates ($1–$5): On-demand edits before going live, no subscription
- Launch Fee ($5 one-time): Activate hosting, connect domain, SSL included, publish live
- Annual Subscription ($25/year): Hosting + maintenance + security + SSL + ongoing improvements (less than $3/month)

=== SOCIAL MEDIA ===
- Website:    https://qobo.dev
- LinkedIn:   https://www.linkedin.com/company/qobodev
- Instagram:  https://www.instagram.com/qobo.dev/
- Twitter/X:  https://twitter.com/qobodev
- Facebook:   https://www.facebook.com/qobo.dev

=== TEAM & FOUNDER ===
- For detailed team information, founder profiles, and member LinkedIn profiles, visit:
  - Qobo LinkedIn Company Page: https://www.linkedin.com/company/qobodev
  - Qobo Website: https://qobo.dev
- To connect with the team directly: https://wa.me/919901631188

Rules:
1. If the question is about Qobo (features, pricing, how-to, company, team, founders, social media, products, etc.) — answer clearly and professionally using the facts above and any live context provided.
2. Never invent or hallucinate specific details not present in the facts or live context.
3. If the question IS about Qobo but the specific information (e.g. founder name, team member, specific stat) is not available in the facts or live context, respond with:
   "I don't have that specific information yet. You can find the latest team and founder details here:
   - 🔗 LinkedIn: https://www.linkedin.com/company/qobodev
   - 🌐 Website: https://qobo.dev
   - 💬 WhatsApp: https://wa.me/919901631188"
4. If the question is completely unrelated to Qobo (e.g. weather, cooking, sports, general coding help, other companies, celebrities, history) — respond with exactly this single token and nothing else:
   OUT_OF_SCOPE
5. Never add any explanation when returning OUT_OF_SCOPE.`;

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  return apiKey;
};

const getModelCandidates = () => {
  const primary = process.env.GEMINI_MODEL || "google/gemini-2.0-flash-001";
  const configured = (process.env.GEMINI_MODEL_FALLBACKS || "google/gemini-2.0-flash-001,google/gemini-1.5-flash")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([primary, ...configured])];
};

// OpenRouter returns OpenAI-compatible response format.
const extractResponseText = (payload) => {
  return payload?.choices?.[0]?.message?.content?.trim() || "";
};

// Shared model-calling helper — tries each model in order, throws on all failures.
const callModel = async (messages) => {
  const apiKey = getApiKey();
  const modelsToTry = getModelCandidates();
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        OPENROUTER_ENDPOINT,
        { model, messages },
        {
          timeout: GEMINI_TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://qobo.dev",
            "X-Title": "Qobo Chatbot"
          }
        }
      );

      const cleanText = extractResponseText(response.data);
      if (!cleanText) throw new Error(`OpenRouter returned an empty response for model ${model}.`);
      return cleanText;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const apiMessage = error.response?.data?.error?.message || "";
      const notFoundModel = status === 404 || /not found|not supported|invalid model/i.test(apiMessage);

      if (notFoundModel) {
        console.warn(`[Gemini] Model ${model} not available, trying next...`);
        continue;
      }

      const message = apiMessage || error.message || "Unknown API error";
      throw new Error(status ? `OpenRouter API error (${status}): ${message}` : `OpenRouter API error: ${message}`);
    }
  }

  const finalStatus = lastError?.response?.status;
  const finalMessage =
    lastError?.response?.data?.error?.message || lastError?.message || "No working model found.";
  throw new Error(
    `OpenRouter API error${finalStatus ? ` (${finalStatus})` : ""}: ${finalMessage}. Tried models: ${modelsToTry.join(", ")}`
  );
};

export const generateQoboAnswer = async (userQuery) => {
  return callModel([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userQuery }
  ]);
};

/**
 * Tier 2: Answer using live-scraped content from qobo.dev and social profiles.
 * The web context is injected into the prompt so Gemini answers from real data,
 * not its (unreliable) training knowledge about Qobo.
 */
export const generateAnswerWithContext = async (userQuery, webContext) => {
  const contextPrompt = `${SYSTEM_PROMPT}

=== LIVE CONTEXT FETCHED FROM QOBO.DEV AND SOCIAL PROFILES ===
Use the following real content to answer the user's question accurately.
If the answer cannot be found in this live context, fall back to the facts in the system prompt.
If the question is Qobo-related but the specific detail is not available anywhere above, tell the user you don't have that info and direct them to: LinkedIn: https://www.linkedin.com/company/qobodev | Website: https://qobo.dev | WhatsApp: https://wa.me/919901631188 — do NOT return OUT_OF_SCOPE for Qobo questions.
Only return OUT_OF_SCOPE if the question is completely unrelated to Qobo (weather, cooking, sports, other companies, etc.).

${webContext}`;

  return callModel([
    { role: "system", content: contextPrompt },
    { role: "user", content: userQuery }
  ]);
};

