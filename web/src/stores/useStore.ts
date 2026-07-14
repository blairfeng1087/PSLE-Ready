import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  level: string;
  subjects: string[];
  onboarded: boolean;
}

export interface PracticeTask {
  id: string;
  emoji: string;
  subject: string;
  topic: string;
  desc: string;
  xp: number;
  weak: boolean;
  done: boolean;
}

export interface ErrorItem {
  id: string;
  subject: string;
  topic: string;
  title: string;
  source: string;
  difficulty: string;
  tag: string;
  questionText: string;
  insight: string;
  mastered: boolean;
  createdAt: string;
  imageUrl?: string;
  imagePosition?: "above" | "below";
  extraImages?: string[];
  answerLines?: number;
  correctAnswer?: string;
  contentBlocks?: { type: "text" | "image"; content: string }[];
  paperType?: "syllabus" | "top-school" | "prelim" | "psle";
  paperYear?: number;
}

export interface PracticeLog {
  [date: string]: number; // 0=missed, 1=partial, 2=done
}

interface AppState {
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;

  streak: number;
  xp: number;
  level: number;
  addXp: (amount: number) => void;

  practiceLog: PracticeLog;
  markDay: (date: string, status: number) => void;

  todayTasks: PracticeTask[];
  completeTask: (taskId: string) => void;
  resetDailyTasks: () => void;

  errors: ErrorItem[];
  addError: (error: Omit<ErrorItem, "id" | "createdAt">) => void;
  addErrors: (errors: Omit<ErrorItem, "id" | "createdAt">[]) => void;
  removeError: (id: string) => void;
  toggleMastered: (id: string) => void;
  moveError: (id: string, newSubject: string) => void;
  updateErrorImage: (id: string, imageUrl: string) => void;

  questionBank: ErrorItem[];
  addToBank: (questions: Omit<ErrorItem, "id" | "createdAt">[]) => void;
  removeBankItem: (id: string) => void;
  updateBankImage: (id: string, imageUrl: string) => void;
  toggleBankImagePosition: (id: string) => void;
  addBankExtraImage: (id: string, imageUrl: string) => void;
  updateBankAnswer: (id: string, correctAnswer: string) => void;
  updateBankBlocks: (id: string, blocks: { type: "text" | "image"; content: string }[]) => void;

  pendingImageUrl: string | null;
  setPendingImage: (url: string | null) => void;
}

const defaultTasks: PracticeTask[] = [
  { id: "t1", emoji: "📐", subject: "Math", topic: "Ratio", desc: "3 questions · unchanged quantity", xp: 60, weak: true, done: false },
  { id: "t2", emoji: "📝", subject: "English", topic: "Grammar", desc: "5 questions · tenses", xp: 50, weak: false, done: false },
  { id: "t3", emoji: "📘", subject: "English", topic: "Vocabulary", desc: "3 new words + quiz", xp: 30, weak: false, done: false },
  { id: "t4", emoji: "🀄", subject: "Chinese", topic: "Vocabulary", desc: "3 new words + dictation", xp: 30, weak: false, done: false },
];

