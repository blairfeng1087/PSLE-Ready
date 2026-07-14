"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (!email.trim()) return;
    setUser({ onboarded: true, name: email.split("@")[0] });
    router.push("/");
  }

  function handleSocialLogin() {
    router.push("/onboarding");
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left: Hero */}
      <div className="flex-1 flex flex-col justify-center px-16 relative overflow-hidden">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-accent/5" />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative z-10 max-w-[520px]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-xl shadow-[0_4px_0_0_#059669]">🌱</div>
            <span className="text-xl font-extrabold text-foreground tracking-tight">PSLE Ready</span>
          </div>

          <h1 className="text-[48px] font-extrabold text-foreground tracking-tight leading-[1.08] mb-5">
            Your child&apos;s<br />
            <span className="text-primary">PSLE tutor.</span><br />
            Always ready.
          </h1>

          <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-[400px]">
            Real exam papers from top schools. Aligned to MOE syllabus. Built with senior NIE-trained educators.
          </p>

          {/* Stats */}
          <div className="flex gap-10 mb-10">
            <div>
              <p className="text-2xl font-extrabold text-foreground">1,000+</p>
              <p className="text-xs text-text-muted mt-0.5">Real exam questions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">4 Subjects</p>
              <p className="text-xs text-text-muted mt-0.5">Math · Science · English · Chinese</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">P1–P6</p>
              <p className="text-xs text-text-muted mt-0.5">Full coverage</p>
            </div>
          </div>

          {/* Floating feature cards */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-border">
              <span className="text-sm">📄</span>
              <span className="text-xs font-bold text-foreground">Top School Papers</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-border">
              <span className="text-sm">📚</span>
              <span className="text-xs font-bold text-foreground">Smart Error Book</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-border">
              <span className="text-sm">🌱</span>
              <span className="text-xs font-bold text-foreground">Step-by-step Tutoring</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-border">
              <span className="text-sm">📅</span>
              <span className="text-xs font-bold text-foreground">Daily Practice Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login */}
      <div className="w-[440px] flex flex-col justify-center px-12 shrink-0 border-l border-border">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">Get started</h2>
        <p className="text-sm text-text-secondary mb-8">Free to try · No credit card needed</p>

        <div className="space-y-3">
          <button onClick={handleSocialLogin} className="flex items-center justify-center gap-3 w-full h-12 bg-white border-2 border-border-strong rounded-2xl text-sm font-bold text-foreground hover:bg-border/30 transition">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <button onClick={handleSocialLogin} className="flex items-center justify-center gap-3 w-full h-12 bg-foreground text-white rounded-2xl text-sm font-bold hover:brightness-110 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border-strong" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border-strong" />
          </div>

          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full h-12 px-4 bg-white border-2 border-border-strong rounded-2xl text-sm focus:border-primary focus:outline-none transition" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full h-12 px-4 bg-white border-2 border-border-strong rounded-2xl text-sm focus:border-primary focus:outline-none transition" />

          <button onClick={handleLogin} disabled={!email.trim()} className="w-full h-12 bg-primary text-white rounded-2xl text-base font-extrabold shadow-[0_4px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none">
            Log In
          </button>
        </div>

        <p className="text-[10px] text-text-muted text-center mt-8">
          PSLE Ready is not affiliated with or endorsed by MOE or SEAB.
        </p>
      </div>
    </div>
  );
}
