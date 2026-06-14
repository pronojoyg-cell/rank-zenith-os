const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const PRIMARY_MODEL = "google/gemma-4-31b-it:free";
export const SECONDARY_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function streamOpenRouter(
  messages: OpenRouterMessage[],
  siteUrl: string,
  model: string,
  timeoutMs = 15_000,
) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-OpenRouter-Title": "JEE OS",
      },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}