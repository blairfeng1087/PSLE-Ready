"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { useStore } from "@/stores/useStore";
import ImageEditor from "@/components/errors/ImageEditor";

const subjects = [
  { key: "Math", emoji: "📐" },
  { key: "Science", emoji: "🔬" },
  { key: "English", emoji: "📝" },
  { key: "Chinese", emoji: "🀄" },
];

type Step = "editing" | "details" | "saving" | "saved";

export default function NewErrorPage() {
  const router = useRouter();
  const { pendingImageUrl, setPendingImage, addError, user } = useStore();
  const [step, setStep] = useState<Step>("editing");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [grade, setGrade] = useState(user.level || "P5");
  const [subject, setSubject] = useState("Math");
  const [note, setNote] = useState("");

  if (!pendingImageUrl && step !== "saving" && step !== "saved") {
    router.replace("/errors");
    return null;
  }

  // Step 1: Edit image (crop, erase, brightness, contrast)
  if (step === "editing" && pendingImageUrl) {
    return (
      <ImageEditor
        imageUrl={pendingImageUrl}
        onSave={(url) => {
          setImageUrl(url);
          setStep("details");
        }}
        onClose={() => { setPendingImage(null); router.back(); }}
      />
    );
  }

  // Step 2: Select subject, grade, optional note
  if (step === "details" && imageUrl) {
    return (
      <div className="p-8 max-w-[600px] mx-auto">
        <button onClick={() => setStep("editing")} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-foreground mb-6">
          <ChevronLeft size={20} /> Back to Edit
        </button>

        <div className="bg-surface rounded-2xl border-2 border-border overflow-hidden mb-6">
          <img src={imageUrl} alt="Error question" className="w-full max-h-[300px] object-contain" />
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold text-foreground block mb-2">Grade</label>
            <div className="flex gap-1.5">
              {["P1","P2","P3","P4","P5","P6"].map((g) => (
                <button key={g} onClick={() => setGrade(g)} className={`h-9 px-3 rounded-xl text-xs font-bold transition ${grade === g ? "bg-accent text-white shadow-[0_3px_0_0_rgba(79,70,229,0.4)]" : "bg-white border-2 border-border-strong text-text-secondary"}`}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground block mb-2">Subject</label>
            <div className="flex gap-2">
              {subjects.map((s) => (
                <button key={s.key} onClick={() => setSubject(s.key)} className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all ${subject === s.key ? "bg-primary text-white shadow-[0_4px_0_0_#059669]" : "bg-white border-2 border-border-strong text-text-secondary"}`}>{s.emoji} {s.key}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground block mb-2">Note <span className="font-normal text-text-muted">(optional)</span></label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ratio word problem, careless mistake"
              className="w-full h-11 px-4 bg-white border-2 border-border-strong rounded-xl text-sm focus:border-primary focus:outline-none transition"
            />
          </div>

          <button
            onClick={() => {
              setStep("saving");
              addError({
                subject,
                topic: "General",
                title: note || "Error question",
                source: "Uploaded",
                difficulty: grade,
                tag: "Not reviewed",
                questionText: note,
                insight: "",
                mastered: false,
                imageUrl,
              });
              setTimeout(() => {
                setStep("saved");
                setTimeout(() => {
                  setPendingImage(null);
                  router.push(`/errors/${subject.toLowerCase()}`);
                }, 800);
              }, 600);
            }}
            className="w-full h-14 bg-primary text-white rounded-2xl text-base font-extrabold shadow-[0_5px_0_0_#059669] hover:brightness-105 active:shadow-[0_2px_0_0_#059669] active:translate-y-0.5 transition-all"
          >
            Save to {subject} Error Book
          </button>
        </div>
      </div>
    );
  }

  // Saving / Saved animation
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className={`transition-all duration-500 ${step === "saved" ? "scale-110" : "scale-100"}`}>
        <FolderOpen size={56} className={`transition-colors duration-300 ${step === "saved" ? "text-primary" : "text-text-muted"}`} />
      </div>
      <p className="text-lg font-bold text-foreground">
        {step === "saved" ? `Saved to ${subject}!` : "Saving..."}
      </p>
    </div>
  );
}
