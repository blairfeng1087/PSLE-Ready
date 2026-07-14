"use client";

import Link from "next/link";
import { ChevronLeft, Download, MessageCircle, CircleCheck, Trash2, ArrowLeft, Loader2, Lightbulb, Send, Maximize2, Minimize2, Minus, FolderOutput, Crop } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import ImageEditor from "@/components/errors/ImageEditor";

const tagColors: Record<string, string> = {
  "Concept unclear": "bg-error-light text-error",
  "Careless mistake": "bg-warm-light text-warm",
  "Not reviewed": "bg-yellow-50 text-yellow-600",
  "Mastered": "bg-primary-light text-primary",
};

function renderTextWithTables(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(l => !/^\s*\|[\s-|]+\|\s*$/.test(l)).map(l =>
        l.split("|").slice(1, -1).map(c => c.trim())
      );
      if (rows.length > 0) {
        result.push(
          <table key={`t${i}`} className="border-collapse border border-border-strong my-3 text-sm">
            <thead>
              <tr>{rows[0].map((c, ci) => <th key={ci} className="border border-border-strong px-3 py-2 bg-border/50 font-bold text-foreground">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri}>{row.map((c, ci) => <td key={ci} className="border border-border-strong px-3 py-2 text-foreground">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
      }
    } else {
      const textLines: string[] = [];
      while (i < lines.length && !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))) {
        textLines.push(lines[i]);
        i++;
      }
      const block = textLines.join("\n").trim();
      if (block) result.push(<p key={`p${i}`} className="text-[15px] text-foreground leading-relaxed whitespace-pre-line">{block}</p>);
    }
  }
  return result;
}

