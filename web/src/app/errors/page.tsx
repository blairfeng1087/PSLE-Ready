"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { useStore } from "@/stores/useStore";
import CameraCapture from "@/components/errors/CameraCapture";

const subjectMeta: Record<string, { emoji: string; color: string; shadow: string; bg: string }> = {
  Math: { emoji: "📐", color: "border-primary/30", shadow: "shadow-[0_4px_0_0_rgba(16,185,129,0.12)]", bg: "bg-primary-light" },
  Science: { emoji: "🔬", color: "border-accent/30", shadow: "shadow-[0_4px_0_0_rgba(99,102,241,0.12)]", bg: "bg-accent-light" },
  English: { emoji: "📝", color: "border-warm/30", shadow: "shadow-[0_4px_0_0_rgba(249,115,22,0.12)]", bg: "bg-warm-light" },
  Chinese: { emoji: "🀄", color: "border-purple-400/30", shadow: "shadow-[0_4px_0_0_rgba(139,92,246,0.12)]", bg: "bg-purple-50" },
};

export default function ErrorBookPage() {
  const router = useRouter();
  const errors = useStore((s) => s.errors);
  const setPendingImage = useStore((s) => s.setPendingImage);

  // Track new errors since last visit
  const seenCounts = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("psle-seen-counts") || "{}"); } catch { return {}; }
  }, []);

  function getNewCount(subject: string) {
    const current = errors.filter(e => e.subject === subject).length;
    const seen = seenCounts[subject] || 0;
    return Math.max(0, current - seen);
  }

  useEffect(() => {
    // Update seen counts when leaving the page
    return () => {
      const counts: Record<string, number> = {};
      ["Math", "Science", "English", "Chinese"].forEach(s => {
        counts[s] = errors.filter(e => e.subject === s).length;
      });
      localStorage.setItem("psle-seen-counts", JSON.stringify(counts));
    };
  }, [errors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPendingImage(url);
    router.push("/errors/new");
  }

  const subjectGroups = ["Math", "Science", "English", "Chinese"].map((name) => {
    const items = errors.filter((e) => e.subject === name);
    const topics = [...new Set(items.map((e) => e.topic))];
    const mastered = items.filter((e) => e.mastered).length;
    const progress = items.length > 0 ? Math.round((mastered / items.length) * 100) : 0;
    return { name, count: items.length, topics: topics.length, mastered, progress, ...subjectMeta[name] };
  });

  const weakAreas = errors
    .filter((e) => !e.mastered)
    .reduce((acc, e) => {
      const key = `${e.subject} · ${e.topic}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedWeak = Object.entries(weakAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const weakColors = [
    { bg: "bg-error-light", border: "border-red-200", color: "text-error" },
    { bg: "bg-warm-light", border: "border-orange-200", color: "text-warm" },
    { bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[28px] font-extrabold text-foreground tracking-tight">Error Book 📚</h2>
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 h-11 px-5 bg-primary text-white rounded-2xl text-sm font-extrabold shadow-[0_4px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all">
            <Upload size={18} /> Upload Paper
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-2xl border border-border-strong shadow-lg overflow-hidden z-10">
              <button onClick={() => { fileRef.current?.click(); setMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 h-12 text-sm font-semibold text-foreground hover:bg-border transition">
                <ImageIcon size={18} className="text-accent" /> From Album
              </button>
              <div className="h-px bg-border mx-3" />
              <button onClick={() => { setCameraOpen(true); setMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 h-12 text-sm font-semibold text-foreground hover:bg-border transition">
                <Camera size={18} className="text-primary" /> Take Photo
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(handleFile); e.target.value = ""; }} />
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-6">Total errors collected: <span className="font-extrabold text-foreground">{errors.length}</span></p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {subjectGroups.map((s) => (
          <Link key={s.name} href={`/errors/${s.name.toLowerCase()}`} className={`bg-surface rounded-3xl border-2 ${s.color} p-6 ${s.shadow} space-y-3 hover:scale-[1.01] transition-transform relative`}>
            {getNewCount(s.name) > 0 && (
              <span className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center bg-error text-white text-[11px] font-bold rounded-full">
                +{getNewCount(s.name)}
              </span>
            )}
            <div className={`w-[52px] h-[52px] flex items-center justify-center ${s.bg} rounded-2xl text-2xl`}>{s.emoji}</div>
            <h3 className="text-lg font-extrabold text-foreground">{s.name}</h3>
            <p className="text-sm text-text-secondary">{s.count} errors · {s.topics} topics</p>
            <div className="w-full h-2 bg-border rounded-full">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
            </div>
            <p className="text-xs font-bold text-primary">{s.mastered}/{s.count} mastered</p>
          </Link>
        ))}
      </div>

      {sortedWeak.length > 0 && (
        <>
          <h3 className="text-xl font-extrabold text-foreground mb-4">Weakest Areas 🎯</h3>
          <div className="grid grid-cols-3 gap-3">
            {sortedWeak.map(([topic, count], i) => (
              <div key={topic} className={`flex items-center gap-3 px-5 py-4 ${weakColors[i]?.bg} rounded-2xl border-2 ${weakColors[i]?.border}`}>
                <span className={`text-lg font-extrabold font-mono ${weakColors[i]?.color}`}>{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{topic}</p>
                  <p className={`text-xs ${weakColors[i]?.color}`}>{count} errors</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <CameraCapture open={cameraOpen} onCapture={handleFile} onClose={() => setCameraOpen(false)} />
    </div>
  );
}
