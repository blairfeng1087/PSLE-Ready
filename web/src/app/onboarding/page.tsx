"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";

const levels = ["P1", "P2", "P3", "P4", "P5", "P6"];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState("");
  const [name, setName] = useState("");

  function handleComplete() {
    if (!name.trim()) return;
    setUser({ name: name.trim(), level, subjects: ["Math", "Science", "English", "Chinese"], onboarded: true });
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-56 h-56 rounded-full bg-accent/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-[460px] bg-white rounded-3xl shadow-xl border border-border p-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-2xl mx-auto mb-5 shadow-[0_4px_0_0_#059669]">🌱</div>
          <div className="flex gap-2 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? "bg-primary w-10" : "bg-border-strong w-6"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">What level are you in?</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {levels.map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={`h-14 rounded-2xl text-base font-bold transition-all ${level === l ? "bg-primary text-white shadow-[0_4px_0_0_#059669]" : "bg-white border-2 border-border-strong text-text-secondary hover:border-primary/30"}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!level} className="w-full h-12 bg-primary text-white rounded-2xl text-base font-extrabold shadow-[0_5px_0_0_#059669] active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none">
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground text-center mb-2">What&apos;s your name?</h2>
            <p className="text-sm text-text-secondary text-center mb-8">This is how Sproutie will greet you 🌱</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emily"
              autoFocus
              className="w-full h-14 px-5 bg-white border-2 border-border-strong rounded-2xl text-xl text-center font-bold focus:border-primary focus:outline-none transition mb-6"
              onKeyDown={(e) => e.key === "Enter" && handleComplete()}
            />
            <button onClick={handleComplete} disabled={!name.trim()} className="w-full h-12 bg-primary text-white rounded-2xl text-base font-extrabold shadow-[0_5px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none">
              🌱 Start Learning!
            </button>
            <button onClick={() => setStep(1)} className="w-full mt-3 text-sm font-semibold text-text-muted hover:text-foreground transition">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
