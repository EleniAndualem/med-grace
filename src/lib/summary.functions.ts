import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  notes: z.string().trim().min(10).max(8000),
  patient: z.string().max(300).optional(),
});

const SYSTEM = `You are a clinical documentation assistant. Turn a doctor's free-text notes into a concise clinical summary.
Use these short headed sections (omit any with no information): Presenting complaint, Key findings, Assessment, Plan, Follow-up.
Use brief bullet points, standard clinical abbreviations, under 150 words total. Plain text only: write section names followed by a colon, bullets starting with "- ", no markdown symbols like # or *. Do not invent facts not in the notes.`;

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "AI is not configured for this app." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: `${data.patient ? `Patient: ${data.patient}\n\n` : ""}Doctor's notes:\n${data.notes}`,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });

    if (!res.ok || !res.body) {
      const msg =
        res.status === 429
          ? "Too many requests right now — please try again in a moment."
          : res.status === 402
            ? "AI credits are used up. Please add credits to the workspace."
            : `AI request failed (${res.status}).`;
      return { ok: false as const, error: msg };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          if (ev.type === "error" || ev.type === "response.failed")
            return { ok: false as const, error: "The AI could not produce a summary." };
        } catch {
          /* partial */
        }
      }
    }
    text = text.trim();
    if (!text) return { ok: false as const, error: "The AI returned an empty summary." };
    return { ok: true as const, summary: text };
  });
