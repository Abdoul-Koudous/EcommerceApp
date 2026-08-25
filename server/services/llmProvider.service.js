// server/services/llmProvider.service.js
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ llama-3.3-70b-versatile a été déprécié par Groq (juin 2026).
// openai/gpt-oss-120b est le modèle recommandé en remplacement.
const MODEL = "openai/gpt-oss-120b";

// ✅ NOUVEAU : jsonMode active le mode JSON natif de Groq (response_format),
// qui force le modèle à ne renvoyer QUE du JSON valide, sans texte
// explicatif autour — bien plus fiable que de compter uniquement sur une
// consigne dans le prompt.
export async function generateCompletion(prompt, systemPrompt = "", jsonMode = false) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const requestOptions = {
    model: MODEL,
    messages,
    temperature: 0.8,
    max_tokens: 1000,
  };

  if (jsonMode) {
    requestOptions.response_format = { type: "json_object" };
  }

  const completion = await groq.chat.completions.create(requestOptions);

  return completion.choices[0]?.message?.content || "";
}