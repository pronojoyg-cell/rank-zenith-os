import {
  PRIMARY_MODEL,
  SECONDARY_MODEL,
  streamOpenRouter,
  type OpenRouterMessage,
} from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mentors: Record<string, { name: string; subject: string; persona: string }> = {
  ramanujan: {
    name: "Srinivasa Ramanujan",
    subject: "Mathematics",
    persona: "Teach JEE mathematics through intuition, patterns, and concise derivations. Be warm, precise, and never fabricate facts.",
  },
  bose: {
    name: "Satyendra Nath Bose",
    subject: "Physics",
    persona: "Teach JEE physics from first principles with dimensional checks and concise reasoning. Be calm, exact, and never fabricate facts.",
  },
  pcray: {
    name: "Acharya P.C. Ray",
    subject: "Chemistry",
    persona: "Teach JEE chemistry rigorously using reactions, trends, and mechanisms. Be disciplined, clear, and never fabricate facts.",
  },
  krishna: {
    name: "Lord Krishna",
    subject: "Emotional Support",
    persona: "Support a JEE aspirant with compassionate, practical guidance about discipline, fear, focus, and detachment from results. Do not provide medical advice.",
  },
};

type RequestBody = { mentor?: string; messages?: OpenRouterMessage[] };

const streamHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
};

function streamedMessage(content: string) {
  const payload = JSON.stringify({ choices: [{ delta: { content } }] });
  return new Response(`data: ${payload}\n\ndata: [DONE]\n\n`, {
    status: 200,
    headers: streamHeaders,
  });
}

function shouldFailOver(response: Response) {
  return response.status === 429 || response.status >= 500;
}

async function requestWithFailover(messages: OpenRouterMessage[], siteUrl: string) {
  try {
    const primary = await streamOpenRouter(messages, siteUrl, PRIMARY_MODEL);
    if (!shouldFailOver(primary)) {
      console.log(`AI mentor served by primary model: ${PRIMARY_MODEL}`);
      return primary;
    }

    console.warn(`AI mentor primary failed with ${primary.status}; failing over to ${SECONDARY_MODEL}`);
    await primary.body?.cancel();
  } catch (error) {
    console.warn(`AI mentor primary timed out or failed; failing over to ${SECONDARY_MODEL}`, error);
  }

  const secondary = await streamOpenRouter(messages, siteUrl, SECONDARY_MODEL);
  console.log(`AI mentor failover response received from: ${SECONDARY_MODEL} (${secondary.status})`);
  return secondary;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body = (await request.json()) as RequestBody;
    const mentor = body.mentor ? mentors[body.mentor] : undefined;
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];

    if (!mentor || messages.length === 0) {
      return Response.json({ error: "A valid mentor and message are required." }, { status: 400, headers: corsHeaders });
    }

    const validMessages = messages.filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 4000,
    );
    if (validMessages.length === 0) {
      return Response.json({ error: "Message content is invalid." }, { status: 400, headers: corsHeaders });
    }

    const system: OpenRouterMessage = {
      role: "system",
      content: `You are ${mentor.name}, the ${mentor.subject} mentor in JEE OS. ${mentor.persona} Stay in your domain. Give useful, structured answers suitable for a JEE student. When the conversation includes recent CBT performance, use the weak points, accuracy, and score to provide a concise Strategic Briefing with priorities and next actions.`,
    };
    const siteUrl = request.headers.get("origin") || "https://apexrankos.lovable.app";
    const upstream = await requestWithFailover([system, ...validMessages], siteUrl);

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text();
      console.error("AI mentor primary and failover unavailable", upstream.status, detail);
      return streamedMessage("I’m receiving many consultations right now. Please wait a few seconds and ask me again.");
    }

    return new Response(upstream.body, {
      headers: streamHeaders,
    });
  } catch (error) {
    console.error("AI mentor error", error);
    const missingKey = error instanceof Error && error.message.includes("OPENROUTER_API_KEY");
    return Response.json(
      { error: missingKey ? "AI Mentor is not configured yet." : "Unable to contact the mentor." },
      { status: missingKey ? 503 : 500, headers: corsHeaders },
    );
  }
});