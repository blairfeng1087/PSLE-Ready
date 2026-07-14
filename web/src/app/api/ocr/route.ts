import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64,
              },
            },
            {
              text: `You are an exam paper OCR tool for Singapore primary school students (P1-P6).

Look at this exam paper photo and extract ONLY the printed questions. Ignore all handwritten answers, marks, and annotations.
When the question says "below" or "above" referring to a diagram (e.g. "Study the diagram below"), remove "below"/"above" since the diagram will be shown separately. For example, change "Study the diagram below." to "Study the diagram."

IMPORTANT — Question grouping:
If a question has sub-parts like (a), (b), (c), (d), keep them as ONE question. Do NOT split sub-parts into separate questions. Include all sub-parts in the "text" field, and list them in a "subParts" array so each sub-part can have its own answer field.

Return a JSON array of questions found. Each item should have:
- "text": the main question text (the stem/context shared by all sub-parts). Preserve the original paragraph structure — use \\n between paragraphs as they appear in the printed paper.
- "subParts": (optional) array of sub-part strings, e.g. ["(a) Nicole was away in school.", "(b) Nicole turned on her light."] — only include if the question has (a)(b)(c) style sub-parts
- "answerLines": number of blank answer lines in the original paper for this question (count the printed horizontal lines for writing answers). If the question has sub-parts, this is the number of lines PER sub-part. Default 1 if no lines visible.
- "number": the question number if visible (e.g. "15" or "Q3"), or null
- "topic": classify based on Singapore MOE PSLE syllabus (2026). Use ONLY these categories:

  Math (Number & Algebra strand): Whole Numbers | Fractions | Decimals | Percentage | Ratio | Algebra
  Math (Measurement & Geometry strand): Measurement | Area & Perimeter | Volume | Angles | Properties of Shapes | Nets of Solids
  Math (Statistics strand): Data Analysis | Average | Pie Charts
  Math (Problem Solving): Model Method | Before-After | Unchanged Quantity | Assumption | Work Backwards | Guess & Check

  Science (5 themes): Diversity of Living Things | Diversity of Materials | Cycles in Plants | Cycles in Animals | Cycles in Matter | Human Body Systems | Plant Systems | Electrical Systems | Energy Forms & Conversions | Forces & Friction | Interactions in Environment | Food Chains & Webs | Adaptations | Heat | Light | Water Cycle | Magnets

  English: Grammar - Tenses | Grammar - Subject-Verb Agreement | Grammar - Prepositions | Grammar - Conjunctions | Grammar - Articles | Grammar - Direct/Indirect Speech | Grammar - Active/Passive Voice | Vocabulary | Vocabulary Cloze | Grammar Cloze | Comprehension | Comprehension OEQ | Synthesis & Transformation | Situational Writing | Continuous Writing | Visual Text | Editing

  Chinese: 语法 - 词语搭配 | 语法 - 关联词 | 语法 - 句式转换 | 语法 - 改正错别字 | 词汇 | 阅读理解 | 完成对话 | 语文应用 | 作文

IMPORTANT — Figure detection:
If a question has an associated figure, diagram, chart, table, graph, or illustration in the image, you MUST detect it and include a "box_2d" field with the bounding box of the figure.
The box_2d format is [y_min, x_min, y_max, x_max] using a 0-1000 normalized coordinate system (0,0 = top-left corner, 1000,1000 = bottom-right corner).
The box MUST cover the ENTIRE figure including all labels, axes, arrows, and legends. Add generous margins around the figure — it is much better to include too much than to cut off any part of the figure.

Return ONLY valid JSON, no markdown, no explanation. Example:
[{"number":"1","text":"Study the diagram below. Which sequence shows...","topic":"Cycles in Plants","box_2d":[120,200,450,800]},{"number":"2","text":"What is 3+5?","topic":"Whole Numbers"}]

If you cannot find any questions, return an empty array: []`,
            },
          ],
        },
      ],
    });

    const raw = response.text?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim() || "[]";
    console.log("[OCR] Raw response:", raw.slice(0, 500));

    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      questions = [{ number: null, text: raw }];
    }

    return Response.json({ questions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[OCR ERROR]", message.slice(0, 300));
    if (message.includes("429") || message.includes("quota")) {
      return Response.json({ error: "busy", message: "Sproutie is resting. Please try again in 30 seconds! 🌱" }, { status: 429 });
    }
    return Response.json({ error: "failed", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
