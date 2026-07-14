import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { getPromptForSubject } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { question, messages, subject, imageUrl } = await req.json();

  const systemPrompt = getPromptForSubject(subject || "math");

  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "Understood! I'm Sproutie 🌱, ready to guide students step by step." }] },
  ];

  if (question || imageUrl) {
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
    if (imageUrl && imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }
    parts.push({ text: question
      ? `The student needs help with this ${subject || "math"} question:\n\n"${question}"\n\nStart guiding them step by step.`
      : `The student needs help with the question shown in the image. Start guiding them step by step.`
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contents.push({ role: "user" as const, parts: parts as any });
  }

  if (messages) {
    for (const msg of messages) {
      contents.push({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.text }],
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });
    return Response.json({ text: response.text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("429") || message.includes("quota")) {
      return Response.json({ text: "Sproutie is taking a short break. Try again in a moment! 🌱" });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
