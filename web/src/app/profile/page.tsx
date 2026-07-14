"use client";

import Link from "next/link";

const stats = [
  { label: "Total Questions", value: "342", color: "text-foreground" },
  { label: "Avg Accuracy", value: "78%", color: "text-primary" },
  { label: "Study Time", value: "24h", color: "text-accent" },
  { label: "Mastered Topics", value: "12", color: "text-warm" },
];

const achievements = [
  { emoji: "🔥", title: "5 Day Streak", desc: "Keep it going!", unlocked: true },
  { emoji: "⭐", title: "Math Master", desc: "100% on Whole Numbers", unlocked: true },
  { emoji: "📚", title: "100 Questions", desc: "Completed milestone", unlocked: true },
  { emoji: "🔒", title: "Science Pro", desc: "Master all Science topics", unlocked: false },
];

export default function ProfilePage() {
  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-primary-light border-[3px] border-primary flex items-center justify-center text-4xl">🌱</div>
        <div>
          <h2 className="text-[26px] font-extrabold text-foreground">Emily Tan</h2>
          <p className="text-[15px] text-text-secondary">Primary 5 · PSLE 2027</p>
          <div className="flex gap-2 mt-2">
            <span className="h-7 px-3 flex items-center bg-warm-light rounded-full text-xs font-bold text-warm">🔥 5 day streak</span>
            <span className="h-7 px-3 flex items-center bg-primary-light rounded-full text-xs font-bold text-primary">🌱 Level 7</span>
            <span className="h-7 px-3 flex items-center bg-accent-light rounded-full text-xs font-bold text-accent">⭐ 1,250 XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface rounded-2xl border-2 border-border p-5 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
            <p className="text-xs font-bold text-text-secondary">{s.label}</p>
            <p className={`text-[32px] font-extrabold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-extrabold text-foreground mb-4">Achievements 🏆</h3>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {achievements.map((a) => (
          <div key={a.title} className={`bg-surface rounded-3xl border-2 ${a.unlocked ? "border-border" : "border-border-strong bg-border/30"} p-5 text-center shadow-[0_3px_0_0_rgba(0,0,0,0.03)]`}>
            <span className="text-4xl">{a.emoji}</span>
            <p className={`text-sm font-bold mt-2 ${a.unlocked ? "text-foreground" : "text-text-muted"}`}>{a.title}</p>
            <p className={`text-xs ${a.unlocked ? "text-text-secondary" : "text-text-muted"}`}>{a.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-extrabold text-foreground mb-4">All Time Stats 📊</h3>
      <div className="bg-surface rounded-2xl border-2 border-border p-6 shadow-[0_3px_0_0_rgba(0,0,0,0.03)] mb-6">
        <div className="grid grid-cols-2 gap-y-4">
          <div><p className="text-sm text-text-secondary">Total questions answered</p><p className="text-lg font-bold text-primary">342 questions since joining</p></div>
          <div><p className="text-sm text-text-secondary">Average accuracy</p><p className="text-lg font-bold text-primary">78% (+7% this month)</p></div>
        </div>
      </div>

      <Link href="/profile" className="flex items-center gap-3 px-5 py-4 bg-surface rounded-2xl border-2 border-border shadow-[0_3px_0_0_rgba(0,0,0,0.03)] hover:border-primary/30 transition">
        <span className="text-text-secondary">🔒</span>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-foreground">Parent Dashboard</p>
          <p className="text-xs text-text-secondary">View learning report & weak areas (PIN required)</p>
        </div>
        <span className="text-text-muted">›</span>
      </Link>
    </div>
  );
}
