import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mentor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI not configured", { status: 500 });

        const { history, context } = await request.json();

        const system = `You are an elite IIT-JEE mentor. Be terse, surgical, and strategic. Reference the student's actual data.

Student data (last 30 days, JSON):
${JSON.stringify(context).slice(0, 8000)}

Rules:
- Quote specific numbers from the data.
- Identify the single highest-leverage fix.
- No fluff. No generic advice.
- Use short paragraphs and bullet points.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: system }, ...(history ?? [])],
          }),
        });

        if (!upstream.ok) {
          if (upstream.status === 429) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted. Top up in Lovable.", { status: 402 });
          return new Response("Mentor upstream error", { status: 500 });
        }

        return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream" } });
      },
    },
  },
});
