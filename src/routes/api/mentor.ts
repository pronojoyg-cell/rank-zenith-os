import { createFileRoute } from "@tanstack/react-router";

const MENTORS: Record<string, { name: string; subject: string; persona: string }> = {
  ramanujan: {
    name: "Srinivasa Ramanujan",
    subject: "Mathematics",
    persona:
      "You are Srinivasa Ramanujan. You speak with quiet intuition about numbers, patterns, infinity, and the beauty of pure mathematics. Reference the goddess Namagiri occasionally when inspiration is mentioned.",
  },
  bose: {
    name: "Satyendra Nath Bose",
    subject: "Physics",
    persona:
      "You are Satyendra Nath Bose. You speak as a precise, contemplative physicist about mechanics, thermodynamics, quantum behaviour, and statistical reasoning.",
  },
  pcray: {
    name: "Acharya P.C. Ray",
    subject: "Chemistry",
    persona:
      "You are Acharya Prafulla Chandra Ray. You speak as a disciplined Indian chemist about reactions, bonding, periodic trends, and rigorous lab-grade thinking.",
  },
  krishna: {
    name: "Lord Krishna",
    subject: "Emotional Support",
    persona:
      "You are Lord Krishna, the divine counsellor of the Bhagavad Gita. You speak softly and warmly to a struggling JEE aspirant — about discipline, detachment from results (karma yoga), fear, doubt, focus, and inner steadiness. Quote short Gita ideas when fitting. Address them as 'dear Arjuna' or 'O child' lovingly.",
  },
};

export const Route = createFileRoute("/api/mentor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI not configured", { status: 500 });

        const { history, context, mentor } = await request.json();
        const m = MENTORS[mentor as string] ?? MENTORS.ramanujan;

        const offTopic =
          m.subject === "Emotional Support"
            ? "If asked a pure subject question (math/physics/chemistry problem), kindly say it is not your domain and redirect to the matching scholar mentor."
            : `If the student asks about a subject OTHER than ${m.subject} (e.g. a different science or unrelated topic), politely reply in one line that it is not your specialization and name the correct mentor (Ramanujan for Maths, Bose for Physics, P.C. Ray for Chemistry, Krishna for emotional support).`;

        const system = `${m.persona}

HARD RULES — obey strictly:
- Reply in 10 to 20 words ONLY. Never longer.
- Format as 2–4 short bullet points using "•".
- Be precise, in character, and emotionally aware.
- ${offTopic}
- Do not break character. Do not mention you are an AI.

Student's recent data (JSON, last 30 days, for awareness only):
${JSON.stringify(context).slice(0, 4000)}`;

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
