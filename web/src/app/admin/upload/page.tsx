"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, FolderOpen, Crop, ImagePlus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { cropFigure, processExamImage, type Box2D } from "@/lib/imageProcess";
import ImageEditor from "@/components/errors/ImageEditor";
import { mathCurriculum } from "@/lib/curriculum";

const subjects = [
  { key: "Math", emoji: "📐" },
  { key: "Science", emoji: "🔬" },
  { key: "English", emoji: "📝" },
  { key: "Chinese", emoji: "🀄" },
];

type Step = "cropping" | "scanning" | "review" | "saving" | "saved" | "error";

export default function AdminUploadPage() {
  const router = useRouter();
  const { pendingImageUrl, setPendingImage, addToBank } = useStore();
  const [step, setStep] = useState<Step>("cropping");
  const [grade, setGrade] = useState("P5");
  const [subject, setSubject] = useState("Math");
  const [paperType, setPaperType] = useState<"syllabus" | "top-school" | "prelim" | "psle">("syllabus");
  const [paperYear, setPaperYear] = useState(new Date().getFullYear());
  const [paperName, setPaperName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  type Block = { type: "text" | "image"; content: string };
  const [questions, setQuestions] = useState<{ topic: string; blocks: Block[]; answerLines?: number; correctAnswer?: string }[]>([]);
  const [scanError, setScanError] = useState("");
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [addImageIdx, setAddImageIdx] = useState<number | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingImageUrl) {
      router.replace("/admin");
      return;
    }
    if (step !== "scanning") return;

    const scanSource = croppedImageUrl || pendingImageUrl;

    async function scan() {
      try {
        const blob = await fetch(scanSource!).then((r) => r.blob());
        const formData = new FormData();
        formData.append("image", blob, "photo.jpg");

        const eraseForm = new FormData();
        eraseForm.append("image", blob, "photo.jpg");

        const [ocrRes, eraseRes] = await Promise.all([
          fetch("/api/ocr", { method: "POST", body: formData }),
          fetch("/api/erase", { method: "POST", body: eraseForm }).catch(() => null),
        ]);

        const data = await ocrRes.json();
        const eraseData = eraseRes ? await eraseRes.json().catch(() => null) : null;
        const erasedImageUrl = eraseData?.erasedImage ? "data:image/png;base64," + eraseData.erasedImage : null;

        if (!ocrRes.ok) {
          setScanError(data.message || "Something went wrong.");
          setStep("error");
          return;
        }
        if (data.questions && data.questions.length > 0) {
          const rawQuestions = data.questions as { text: string; topic?: string; box_2d?: Box2D; subParts?: string[]; answerLines?: number }[];
          const parsed = rawQuestions.map((q) => {
            let topic = (q.topic || "General").replace(/^(Math|Science|English|Chinese)[:\s-]+/i, "").trim();
            if (topic.startsWith("Grammar -")) topic = topic.replace("Grammar -", "Grammar:").replace(/\s+/g, " ");
            if (topic.startsWith("Grammar:")) topic = topic.replace("Grammar:", "Grammar -");
            const fullText = q.subParts ? q.text + "\n" + q.subParts.join("\n") : q.text;
            const textBlocks: Block[] = fullText.split("\n").filter(l => l.trim()).map(l => ({ type: "text" as const, content: l.trim() }));
            return { topic: topic || "General", blocks: textBlocks, box_2d: q.box_2d, answerLines: q.answerLines || 1 };
          });
          setQuestions(parsed);

          const scienceTopics = /Diversity|Cycles|Human Body|Plant Systems|Electrical|Energy|Forces|Friction|Interactions|Food Chain|Food Web|Adaptations|Heat|Light|Water Cycle|Magnets/i;
          const mathTopics = /Whole Numbers|Fractions|Decimals|Percentage|Ratio|Algebra|Measurement|Area|Perimeter|Volume|Angles|Shapes|Nets|Data Analysis|Average|Pie Charts|Model Method|Before-After|Unchanged|Assumption|Work Backwards|Guess/i;
          const chineseTopics = /语法|词汇|阅读理解|完成对话|语文应用|作文|词语搭配|关联词|句式转换|错别字/;
          const rawTopics = rawQuestions.map(q => q.topic || "").join(" ");
          if (scienceTopics.test(rawTopics)) setSubject("Science");
          else if (chineseTopics.test(rawTopics)) setSubject("Chinese");
          else if (mathTopics.test(rawTopics)) setSubject("Math");
          else if (/Grammar|Vocabulary|Comprehension|Writing|Visual Text|Editing|Synthesis/i.test(rawTopics)) setSubject("English");

          setStep("review");

          const cropSource = erasedImageUrl || scanSource!;
          for (let i = 0; i < parsed.length; i++) {
            const box = parsed[i].box_2d;
            if (box && Array.isArray(box) && box.length === 4) {
              cropFigure(cropSource, box)
                .then(url => setQuestions(prev => prev.map((q, j) => j === i ? { ...q, blocks: [{ type: "image", content: url }, ...q.blocks] } : q)))
                .catch(e => console.error("[CropFigure] Q" + (i + 1), e));
            }
          }
        } else {
          setScanError("No questions found in this image.");
          setStep("error");
        }
      } catch {
        setScanError("Cannot connect. Please check your connection.");
        setStep("error");
      }
    }
    scan();
  }, [pendingImageUrl, step, router, croppedImageUrl]);

  function handleSave() {
    setStep("saving");
    addToBank(
      questions.map((q) => {
        const textBlocks = q.blocks.filter(b => b.type === "text");
        const firstImage = q.blocks.find(b => b.type === "image");
        return {
          subject,
          topic: selectedTopic || q.topic,
          title: (textBlocks[0]?.content || "").slice(0, 50) + ((textBlocks[0]?.content || "").length > 50 ? "..." : ""),
          source: paperType === "syllabus" ? "Syllabus" : paperName || paperType,
          difficulty: grade,
          tag: "Not reviewed",
          questionText: textBlocks.map(b => b.content).join("\n"),
          insight: "",
          mastered: false,
          answerLines: q.answerLines || 1,
          ...(firstImage ? { imageUrl: firstImage.content } : {}),
          ...(q.correctAnswer ? { correctAnswer: q.correctAnswer } : {}),
          contentBlocks: q.blocks,
          paperType,
          ...(paperType !== "syllabus" ? { paperYear } : {}),
        };
      })
    );

    setTimeout(() => {
      setStep("saved");
      setTimeout(() => {
        setPendingImage(null);
        router.push("/admin");
      }, 800);
    }, 600);
  }

  if (!pendingImageUrl && step !== "saving" && step !== "saved") return null;

  if (step === "cropping" && pendingImageUrl) {
    return (
      <ImageEditor
        imageUrl={pendingImageUrl}
        onSave={(url) => { setCroppedImageUrl(url); setStep("scanning"); }}
        onClose={() => { setPendingImage(null); router.back(); }}
      />
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg font-bold text-foreground">{scanError}</p>
        <button onClick={() => { setPendingImage(null); router.back(); }} className="h-11 px-6 bg-primary text-white rounded-2xl text-sm font-bold shadow-[0_4px_0_0_#059669]">Back</button>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="relative w-[400px] max-w-[80vw] rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg">
          <img src={croppedImageUrl || pendingImageUrl!} alt="Scanning" className="w-full max-h-[400px] object-contain bg-black/5" />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-[scanline_2s_ease-in-out_infinite]" style={{ boxShadow: "0 0 20px 4px rgba(16,185,129,0.4)" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">Scanning paper...</p>
          <p className="text-sm text-text-secondary mt-1">Recognizing questions</p>
        </div>
        <style>{`@keyframes scanline { 0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; } }`}</style>
      </div>
    );
  }

  if (step === "saving" || step === "saved") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FolderOpen size={56} className={`transition-colors duration-300 ${step === "saved" ? "text-primary" : "text-text-muted"}`} />
        <p className="text-lg font-bold text-foreground">{step === "saved" ? "Added to Question Bank!" : "Saving..."}</p>
        {step === "saved" && <p className="text-sm text-primary font-semibold">{questions.length} question{questions.length > 1 ? "s" : ""} added</p>}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <button onClick={() => { setPendingImage(null); router.back(); }} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-foreground mb-6">
        <ChevronLeft size={20} /> Back to Admin
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">{questions.length} question{questions.length > 1 ? "s" : ""} found</h2>
          <p className="text-sm text-text-secondary mt-1">Review and add to Question Bank</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1.5">
            {["P1","P2","P3","P4","P5","P6"].map((g) => (
              <button key={g} onClick={() => setGrade(g)} className={`h-9 px-3 rounded-xl text-xs font-bold transition ${grade === g ? "bg-accent text-white shadow-[0_3px_0_0_rgba(79,70,229,0.4)]" : "bg-surface border-2 border-border-strong text-text-secondary"}`}>{g}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {subjects.map((s) => (
              <button key={s.key} onClick={() => setSubject(s.key)} className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all ${subject === s.key ? "bg-primary text-white shadow-[0_4px_0_0_#059669]" : "bg-surface border-2 border-border-strong text-text-secondary"}`}>{s.emoji} {s.key}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Source selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-surface rounded-2xl border-2 border-border">
        <div className="flex gap-1.5">
          {([["syllabus", "Syllabus"], ["top-school", "Top School Papers"], ["prelim", "Prelim"], ["psle", "PSLE"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPaperType(val)} className={`h-9 px-3 rounded-xl text-xs font-bold transition ${paperType === val ? "bg-accent text-white shadow-[0_3px_0_0_rgba(79,70,229,0.4)]" : "bg-white border border-border-strong text-text-secondary"}`}>{label}</button>
          ))}
        </div>
        {paperType !== "syllabus" && (
          <>
            <select value={paperYear} onChange={(e) => setPaperYear(Number(e.target.value))} className="h-9 px-3 bg-white border border-border-strong rounded-xl text-xs font-bold focus:border-accent focus:outline-none">
              {[2027,2026,2025,2024,2023,2022,2021,2020].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {paperType === "top-school" && (
              <input type="text" value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="e.g. Nanyang WA1" className="h-9 px-3 bg-white border border-border-strong rounded-xl text-xs font-bold focus:border-accent focus:outline-none w-40" />
            )}
            {paperType === "prelim" && (
              <input type="text" value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="e.g. Nanyang Prelim" className="h-9 px-3 bg-white border border-border-strong rounded-xl text-xs font-bold focus:border-accent focus:outline-none w-40" />
            )}
            {paperType === "psle" && (
              <input type="text" value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="e.g. Paper 1 Q15" className="h-9 px-3 bg-white border border-border-strong rounded-xl text-xs font-bold focus:border-accent focus:outline-none w-40" />
            )}
          </>
        )}
        {subject === "Math" && (
          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="h-9 px-3 bg-white border border-border-strong rounded-xl text-xs font-bold focus:border-accent focus:outline-none">
            <option value="">Auto (OCR detect)</option>
            {(mathCurriculum.grades.find(g => g.level === grade)?.topics || []).map(t => (
              <option key={t.id} value={t.name}>{t.chapter}. {t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q, qi) => {
          function moveBlock(bi: number, dir: -1 | 1) {
            const ni = bi + dir;
            if (ni < 0 || ni >= q.blocks.length) return;
            setQuestions(prev => prev.map((qq, j) => {
              if (j !== qi) return qq;
              const blocks = [...qq.blocks];
              [blocks[bi], blocks[ni]] = [blocks[ni], blocks[bi]];
              return { ...qq, blocks };
            }));
          }
          function removeBlock(bi: number) {
            setQuestions(prev => prev.map((qq, j) => j === qi ? { ...qq, blocks: qq.blocks.filter((_, k) => k !== bi) } : qq));
          }

          return (
          <div key={qi} className="bg-surface rounded-2xl border-2 border-border shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <span className="w-7 h-7 flex items-center justify-center bg-accent text-white rounded-lg text-xs font-bold shrink-0">{qi + 1}</span>
              <span className="inline-block h-5 px-2 text-[10px] font-bold text-accent bg-accent-light rounded-full">{q.topic}</span>
              <span className="text-xs text-text-muted ml-auto">{q.blocks.length} blocks</span>
            </div>

            <div className="p-4 space-y-2">
              {q.blocks.map((block, bi) => (
                <div key={bi} className="flex items-start gap-2 group">
                  <div className="flex flex-col gap-0.5 shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => moveBlock(bi, -1)} disabled={bi === 0} className="w-6 h-6 flex items-center justify-center rounded hover:bg-border transition disabled:opacity-20"><ChevronUp size={14} className="text-text-muted" /></button>
                    <button onClick={() => moveBlock(bi, 1)} disabled={bi === q.blocks.length - 1} className="w-6 h-6 flex items-center justify-center rounded hover:bg-border transition disabled:opacity-20"><ChevronDown size={14} className="text-text-muted" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    {block.type === "image" ? (
                      <div className="flex items-end gap-2">
                        <img src={block.content} alt="" className="max-w-[80%] max-h-[180px] object-contain rounded-lg" />
                        <button onClick={() => { setEditingImage(qi); setEditingBlockIdx(bi); }} className="w-8 h-8 bg-white border border-border-strong rounded-full flex items-center justify-center hover:border-primary/50 transition shrink-0">
                          <Crop size={13} className="text-text-secondary" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed py-1">{block.content}</p>
                    )}
                  </div>
                  <button onClick={() => removeBlock(bi)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-error-light text-text-muted/30 hover:text-error transition shrink-0 mt-1 opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-t border-border">
              <button onClick={() => { setAddImageIdx(qi); imgInputRef.current?.click(); }} className="flex items-center gap-1.5 h-8 px-3 border border-dashed border-border-strong rounded-lg text-xs font-bold text-text-muted hover:border-primary/50 hover:text-primary transition">
                <ImagePlus size={13} /> Insert Image
              </button>
              <div className="flex-1" />
              <label className="text-[10px] font-bold text-text-muted">ANS:</label>
              <input
                type="text"
                value={q.correctAnswer || ""}
                onChange={(e) => setQuestions(prev => prev.map((qq, j) => j === qi ? { ...qq, correctAnswer: e.target.value } : qq))}
                placeholder="e.g. 120 cm³"
                className="w-40 h-8 px-3 bg-white border border-border-strong rounded-lg text-xs focus:border-accent focus:outline-none transition"
              />
            </div>
          </div>
          );
        })}
      </div>

      <button onClick={handleSave} className="w-full h-14 bg-accent text-white rounded-2xl text-base font-extrabold shadow-[0_5px_0_0_rgba(79,70,229,0.4)] hover:brightness-105 active:shadow-[0_2px_0_0_rgba(79,70,229,0.4)] active:translate-y-0.5 transition-all">
        Add {questions.length} Question{questions.length > 1 ? "s" : ""} to Question Bank
      </button>

      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) setAddImageUrl(URL.createObjectURL(file));
        e.target.value = "";
      }} />

      {editingImage !== null && editingBlockIdx !== null && (() => {
        const block = questions[editingImage]?.blocks[editingBlockIdx];
        return block?.type === "image" ? (
          <ImageEditor
            imageUrl={block.content}
            onSave={(url) => {
              setQuestions(prev => prev.map((q, j) => j === editingImage ? { ...q, blocks: q.blocks.map((b, k) => k === editingBlockIdx ? { ...b, content: url } : b) } : q));
              setEditingImage(null); setEditingBlockIdx(null);
            }}
            onClose={() => { setEditingImage(null); setEditingBlockIdx(null); }}
          />
        ) : null;
      })()}

      {addImageUrl && addImageIdx !== null && (
        <ImageEditor
          imageUrl={addImageUrl}
          onSave={(url) => {
            setQuestions(prev => prev.map((q, j) => j === addImageIdx ? { ...q, blocks: [...q.blocks, { type: "image", content: url }] } : q));
            setAddImageUrl(null); setAddImageIdx(null);
          }}
          onClose={() => { setAddImageUrl(null); setAddImageIdx(null); }}
        />
      )}
    </div>
  );
}
