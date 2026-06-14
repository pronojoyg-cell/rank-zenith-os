import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  filename: z.string().min(1).max(180),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
  base64: z.string().min(20).max(16_000_000),
  subject: z.enum(["Physics", "Chemistry", "Maths", "Mixed"]),
});

const questionSchema = z.object({
  question_id: z.number().int().min(1),
  subject: z.enum(["Physics", "Chemistry", "Maths"]),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(1),
});

function extractJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The generated test was not valid JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const generatePracticeTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI generation is not configured.");

    const prompt = `Analyze the attached JEE study material and create exactly 10 challenging single-correct MCQs for ${data.subject}.
Use only concepts supported by the material. Make distractors plausible and explanations concise. Use LaTeX with $...$ when useful.
Return ONLY valid JSON in this exact shape:
{"title":"short test title","questions":[{"question_id":1,"subject":"Physics|Chemistry|Maths","question":"text","options":["option A","option B","option C","option D"],"correct_answer":"A","explanation":"text"}]}
Requirements: exactly 10 questions, IDs 1 through 10, four options each, correct_answer must be A/B/C/D.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.25,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", file: { filename: data.filename, file_data: `data:${data.mimeType};base64,${data.base64}` } },
          ],
        }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Practice generation failed", upstream.status, detail.slice(0, 500));
      throw new Error(upstream.status === 429 ? "The generator is busy. Please retry shortly." : "Could not generate a test from this file.");
    }

    const response = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractJson(response.choices?.[0]?.message?.content ?? "");
    const questions = z.array(questionSchema).length(10).parse(parsed.questions);
    const title = z.string().min(1).max(100).catch(`${data.subject} Material Test`).parse(parsed.title);

    const { data: test, error } = await context.supabase
      .from("generated_tests")
      .insert({
        user_id: context.userId,
        title,
        subject: data.subject,
        source_filename: data.filename,
        questions,
        status: "ready",
        duration_minutes: 30,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return test;
  });