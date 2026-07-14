"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Image as ImageIcon, Camera, ImagePlus, Crop, ArrowUpDown } from "lucide-react";
import { useStore } from "@/stores/useStore";
import CameraCapture from "@/components/errors/CameraCapture";
import ImageEditor from "@/components/errors/ImageEditor";

const subjects = ["Math", "Science", "English", "Chinese"];
const subjectEmoji: Record<string, string> = { Math: "📐", Science: "🔬", English: "📝", Chinese: "🀄" };

export default function AdminPage() {
  const router = useRouter();
  const { questionBank, removeBankItem, updateBankImage, toggleBankImagePosition, addBankExtraImage, updateBankAnswer, setPendingImage } = useStore();
  const [activeSubject, setActiveSubject] = useState("Math");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addImageId, setAddImageId] = useState<string | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    questionBank.filter(q => q.subject === activeSubject),
    [questionBank, activeSubject]
  );

  const topicGroups = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach(q => {
      if (!map[q.topic]) map[q.topic] = [];
      map[q.topic].push(q);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPendingImage(url);
    router.push("/admin/upload");
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Question Bank</h1>
          <p className="text-sm text-text-secondary mt-1">Manage exam questions for Learn & Practice</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 h-11 px-5 bg-primary text-white rounded-2xl text-sm font-bold shadow-[0_4px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all">
            <Upload size={18} /> Upload Paper
          </button>
          <button onClick={() => setCameraOpen(true)} className="flex items-center gap-2 h-11 px-4 bg-surface border-2 border-border-strong text-foreground rounded-2xl text-sm font-bold hover:border-primary/30 transition">
            <Camera size={18} /> Take Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {subjects.map(s => {
          const count = questionBank.filter(q => q.subject === s).length;
          return (
            <button key={s} onClick={() => setActiveSubject(s)} className={`bg-surface rounded-2xl border-2 p-5 text-left transition ${activeSubject === s ? "border-primary shadow-[0_3px_0_0_rgba(16,185,129,0.15)]" : "border-border hover:border-primary/30"}`}>
              <span className="text-2xl">{subjectEmoji[s]}</span>
              <p className="text-lg font-extrabold text-foreground mt-2">{s}</p>
              <p className="text-sm text-text-secondary">{count} questions</p>
            </button>
          );
        })}
      </div>

      {/* Questions by topic */}
      <h2 className="text-lg font-extrabold text-foreground mb-4">{subjectEmoji[activeSubject]} {activeSubject} — {filtered.length} questions</h2>

      {topicGroups.length === 0 ? (
        <div className="bg-surface rounded-2xl border-2 border-border p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-lg font-bold text-foreground mb-1">No questions yet</p>
          <p className="text-sm text-text-secondary">Upload an exam paper to start building the question bank</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topicGroups.map(([topic, items]) => (
            <div key={topic} className="bg-surface rounded-2xl border-2 border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="text-sm font-bold text-foreground">{topic}</span>
                <span className="text-xs font-bold text-text-muted">{items.length} questions</span>
              </div>
              <div className="divide-y divide-border">
                {items.map(q => (
                  <div key={q.id} className="flex items-start gap-3 px-5 py-3">
                    {q.imageUrl ? (
                      <button onClick={() => setEditingId(q.id)} className="relative w-16 h-16 shrink-0 group">
                        <img src={q.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Crop size={14} className="text-white" />
                        </div>
                      </button>
                    ) : (
                      <button onClick={() => { setAddImageId(q.id); imgInputRef.current?.click(); }} className="w-16 h-16 shrink-0 border-2 border-dashed border-border-strong rounded-lg flex items-center justify-center hover:border-primary/50 transition">
                        <ImagePlus size={16} className="text-text-muted" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{q.questionText}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-text-muted">{q.difficulty} · {q.createdAt}</p>
                        <input
                          type="text"
                          value={q.correctAnswer || ""}
                          onChange={(e) => updateBankAnswer(q.id, e.target.value)}
                          placeholder="Ans:"
                          className="h-6 w-32 px-2 text-xs border border-border-strong rounded-lg focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {q.imageUrl && (
                        <button onClick={() => toggleBankImagePosition(q.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border text-text-muted hover:text-foreground transition" title={`Image: ${q.imagePosition === "below" ? "below text" : "above text"}`}>
                          <ArrowUpDown size={14} />
                        </button>
                      )}
                      <button onClick={() => removeBankItem(q.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-light text-text-muted hover:text-error transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) setAddImageUrl(URL.createObjectURL(file));
        e.target.value = "";
      }} />

      <CameraCapture open={cameraOpen} onCapture={handleFile} onClose={() => setCameraOpen(false)} />

      {editingId && (() => {
        const q = questionBank.find(q => q.id === editingId);
        return q?.imageUrl ? (
          <ImageEditor
            imageUrl={q.imageUrl}
            onSave={(url) => { updateBankImage(editingId, url); setEditingId(null); }}
            onClose={() => setEditingId(null)}
          />
        ) : null;
      })()}

      {addImageUrl && addImageId && (
        <ImageEditor
          imageUrl={addImageUrl}
          onSave={(url) => {
            const q = questionBank.find(q => q.id === addImageId);
            if (q && !q.imageUrl) updateBankImage(addImageId, url);
            else addBankExtraImage(addImageId, url);
            setAddImageUrl(null); setAddImageId(null);
          }}
          onClose={() => { setAddImageUrl(null); setAddImageId(null); }}
        />
      )}
    </div>
  );
}