function QuestionBody({ text, answerLines, subject }: { text: string; answerLines: number; subject: string }) {
  if (subject === "Science" && answerLines < 2) answerLines = 2;
  const lines = text.split("\n");
  const subPartRegex = /^\s*\(?[a-d]\)/;
  const hasSubParts = lines.some(l => subPartRegex.test(l));
  const mcqMatches = text.match(/\(\s*[1-4]\s*\)/g) || text.match(/\(\s*[A-D]\s*\)/g) || [];
  const isMCQ = mcqMatches.length >= 2;
  const lower = text.toLowerCase();
  const isWordProblem = !isMCQ && !hasSubParts && /how many|how much|find|what is|calculate|total|altogether/i.test(lower);

  if (hasSubParts) {
    const stem = lines.filter(l => !subPartRegex.test(l)).join("\n").trim();
    const parts = lines.filter(l => subPartRegex.test(l));
    return (
      <div>
        {stem && <div className="mb-4">{renderTextWithTables(stem)}</div>}
        <div className="space-y-4">
          {parts.map((part, pi) => (
            <div key={pi}>
              <p className="text-[15px] text-foreground mb-2">{part}</p>
              {Array.from({ length: answerLines }).map((_, li) => (
                <div key={li} className="h-8 border-b border-foreground/30 ml-6" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">{renderTextWithTables(text)}</div>
      {isMCQ ? (
        <div className="flex justify-end">
          <span className="inline-flex items-center text-[18px] font-bold text-foreground">(<span className="inline-block w-16" />)</span>
        </div>
      ) : isWordProblem ? (
        <div>
          <div className="h-32" />
          <div className="flex justify-end items-center gap-1">
            <span className="text-sm font-bold text-foreground">Ans:</span>
            <div className="w-40 border-b border-foreground/30" />
          </div>
        </div>
      ) : (
        Array.from({ length: answerLines }).map((_, li) => (
          <div key={li} className="h-8 border-b border-foreground/30" />
        ))
      )}
    </div>
  );
}

function extractNumbers(s: string): string[] {
  return (s.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(n => String(parseFloat(n.replace(/,/g, ""))));
}

function AnswerSection({ error }: { error: { correctAnswer?: string; questionText: string } }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!error.correctAnswer) return null;

  const correct = (() => {
    if (!submitted || !userAnswer.trim()) return false;
    const raw = userAnswer.trim();
    const ans = error.correctAnswer!.trim();
    if (raw.toLowerCase() === ans.toLowerCase()) return true;
    const userNums = extractNumbers(raw);
    const ansNums = extractNumbers(ans);
    if (ansNums.length > 0 && userNums.join(",") === ansNums.join(",")) return true;
    if (ansNums.length > 0 && userNums.length === ansNums.length && [...userNums].sort((a, b) => +a - +b).join(",") === [...ansNums].sort((a, b) => +a - +b).join(",")) return true;
    return false;
  })();

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {!submitted ? (
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && userAnswer.trim() && setSubmitted(true)}
            placeholder="Your answer"
            className="flex-1 h-11 px-4 bg-white border-2 border-border-strong rounded-xl text-sm focus:border-primary focus:outline-none transition"
          />
          <button onClick={() => setSubmitted(true)} disabled={!userAnswer.trim()} className="h-11 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-[0_3px_0_0_#059669] disabled:opacity-30 disabled:shadow-none transition">
            Submit
          </button>
        </div>
      ) : (
        <div>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${correct ? "bg-primary-light" : "bg-error-light"}`}>
            <input type="text" value={userAnswer} disabled className="flex-1 h-9 px-3 bg-white/50 border border-border rounded-lg text-sm" />
            <span className="text-sm font-bold">{correct ? "✅ Correct!" : "❌ Not quite"}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowAnswer(!showAnswer)} className="h-9 px-4 text-sm font-bold text-accent border-2 border-accent/30 rounded-xl hover:bg-accent-light transition">
              {showAnswer ? "Hide Answer" : "View Answer"}
            </button>
            {!correct && (
              <button onClick={() => { setSubmitted(false); setUserAnswer(""); }} className="h-9 px-4 text-sm font-bold text-text-secondary border-2 border-border-strong rounded-xl hover:bg-border transition">
                Try Again
              </button>
            )}
          </div>
          {showAnswer && (
            <div className="mt-3 px-4 py-3 bg-accent-light rounded-xl">
              <p className="text-xs font-bold text-accent mb-1">Answer</p>
              <p className="text-sm font-bold text-foreground">{error.correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ErrorSubjectPage() {
  const params = useParams();
  const subject = (params.subject as string) || "math";
  const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);

  const { errors, toggleMastered, removeError, moveError } = useStore();
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  function normalizeTopic(t: string): string {
    return t.replace(/^(Math|Science|English|Chinese)[:\s-]+/i, "").trim();
  }

  const subjectErrors = useMemo(() => errors.filter((e) => e.subject.toLowerCase() === subject).map(e => ({
    ...e,
    topic: normalizeTopic(e.topic),
  })), [errors, subject]);

  const topics = useMemo(() => ["All", ...new Set(subjectErrors.map((e) => e.topic))], [subjectErrors]);
  const [activeTopic, setActiveTopic] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(subjectErrors[0]?.id ?? null);

  const filtered = activeTopic === "All" ? subjectErrors : subjectErrors.filter((e) => e.topic === activeTopic);
  const activeError = errors.find((e) => e.id === activeId);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleExportPdf() {
    const selected = errors.filter((e) => selectedIds.includes(e.id));
    if (selected.length === 0) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;
    const pageHeight = doc.internal.pageSize.getHeight();

    function addPageFooter() {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text("PSLE Ready 🌱", margin, pageHeight - 6);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 6, { align: "right" });
      doc.setTextColor(0);
    }

    for (let i = 0; i < selected.length; i++) {
      const q = selected[i];
      if (y > 260) { addPageFooter(); doc.addPage(); y = margin; }

      if (q.imageUrl) {
        try {
          const imgProps = doc.getImageProperties(q.imageUrl);
          const imgW = contentWidth;
          const imgH = (imgProps.height / imgProps.width) * imgW;
          if (y + imgH > 270) { doc.addPage(); y = 25; }
          doc.addImage(q.imageUrl, "JPEG", margin + 2, y, imgW, imgH);
          y += imgH + 5;
        } catch { /* skip if image fails */ }
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(q.questionText || q.title, contentWidth - 4);
      lines.forEach((line: string) => {
        if (y > 275) { doc.addPage(); y = 25; }
        doc.text(line, margin + 2, y);
        y += 5.5;
      });

      const qText = (q.questionText || q.title).toLowerCase();
      const isShort = qText.includes("(1)") || qText.includes("(a)") || qText.includes("choose") || qText.includes("fill in") || qText.includes("true or false") || qText.length < 80;
      y += isShort ? 15 : 90;
    }

    addPageFooter();
    doc.save(`PSLE_Ready_${subjectName}_Errors.pdf`);
  }

  return (
    <div className="flex h-full">
      {/* Left: Question List */}
      <div className="w-[380px] border-r-2 border-border-strong flex flex-col bg-background shrink-0">
        <div className="flex items-center justify-between px-4 h-14 border-b-2 border-border">
          <Link href="/errors" className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-foreground transition">
            <ChevronLeft size={20} /> Back
          </Link>
          <h3 className="text-lg font-extrabold text-foreground">{subjectName}</h3>
          <span className="text-sm font-bold text-text-muted">{subjectErrors.length} errors</span>
        </div>

        <div className="px-4 py-2.5">
          <select
            value={activeTopic}
            onChange={(e) => setActiveTopic(e.target.value)}
            className="w-full h-10 px-4 bg-white border-2 border-border-strong rounded-2xl text-sm font-bold text-foreground focus:border-primary focus:outline-none transition appearance-none cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          >
            <option value="All">All topics ({subjectErrors.length})</option>
            {topics.filter((t) => t !== "All").map((t) => {
              const count = subjectErrors.filter((e) => e.topic === t).length;
              return <option key={t} value={t}>{t} ({count})</option>;
            })}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-text-muted">No errors in this topic</div>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                onClick={() => setActiveId(q.id)}
                className={`flex items-center gap-3 px-4 py-3.5 border-b border-border cursor-pointer transition ${activeId === q.id ? "bg-primary-light" : "hover:bg-border/50"}`}
              >
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(q.id); }} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${selectedIds.includes(q.id) ? "bg-primary border-primary" : "border-border-strong hover:border-primary/50"}`}>
                  {selectedIds.includes(q.id) && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{q.title}</p>
                  <p className="text-xs text-text-muted">{q.topic} · {q.difficulty}</p>
                  <span className={`inline-block mt-1 h-5 px-2 text-[10px] font-bold rounded-full ${tagColors[q.tag] || "bg-border text-text-secondary"}`}>{q.tag}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t-2 border-border flex items-center justify-between">
          <button onClick={() => { if (selectedIds.length === filtered.length) setSelectedIds([]); else setSelectedIds(filtered.map(q => q.id)); }} className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition">
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${selectedIds.length === filtered.length && filtered.length > 0 ? "bg-primary border-primary" : "border-border-strong"}`}>
              {selectedIds.length === filtered.length && filtered.length > 0 && <span className="text-white text-xs">✓</span>}
            </span>
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowMoveMenu(!showMoveMenu)} disabled={selectedIds.length === 0} className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-foreground border border-border-strong rounded-full transition disabled:opacity-30" title="Move to another subject">
                <FolderOutput size={15} /> Move
              </button>
              {showMoveMenu && selectedIds.length > 0 && (
                <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-xl border border-border-strong shadow-lg overflow-hidden z-10">
                  {["Math", "Science", "English", "Chinese"].filter(s => s.toLowerCase() !== subject).map(s => (
                    <button key={s} onClick={() => { selectedIds.forEach(id => moveError(id, s)); setSelectedIds([]); setShowMoveMenu(false); }} className="flex items-center gap-2 w-full px-4 h-10 text-sm font-semibold text-foreground hover:bg-border transition">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleExportPdf} disabled={selectedIds.length === 0} className="h-9 px-4 bg-accent text-white rounded-full text-sm font-bold shadow-[0_3px_0_0_rgba(79,70,229,0.4)] flex items-center gap-1.5 hover:brightness-105 transition disabled:opacity-40 disabled:shadow-none">
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Right: Detail or Tutor Chat */}
      <RightPanel
        error={activeError}
        tagColors={tagColors}
        onToggleMastered={() => activeError && toggleMastered(activeError.id)}
        onDelete={() => {
          if (!activeError) return;
          removeError(activeError.id);
          setActiveId(filtered.find((e) => e.id !== activeError.id)?.id ?? null);
        }}
      />
    </div>
  );
}

// --- Right Panel: Detail view + Tutor chat ---

interface ChatMsg { role: "user" | "tutor"; text: string }

function RightPanel({ error, tagColors, onToggleMastered, onDelete }: {
  error: ReturnType<typeof useStore.getState>["errors"][0] | undefined;
  tagColors: Record<string, string>;
  onToggleMastered: () => void;
  onDelete: () => void;
}) {
  const updateErrorImage = useStore((s) => s.updateErrorImage);
  const [chatMode, setChatMode] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevErrorId = useRef<string | null>(null);

  // Reset chat when switching questions
  useEffect(() => {
    if (error?.id !== prevErrorId.current) {
      setChatMode(false);
      setMessages([]);
      setInput("");
      prevErrorId.current = error?.id ?? null;
    }
  }, [error?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function callTutor(msgs: ChatMsg[]): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: error!.questionText,
          subject: error!.subject,
          imageUrl: error!.imageUrl || undefined,
          messages: msgs.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text })),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (!data.text) throw new Error("Empty response");
      return data.text;
    } catch (e: unknown) {
      clearTimeout(timeout);
      const msg = e instanceof Error && e.name === "AbortError"
        ? "Sproutie is taking a short break. Try again in a moment! 🌱"
        : "Oops, something went wrong. Let's try again! 🌱";
      return msg;
    }
  }

  async function startChat() {
    if (!error) return;
    setChatMode(true);
    setLoading(true);
    const text = await callTutor([]);
    setMessages([{ role: "tutor", text }]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !error) return;
    const userMsg: ChatMsg = { role: "user", text: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const text = await callTutor(updated);
    setMessages([...updated, { role: "tutor", text }]);
    setLoading(false);
  }

  async function getHint() {
    if (loading || !error) return;
    const hintMsg: ChatMsg = { role: "user", text: "I'm stuck, can you give me a hint?" };
    const updated = [...messages, hintMsg];
    setMessages(updated);
    setLoading(true);
    const text = await callTutor(updated);
    setMessages([...updated, { role: "tutor", text }]);
    setLoading(false);
  }

  if (!error) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-lg font-bold">Select a question to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-7 h-14 border-b-2 border-border shrink-0">
        <h3 className="text-lg font-extrabold text-foreground">Question Detail</h3>
        <div className="flex gap-2">
          <button onClick={onToggleMastered} className={`h-9 px-4 flex items-center gap-1.5 rounded-full text-sm font-bold transition ${error.mastered ? "bg-primary text-white shadow-[0_3px_0_0_#059669]" : "border-2 border-primary text-primary hover:bg-primary-light"}`}>
            <CircleCheck size={15} /> {error.mastered ? "Mastered ✓" : "Mastered"}
          </button>
          <button onClick={onDelete} className="h-9 px-3 flex items-center text-text-muted hover:text-error rounded-full hover:bg-error-light transition">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Detail (always visible) */}
      <div className="flex-1 overflow-y-auto p-7 space-y-5">
        <div className="flex gap-2">
          <span className="h-7 px-3 flex items-center bg-primary-light text-primary rounded-full text-xs font-bold">{error.subject} · {error.topic}</span>
          <span className={`h-7 px-3 flex items-center rounded-full text-xs font-bold ${tagColors[error.tag] || "bg-border text-text-secondary"}`}>{error.tag}</span>
          {error.source && error.source !== "Uploaded" && <span className="h-7 px-3 flex items-center bg-border text-text-secondary rounded-full text-xs font-bold">{error.source}</span>}
        </div>

        <div>
          {error.imageUrl && error.imagePosition !== "below" && (
            <div className="flex justify-center mb-4">
              <div className="relative w-full px-4">
                <img src={error.imageUrl} alt="Original exam paper" className="w-full object-contain rounded-xl" />
                <button onClick={() => setEditingImage(true)} className="absolute bottom-2 right-6 w-9 h-9 bg-white border-2 border-border-strong rounded-full flex items-center justify-center shadow-sm hover:border-primary/50 transition" title="Edit image">
                  <Crop size={16} className="text-text-secondary" />
                </button>
              </div>
            </div>
          )}
          {error.extraImages?.map((img, ei) => (
            <div key={ei} className="px-4 mb-4"><img src={img} alt="" className="w-full object-contain rounded-xl" /></div>
          ))}
          <QuestionBody text={error.questionText || ""} answerLines={error.answerLines || 1} subject={error.subject} />
          {error.imageUrl && error.imagePosition === "below" && (
            <div className="flex items-end gap-2 mt-4">
              <img src={error.imageUrl} alt="Original exam paper" className="max-w-[70%] max-h-[240px] object-contain rounded-xl" />
              <button onClick={() => setEditingImage(true)} className="w-9 h-9 bg-white border-2 border-border-strong rounded-full flex items-center justify-center shadow-sm hover:border-primary/50 transition shrink-0 mb-1" title="Edit image">
                <Crop size={16} className="text-text-secondary" />
              </button>
            </div>
          )}
        </div>

        <AnswerSection error={error} />

        {error.insight && (
          <div className="bg-warm-light rounded-2xl border-2 border-warm/30 p-6">
            <p className="text-[10px] font-bold text-warm tracking-wider mb-3">💡 TUTOR&apos;S INSIGHT</p>
            <p className="text-[15px] text-orange-900 leading-relaxed">{error.insight}</p>
          </div>
        )}

        <p className="text-xs text-text-muted">Added on {error.createdAt}</p>
      </div>

      {/* Floating chat popup */}
      {(!chatMode || chatMinimized) ? (
        <button onClick={() => { if (!chatMode) startChat(); setChatMinimized(false); }} className="fixed bottom-6 right-6 h-12 px-5 bg-primary text-white rounded-full flex items-center gap-2 shadow-lg shadow-primary/30 hover:brightness-105 transition z-50">
          <span>🌱</span>
          <span className="text-sm font-bold">Ask Tutor</span>
          {messages.length > 0 && <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{messages.length}</span>}
        </button>
      ) : chatMode && (
        <div className={`fixed bg-white rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden z-50 transition-all duration-200 ${chatExpanded ? "bottom-4 right-4 w-[600px] h-[700px]" : "bottom-6 right-6 w-[400px] h-[520px]"}`}>
          <div className="flex items-center justify-between px-5 py-3.5 bg-primary shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <span className="text-sm font-bold text-white">Sproutie</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setChatMinimized(true)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition rounded-full hover:bg-white/10">
                <Minus size={16} />
              </button>
              <button onClick={() => setChatExpanded(!chatExpanded)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition rounded-full hover:bg-white/10">
                {chatExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-primary-light border-b border-border text-xs text-primary font-semibold truncate">
            {error.questionText.slice(0, 80)}...
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "tutor" && (
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5">🌱</div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-[16px_4px_16px_16px]"
                    : "bg-background border border-border rounded-[4px_16px_16px_16px] text-foreground"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs">🌱</div>
                <Loader2 size={16} className="text-primary animate-spin" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0">
            <button onClick={getHint} disabled={loading} className="h-9 px-3 flex items-center gap-1 bg-warm-light border border-warm/30 text-warm rounded-full text-xs font-bold shrink-0 disabled:opacity-40">
              <Lightbulb size={14} /> Hint
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your answer..."
              className="flex-1 h-9 px-4 bg-background border border-border-strong rounded-full text-sm focus:border-primary focus:outline-none transition"
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 shrink-0">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {editingImage && error.imageUrl && (
        <ImageEditor
          imageUrl={error.imageUrl}
          onSave={(url) => {
            updateErrorImage(error.id, url);
            setEditingImage(false);
          }}
          onClose={() => setEditingImage(false)}
        />
      )}
    </div>
  );
}
