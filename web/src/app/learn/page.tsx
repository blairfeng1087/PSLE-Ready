"use client";

import Link from "next/link";

const subjects = [
  { emoji: "📐", name: "Mathematics", href: "/learn/math", modules: 8, mastered: 2, inProgress: 4, color: "border-primary/30", shadow: "shadow-[0_4px_0_0_rgba(16,185,129,0.12)]" },
  { emoji: "🔬", name: "Science", href: "/learn/science", modules: 5, mastered: 1, inProgress: 3, color: "border-accent/30", shadow: "shadow-[0_4px_0_0_rgba(99,102,241,0.12)]" },
  { emoji: "📝", name: "English", href: "/learn/english", modules: 6, mastered: 2, inProgress: 2, color: "border-warm/30", shadow: "shadow-[0_4px_0_0_rgba(249,115,22,0.12)]" },
  { emoji: "🀄", name: "Chinese", href: "/learn/chinese", modules: 5, mastered: 1, inProgress: 2, color: "border-purple-400/30", shadow: "shadow-[0_4px_0_0_rgba(139,92,246,0.12)]" },
];

export default function LearnPage() {
  return (
    <div className="p-8">
      <h2 className="text-[28px] font-extrabold text-foreground tracking-tight mb-6">Learn 🎓</h2>

      <div className="grid grid-cols-2 gap-5">
        {subjects.map((s) => (
          <Link key={s.name} href={s.href} className={`bg-surface rounded-3xl border-2 ${s.color} p-8 ${s.shadow} hover:scale-[1.01] transition-transform`}>
            <span className="text-4xl">{s.emoji}</span>
            <h3 className="text-2xl font-extrabold text-foreground mt-4">{s.name}</h3>
            <p className="text-sm text-text-secondary mt-1">{s.modules} modules · {s.mastered} mastered · {s.inProgress} in progress</p>
            <div className="w-full h-2.5 bg-border rounded-full mt-4">
              <div className="h-2.5 rounded-full bg-primary" style={{ width: `${((s.mastered + s.inProgress * 0.5) / s.modules) * 100}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
