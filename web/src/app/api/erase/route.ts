import crypto from "crypto";
import { NextRequest } from "next/server";

const APP_KEY = process.env.YOUDAO_APP_KEY!;
const APP_SECRET = process.env.YOUDAO_APP_SECRET!;
const ENDPOINT = "https://openapi.youdao.com/ocr_writing_erase";

function truncate(q: string): string {
  if (q.length > 20) return q.substring(0, 10) + q.length + q.substring(q.length - 10);
  return q;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return Response.json({ error: "No image" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const salt = crypto.randomUUID();
  const curtime = Math.floor(Date.now() / 1000).toString();
  const sign = crypto.createHash("sha256").update(APP_KEY + truncate(base64) + salt + curtime + APP_SECRET).digest("hex");

  const params = new URLSearchParams({
    appKey: APP_KEY,
    q: base64,
    salt,
    curtime,
    sign,
    signType: "v3",
  });

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();

    if (data.errorCode !== "0") {
      console.error("[Erase] Error:", data.errorCode);
      return Response.json({ error: data.errorCode }, { status: 400 });
    }

    return Response.json({ erasedImage: data.eraseEnhanceImg });
  } catch (e: unknown) {
    console.error("[Erase] Failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