const defaultErrors: ErrorItem[] = [
  {
    id: "e1", subject: "Math", topic: "Ratio", title: "Dora and Sarah money problem",
    source: "P5 · 2026 SA1", difficulty: "P6", tag: "Concept unclear",
    questionText: "Dora and Sarah had the same amount of money at first. Dora spent $450 while Sarah received $350 from her grandparents. Sarah had thrice as much money as Dora in the end. How much money did Dora and Sarah have altogether at first?",
    insight: "You set up the model correctly but made an error finding the unchanged quantity. Remember: when one person gains and another loses, the difference changes by the sum of the two amounts.",
    mastered: false, createdAt: "2026-07-08",
  },
  {
    id: "e2", subject: "Science", topic: "Forces", title: "Effect of friction on motion",
    source: "P5 · 2026 CA1", difficulty: "P5", tag: "Not reviewed",
    questionText: "Explain why a ball rolling on grass slows down faster than a ball rolling on a smooth floor.",
    insight: "Focus on comparing the amount of friction on different surfaces. Grass has more friction because of the uneven surface.",
    mastered: false, createdAt: "2026-07-06",
  },
  {
    id: "e3", subject: "Math", topic: "Fraction", title: "3/4 of remaining apples after sharing",
    source: "P5 · 2026 CA1", difficulty: "P5", tag: "Mastered",
    questionText: "Tom had some apples. He gave 1/3 of them to Jerry. He then gave 3/4 of the remaining apples to Mary. He had 12 apples left. How many apples did Tom have at first?",
    insight: "Work backwards from the remainder. If 12 is 1/4 of the remaining (after giving 3/4), then remaining = 48. If 48 is 2/3 of total, then total = 72.",
    mastered: true, createdAt: "2026-07-03",
  },
  {
    id: "e4", subject: "Math", topic: "Percentage", title: "Shop discount 20% then GST 9%",
    source: "P6 · 2025 Prelim", difficulty: "P6", tag: "Careless mistake",
    questionText: "A shop gives a 20% discount on a bag that costs $150. A 9% GST is then added. What is the final price?",
    insight: "You calculated discount correctly ($120) but applied GST to original price instead of discounted price. GST should be 9% of $120 = $10.80, so final = $130.80.",
    mastered: false, createdAt: "2026-07-01",
  },
  {
    id: "e5", subject: "English", topic: "Grammar", title: "Subject-verb agreement with collective nouns",
    source: "P5 · 2026 SA2", difficulty: "P5", tag: "Concept unclear",
    questionText: "Choose the correct word: The team of players (was/were) ready for the match.",
    insight: "'Team' is a collective noun treated as singular in this context. The correct answer is 'was'.",
    mastered: false, createdAt: "2026-06-28",
  },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcStreak(log: PracticeLog): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (i === 0 && !log[key]) { d.setDate(d.getDate() - 1); continue; }
    if (log[key] && log[key] >= 1) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: { name: "Emily", level: "P5", subjects: ["Math", "Science", "English", "Chinese"], onboarded: false },
      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),

      streak: 5,
      xp: 1250,
      level: 7,
      addXp: (amount) => set((s) => {
        const newXp = s.xp + amount;
        const newLevel = Math.floor(newXp / 200) + 1;
        return { xp: newXp, level: newLevel };
      }),

      practiceLog: {
        "2026-07-01": 1, "2026-07-02": 2, "2026-07-03": 2, "2026-07-04": 1,
        "2026-07-05": 2, "2026-07-06": 2, "2026-07-07": 2, "2026-07-08": 2, "2026-07-09": 2,
      },
      markDay: (date, status) => set((s) => ({
        practiceLog: { ...s.practiceLog, [date]: status },
        streak: calcStreak({ ...s.practiceLog, [date]: status }),
      })),

      todayTasks: defaultTasks,
      completeTask: (taskId) => set((s) => {
        const tasks = s.todayTasks.map((t) => t.id === taskId ? { ...t, done: true } : t);
        const task = s.todayTasks.find((t) => t.id === taskId);
        const allDone = tasks.every((t) => t.done);
        const someDone = tasks.some((t) => t.done);
        const key = todayKey();
        return {
          todayTasks: tasks,
          xp: s.xp + (task?.xp ?? 0),
          practiceLog: { ...s.practiceLog, [key]: allDone ? 2 : someDone ? 1 : 0 },
          streak: calcStreak({ ...s.practiceLog, [key]: allDone ? 2 : someDone ? 1 : 0 }),
        };
      }),
      resetDailyTasks: () => set({ todayTasks: defaultTasks }),

      errors: defaultErrors,
      addError: (error) => set((s) => ({
        errors: [{ ...error, id: crypto.randomUUID(), createdAt: todayKey() }, ...s.errors],
      })),
      addErrors: (newErrors) => set((s) => ({
        errors: [
          ...newErrors.map((e) => ({ ...e, id: crypto.randomUUID(), createdAt: todayKey() })),
          ...s.errors,
        ],
      })),
      removeError: (id) => set((s) => ({ errors: s.errors.filter((e) => e.id !== id) })),
      toggleMastered: (id) => set((s) => ({
        errors: s.errors.map((e) => e.id === id ? { ...e, mastered: !e.mastered, tag: e.mastered ? "Not reviewed" : "Mastered" } : e),
      })),
      moveError: (id, newSubject) => set((s) => ({
        errors: s.errors.map((e) => e.id === id ? { ...e, subject: newSubject } : e),
      })),
      updateErrorImage: (id, imageUrl) => set((s) => ({
        errors: s.errors.map((e) => e.id === id ? { ...e, imageUrl } : e),
      })),

      questionBank: [],
      addToBank: (questions) => set((s) => ({
        questionBank: [
          ...questions.map((q) => ({ ...q, id: crypto.randomUUID(), createdAt: todayKey() })),
          ...s.questionBank,
        ],
      })),
      removeBankItem: (id) => set((s) => ({
        questionBank: s.questionBank.filter((q) => q.id !== id),
      })),
      updateBankImage: (id, imageUrl) => set((s) => ({
        questionBank: s.questionBank.map((q) => q.id === id ? { ...q, imageUrl } : q),
      })),
      toggleBankImagePosition: (id) => set((s) => ({
        questionBank: s.questionBank.map((q) => q.id === id ? { ...q, imagePosition: q.imagePosition === "below" ? "above" : "below" } : q),
      })),
      addBankExtraImage: (id, imageUrl) => set((s) => ({
        questionBank: s.questionBank.map((q) => q.id === id ? { ...q, extraImages: [...(q.extraImages || []), imageUrl] } : q),
      })),
      updateBankAnswer: (id, correctAnswer) => set((s) => ({
        questionBank: s.questionBank.map((q) => q.id === id ? { ...q, correctAnswer } : q),
      })),
      updateBankBlocks: (id, blocks) => set((s) => ({
        questionBank: s.questionBank.map((q) => q.id === id ? { ...q, contentBlocks: blocks } : q),
      })),

      pendingImageUrl: null,
      setPendingImage: (url) => set({ pendingImageUrl: url }),
    }),
    { name: "psle-ready-store", partialize: (s) => ({ ...s, pendingImageUrl: null }) }
  )
);
