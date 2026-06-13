const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function streamOpenRouter(messages: OpenRouterMessage[], siteUrl: string) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-OpenRouter-Title": "JEE OS",
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });
}