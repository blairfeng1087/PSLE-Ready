"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Sprout, Upload, Camera, Image as ImageIcon, CalendarCheck, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import CalendarHeatmap from "@/components/home/CalendarHeatmap";
import WeekStats from "@/components/home/WeekStats";
import CameraCapture from "@/components/errors/CameraCapture";
import { useStore } from "@/stores/useStore";

const errorItems = [
  { emoji: "📐", topic: "Ratio", count: 3, color: "bg-error-light text-error" },
  { emoji: "🔬", topic: "Forces", count: 2, color: "bg-warm-light text-warm" },
];

export default function HomePage() {
  const { user, streak, xp, level, todayTasks, errors, setPendingImage } = useStore();
  const router = useRouter();
  const doneCount = todayTasks.filter((t) => t.done).length;
  const unreviewedErrors = errors.filter((e) => !e.mastered).length;

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

  return (
    <div className="h-full w-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-foreground">Hi {user.name} 🌱 <span className="text-base font-bold text-text-secondary ml-1">{user.level}</span></h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 h-10 px-4 bg-warm-light border-2 border-warm/30 rounded-full text-sm font-extrabold text-warm">
            <Flame size={16} /> {streak}
          </span>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-full text-sm font-bold shadow-[0_4px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all">
              <Upload size={16} /> Upload Paper
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
      </div>

      <div className="flex gap-6 w-full">
        <div className="flex-1 flex gap-5 min-w-0 items-stretch" style={{ flexShrink: 1 }}>
          <Link href="/learn/math" className="flex-1 bg-surface rounded-3xl border-2 border-primary/20 p-6 shadow-[0_5px_0_0_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-transform flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-2xl shadow-[0_4px_0_0_#059669]">
                <CalendarCheck size={24} className="text-white" />
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground mb-1">Daily Practice</h3>
            <p className="text-sm text-text-secondary mb-3">{doneCount}/{todayTasks.length} done · ~18 min</p>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span>📐</span><span className="text-text-secondary">Math · Ratio</span>
                <span className="ml-auto h-5 px-1.5 bg-error text-white text-[9px] font-bold rounded-lg flex items-center">Weak</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>📝</span><span className="text-text-secondary">English · Grammar</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>🀄</span><span className="text-primary font-semibold">Completed ✅</span>
              </div>
            </div>
            <button className="w-full h-11 mt-4 bg-primary text-white rounded-2xl text-sm font-extrabold shadow-[0_4px_0_0_#059669]">
              ▶ Start Practice
            </button>
          </Link>

          <Link href="/errors" className="flex-1 bg-surface rounded-3xl border-2 border-accent/20 p-6 shadow-[0_5px_0_0_rgba(99,102,241,0.15)] hover:scale-[1.01] transition-transform flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-2xl shadow-[0_4px_0_0_rgba(79,70,229,0.6)]">
                <BookOpen size={24} className="text-white" />
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground mb-1">Error Review</h3>
            <p className="text-sm text-text-secondary mb-3">{unreviewedErrors} errors to revisit</p>
            <div className="space-y-2 flex-1">
              {errorItems.map((e) => (
                <div key={e.topic} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${e.color.split(" ")[0]}`}>
                  <span>{e.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{e.topic}</span>
                  <span className={`ml-auto text-xs font-bold ${e.color.split(" ")[1]}`}>{e.count}q</span>
                </div>
              ))}
            </div>
            <div className="w-full h-11 mt-4 flex items-center justify-center bg-accent text-white rounded-2xl text-sm font-extrabold shadow-[0_4px_0_0_rgba(79,70,229,0.6)]">
              Review Errors
            </div>
          </Link>

          <Link href="/learn" className="flex-1 bg-surface rounded-3xl border-2 border-warm/20 p-6 shadow-[0_5px_0_0_rgba(249,115,22,0.15)] hover:scale-[1.01] transition-transform flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-warm rounded-2xl shadow-[0_4px_0_0_rgba(234,88,12,0.6)]">
                <GraduationCap size={24} className="text-white" />
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground mb-1">Today&apos;s Lesson</h3>
            <p className="text-sm text-text-secondary mb-3">Continue learning</p>
            <div className="space-y-2 flex-1">
              <div className="px-3 py-2 bg-primary-light rounded-xl">
                <p className="text-sm font-bold text-foreground">📐 Ratio</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-green-200 rounded-full"><div className="h-1.5 rounded-full bg-primary" style={{ width: "30%" }} /></div>
                  <span className="text-[10px] font-bold text-primary">30%</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-accent-light rounded-xl">
                <p className="text-sm font-bold text-foreground">📝 Tenses</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-indigo-200 rounded-full"><div className="h-1.5 rounded-full bg-accent" style={{ width: "65%" }} /></div>
                  <span className="text-[10px] font-bold text-accent">65%</span>
                </div>
              </div>
            </div>
            <div className="w-full h-11 mt-4 flex items-center justify-center bg-warm text-white rounded-2xl text-sm font-extrabold shadow-[0_4px_0_0_rgba(234,88,12,0.6)]">
              Continue Learning
            </div>
          </Link>
        </div>

        <div className="w-[280px] shrink-0 space-y-4" style={{ flexShrink: 0 }}>
          <CalendarHeatmap />
          <WeekStats />
        </div>
      </div>
      <CameraCapture open={cameraOpen} onCapture={handleFile} onClose={() => setCameraOpen(false)} />
    </div>
  );
}
