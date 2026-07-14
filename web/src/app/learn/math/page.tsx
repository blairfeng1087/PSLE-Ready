"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BookOpen, Eye, Send, Loader2, Minus, Maximize2, Minimize2 } from "lucide-react";
import { mathCurriculum, type PracticeQuestion } from "@/lib/curriculum";
import { useStore } from "@/stores/useStore";
import MathText from "@/lib/MathText";

export default function LearnMathPage() {
  const user = useStore((s) => s.user);
  const questionBank = useStore((s) => s.questionBank);
  const [activeLevel, setActiveLevel] = useState(user.level || "P5");
  const [activeTab, setActiveTab] = useState<"syllabus" | "top-school">("syllabus");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const isPaperLevel = activeLevel === "Prelim" || activeLevel === "PSLE";
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [tutorQuestion, setTutorQuestion] = useState<string | null>(null);

  function checkAnswer(qId: string) {
    setSubmitted((p) => ({ ...p, [qId]: true }));
  }

  function extractNumbers(s: string): string[] {
    return (s.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(n => String(parseFloat(n.replace(/,/g, ""))));
  }

  function getAnswerType(answer: string): "yesno" | "truefalse" | "number" | "self-check" {
    const lower = answer.trim().toLowerCase();
    if (lower === "yes" || lower === "no") return "yesno";
    if (lower === "true" || lower === "false") return "truefalse";
    // Check if answer is mainly numbers (strip all numbers, commas, dots, units, spaces)
    const stripped = answer.replace(/[\d,.\s°²³$%()/:×÷−+R-]+/g, "").replace(/cm|kg|ml|km|m²|cm²|m³|cm³|min|hr/gi, "").trim();
    if (stripped.length <= 5) return "number";
    return "self-check";
  }

  function isCorrect(qId: string, correctAnswer: string): boolean {
    const raw = (userAnswers[qId] || "").trim();
    if (!raw) return false;

    if (raw.toLowerCase() === correctAnswer.trim().toLowerCase()) return true;

    const type = getAnswerType(correctAnswer);

    if (type === "yesno" || type === "truefalse") {
      return false;
    }

    if (type === "number") {
      const userNums = extractNumbers(raw);
      const correctNums = extractNumbers(correctAnswer);
      if (correctNums.length === 0) return false;
      // Exact sequence match
      if (userNums.join(",") === correctNums.join(",")) return true;
      // Sorted match for unordered lists (e.g. factors)
      if (userNums.length === correctNums.length && [...userNums].sort((a,b) => +a - +b).join(",") === [...correctNums].sort((a,b) => +a - +b).join(",")) return true;
      return false;
    }

    return false;
  }

  const grade = mathCurriculum.grades.find((g) => g.level === activeLevel);
  const activeTopicData = grade?.topics.find((t) => t.id === activeTopic);

  return (
    <div className="flex h-full">
      {/* Left: Chapter list */}
      <div className="w-[320px] border-r-2 border-border-strong flex flex-col bg-background shrink-0">
        {/* Level selector */}
        <div className="px-5 py-4">
          <h3 className="text-lg font-extrabold text-foreground mb-3">📐 Mathematics</h3>
          <div className="flex gap-1.5 flex-wrap">
            {mathCurriculum.grades.map((g) => (
              <button
                key={g.level}
                onClick={() => { setActiveLevel(g.level); setActiveTab("syllabus"); setActiveTopic(null); }}
                className={`h-9 px-3 rounded-xl text-xs font-bold transition ${activeLevel === g.level ? "bg-primary text-white shadow-[0_3px_0_0_#059669]" : "bg-white border-2 border-border-strong text-text-secondary hover:border-primary/30"}`}
              >
                {g.level}
              </button>
            ))}
            <div className="w-px bg-border-strong mx-1" />
            <button onClick={() => { setActiveLevel("Prelim"); setActiveTopic(null); }} className={`h-9 px-3 rounded-xl text-xs font-bold transition ${activeLevel === "Prelim" ? "bg-accent text-white shadow-[0_3px_0_0_rgba(79,70,229,0.4)]" : "bg-white border-2 border-accent/30 text-accent hover:border-accent/50"}`}>
              Prelim
            </button>
            <button onClick={() => { setActiveLevel("PSLE"); setActiveTopic(null); }} className={`h-9 px-3 rounded-xl text-xs font-bold transition ${activeLevel === "PSLE" ? "bg-warm text-white shadow-[0_3px_0_0_rgba(234,88,12,0.4)]" : "bg-white border-2 border-warm/30 text-warm hover:border-warm/50"}`}>
              PSLE
            </button>
          </div>
        </div>

        <div className="h-px bg-border-strong" />

        {!isPaperLevel && !["P1", "P2"].includes(activeLevel) && (
          <div className="px-5 py-3">
            <div className="flex bg-border-strong rounded-xl p-0.5">
              <button onClick={() => { setActiveTab("syllabus"); setActiveTopic(null); }} className={`flex-1 h-8 rounded-lg text-xs font-bold transition ${activeTab === "syllabus" ? "bg-white text-foreground shadow-sm" : "text-text-muted"}`}>
                Syllabus
              </button>
              <button onClick={() => { setActiveTab("top-school"); setActiveTopic(null); }} className={`flex-1 h-8 rounded-lg text-xs font-bold transition ${activeTab === "top-school" ? "bg-white text-foreground shadow-sm" : "text-text-muted"}`}>
                Top School Papers
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isPaperLevel || activeTab === "top-school" ? (
            (() => {
              const paperTypeFilter = isPaperLevel ? (activeLevel === "Prelim" ? "prelim" : "psle") : "top-school";
              const tabQs = questionBank.filter(q => q.subject === "Math" && q.paperType === paperTypeFilter);
              const years = [...new Set(tabQs.map(q => q.paperYear || 0))].sort((a, b) => b - a);
              if (years.length === 0) return (
                <div className="flex items-center justify-center h-40 text-sm text-text-muted">No papers yet</div>
              );
              return years.map(year => {
                const yearQs = tabQs.filter(q => q.paperYear === year);
                const papers = [...new Set(yearQs.map(q => q.source))];
                return (
                  <div key={year}>
                    <div className="px-5 py-2 bg-border/50">
                      <span className="text-xs font-bold text-text-muted">{year}</span>
                    </div>
                    {papers.map(paper => {
                      const count = yearQs.filter(q => q.source === paper).length;
                      const key = `${year}-${paper}`;
                      return (
                        <button key={key} onClick={() => setActiveTopic(key)} className={`flex items-center justify-between w-full px-5 py-3 text-left border-b border-border-strong transition ${activeTopic === key ? "bg-primary-light" : "hover:bg-border/30"}`}>
                          <span className={`text-sm font-medium ${activeTopic === key ? "text-primary font-bold" : "text-foreground"}`}>{paper}</span>
                          <span className="text-xs text-text-muted">{count}q</span>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()
          ) : (
            grade?.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`flex items-center gap-3 w-full px-5 py-3 text-left border-b border-border-strong transition ${activeTopic === topic.id ? "bg-primary-light" : "hover:bg-border/30"}`}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${activeTopic === topic.id ? "bg-primary text-white" : "bg-border text-text-muted"}`}>
                  {topic.chapter}
                </span>
                <span className={`text-sm font-medium ${activeTopic === topic.id ? "text-primary font-bold" : "text-foreground"}`}>
                  {topic.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Topic detail */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        {(isPaperLevel || activeTab === "top-school") && activeTopic ? (
          (() => {
            const [yearStr, ...paperParts] = activeTopic.split("-");
            const paper = paperParts.join("-");
            const paperTypeFilter = isPaperLevel ? (activeLevel === "Prelim" ? "prelim" : "psle") : "top-school";
            const paperQs = questionBank.filter(q => q.subject === "Math" && q.paperType === paperTypeFilter && q.paperYear === Number(yearStr) && q.source === paper);
            return (
              <>
                <h2 className="text-2xl font-extrabold text-foreground mb-1">{paper}</h2>
                <p className="text-sm text-text-secondary mb-6">{yearStr} · {activeLevel} · {paperQs.length} questions</p>
                <div className="space-y-4">
                  {paperQs.map((q, i) => (
                    <div key={q.id} className="border-2 rounded-2xl bg-white border-border p-5">
                      {q.contentBlocks ? (
                        q.contentBlocks.map((block, bi) => (
                          block.type === "image"
                            ? <img key={bi} src={block.content} alt="" className="max-w-[80%] max-h-[240px] object-contain my-2" />
                            : <p key={bi} className="text-sm text-foreground leading-relaxed"><MathText text={block.content} /></p>
                        ))
                      ) : (
                        <>
                          {q.imageUrl && <img src={q.imageUrl} alt="" className="max-w-[80%] max-h-[240px] object-contain mb-2" />}
                          <p className="text-sm text-foreground leading-relaxed"><MathText text={q.questionText} /></p>
                        </>
                      )}
                      {q.correctAnswer ? (
                        <div className="mt-3">
                          {!submitted[q.id] ? (
                            <div className="flex items-center gap-3">
                              <input type="text" value={userAnswers[q.id] || ""} onChange={(e) => setUserAnswers(p => ({ ...p, [q.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && (userAnswers[q.id] || "").trim() && setSubmitted(p => ({ ...p, [q.id]: true }))} placeholder="Your answer" className="flex-1 h-10 px-4 bg-white border-2 border-border-strong rounded-xl text-sm focus:border-primary focus:outline-none transition" />
                              <button onClick={() => setSubmitted(p => ({ ...p, [q.id]: true }))} disabled={!(userAnswers[q.id] || "").trim()} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-[0_3px_0_0_#059669] disabled:opacity-30 disabled:shadow-none transition">Submit</button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold mb-2">{isCorrect(q.id, q.correctAnswer) ? "✅ Correct!" : "❌ Not quite."}</p>
                              <button onClick={() => setShowSolution(p => ({ ...p, [q.id]: !p[q.id] }))} className="h-8 px-3 text-xs font-bold text-accent border border-accent/30 rounded-lg">{showSolution[q.id] ? "Hide" : "View Answer"}</button>
                              {showSolution[q.id] && <p className="mt-2 text-sm font-bold text-primary">Answer: <MathText text={q.correctAnswer} /></p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-text-muted">No answer key available · Ask Tutor for help</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()
        ) : activeTopicData ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-bold text-primary mb-1">{activeLevel} · Chapter {activeTopicData.chapter}</p>
                <h2 className="text-2xl font-extrabold text-foreground">{activeTopicData.name}</h2>
              </div>
            </div>

            <div className="bg-primary-light border-2 border-primary/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={18} className="text-primary" />
                <p className="text-sm font-bold text-primary">Overview</p>
              </div>
              <p className="text-[15px] text-foreground leading-relaxed">{activeTopicData.summary}</p>
            </div>

            <div className="bg-white border-2 border-border rounded-2xl p-6 mb-6">
              <h3 className="text-base font-extrabold text-foreground mb-4">Key Points to Remember</h3>
              <div className="space-y-3">
                {activeTopicData.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-lg text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {activeTopicData.examples && activeTopicData.examples.length > 0 && (
              <div className="bg-accent-light border-2 border-accent/20 rounded-2xl p-6">
                <h3 className="text-base font-extrabold text-foreground mb-4">📝 Worked Examples</h3>
                <div className="space-y-4">
                  {activeTopicData.examples.map((ex, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-border">
                      <p className="text-sm font-bold text-foreground mb-3">Example {i + 1}: <MathText text={ex.question} /></p>
                      <div className="bg-background rounded-lg p-4">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Solution</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line"><MathText text={ex.solution} /></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Section */}
            {activeTopicData.practice && activeTopicData.practice.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px bg-border-strong" />
                  <span className="text-sm font-bold text-text-muted">PRACTICE</span>
                  <div className="flex-1 h-px bg-border-strong" />
                </div>

                {(["basic", "intermediate", "challenging"] as const).map((diff) => {
                  const qs = activeTopicData.practice!.filter((q) => q.difficulty === diff);
                  if (qs.length === 0) return null;
                  const labels = { basic: { label: "⭐ Basic", color: "bg-primary-light border-primary/20 text-primary" }, intermediate: { label: "⭐⭐ Intermediate", color: "bg-warm-light border-warm/20 text-warm" }, challenging: { label: "⭐⭐⭐ Challenging", color: "bg-accent-light border-accent/20 text-accent" } };
                  const { label, color } = labels[diff];

                  return (
                    <div key={diff} className="mb-6">
                      <span className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-bold border mb-3 ${color}`}>{label}</span>
                      <div className="space-y-3">
                        {qs.map((q, i) => {
                          const didSubmit = submitted[q.id];
                          const correct = didSubmit ? isCorrect(q.id, q.answer) : false;
                          const hasInput = (userAnswers[q.id] || "").trim().length > 0;

                          return (
                          <div key={q.id} className={`border-2 rounded-2xl p-5 transition ${didSubmit ? (correct ? "bg-primary-light/50 border-primary/30" : "bg-error-light/50 border-error/30") : "bg-white border-border"}`}>
                            <div className="flex items-start justify-between mb-3">
                              <p className="text-sm font-bold text-foreground">Q{i + 1}. <MathText text={q.question} /></p>
                              <button onClick={() => alert("Thank you for reporting. We will review this question.")} className="text-text-muted/40 hover:text-text-muted text-[10px] ml-2 shrink-0 mt-0.5" title="Report an issue with this question">⚑</button>
                            </div>
                            {q.figure && (
                              <div className="mb-3 bg-background rounded-xl p-4 flex justify-center" dangerouslySetInnerHTML={{ __html: q.figure }} style={{ maxWidth: 400 }} />
                            )}

                            {(() => {
                              const ansType = getAnswerType(q.answer);

                              // Options (multiple choice) → button selection
                              if (q.options && !didSubmit) {
                                return (
                                  <div className="flex gap-3 flex-wrap">
                                    {q.options.map((opt) => (
                                      <button key={opt} onClick={() => { setUserAnswers((p) => ({ ...p, [q.id]: opt })); setTimeout(() => setSubmitted((p) => ({ ...p, [q.id]: true })), 50); }} className="flex-1 min-w-[80px] h-11 rounded-xl text-sm font-bold border-2 border-border-strong bg-white hover:border-primary/40 transition shadow-[0_2px_0_0_rgba(0,0,0,0.05)]">
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                );
                              }

                              // Yes/No or True/False → button selection
                              if ((ansType === "yesno" || ansType === "truefalse") && !didSubmit) {
                                const opts = ansType === "yesno" ? ["Yes", "No"] : ["True", "False"];
                                return (
                                  <div className="flex gap-3">
                                    {opts.map((opt) => (
                                      <button key={opt} onClick={() => { setUserAnswers((p) => ({ ...p, [q.id]: opt })); setTimeout(() => setSubmitted((p) => ({ ...p, [q.id]: true })), 50); }} className="flex-1 h-11 rounded-xl text-sm font-bold border-2 border-border-strong bg-white hover:border-primary/40 transition shadow-[0_2px_0_0_rgba(0,0,0,0.05)]">
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                );
                              }

                              // Self-check mode: no auto-grading, just reveal answer
                              if (ansType === "self-check") {
                                return (
                                  <div>
                                    {!showSolution[q.id] ? (
                                      <button onClick={() => setShowSolution((p) => ({ ...p, [q.id]: true }))} className="h-10 px-5 bg-accent text-white rounded-xl text-sm font-bold shadow-[0_3px_0_0_rgba(79,70,229,0.4)] transition">
                                        View Answer
                                      </button>
                                    ) : (
                                      <div>
                                        <div className="bg-accent-light rounded-xl p-4 border border-accent/20">
                                          <p className="text-xs font-bold text-accent mb-1">Standard Answer</p>
                                          <p className="text-sm font-bold text-foreground"><MathText text={q.answer} /></p>
                                          {q.solution && <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mt-2"><MathText text={q.solution} /></p>}
                                        </div>
                                        <button onClick={() => setTutorQuestion(q.question + "\n\nCorrect answer: " + q.answer)} className="mt-2 h-9 px-4 flex items-center gap-1.5 text-sm font-bold text-primary border-2 border-primary/30 rounded-xl hover:bg-primary-light transition">
                                          🌱 Don&apos;t understand? Ask Tutor
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Number answer → input + submit (100% accurate grading)
                              if (!didSubmit) {
                                return (
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={userAnswers[q.id] || ""}
                                      onChange={(e) => { setUserAnswers((p) => ({ ...p, [q.id]: e.target.value })); setSubmitted((p) => ({ ...p, [q.id]: false })); setShowSolution((p) => ({ ...p, [q.id]: false })); }}
                                      onKeyDown={(e) => e.key === "Enter" && hasInput && checkAnswer(q.id)}
                                      placeholder="Your answer"
                                      className="flex-1 h-10 px-4 bg-white border-2 border-border-strong rounded-xl text-sm focus:border-primary focus:outline-none transition"
                                    />
                                    <button onClick={() => checkAnswer(q.id)} disabled={!hasInput} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold shadow-[0_3px_0_0_#059669] disabled:opacity-30 disabled:shadow-none transition">
                                      Submit
                                    </button>
                                  </div>
                                );
                              }

                              // Already submitted (numeric) → show disabled input
                              return (
                                <div className="flex items-center gap-3">
                                  <input type="text" value={userAnswers[q.id] || ""} disabled className="flex-1 h-10 px-4 bg-primary-light border-2 border-primary/30 rounded-xl text-sm" />
                                </div>
                              );
                            })()}

                            {/* Feedback: auto-graded (numeric/yesno) */}
                            {didSubmit && (
                              <div className="mt-3">
                                {correct ? (
                                  <p className="text-sm font-bold text-primary">✅ Correct! Well done!</p>
                                ) : (
                                  <p className="text-sm font-bold text-error">❌ Not quite. Try again or view the answer.</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => setShowSolution((p) => ({ ...p, [q.id]: !p[q.id] }))} className="h-9 px-4 flex items-center gap-1.5 text-sm font-bold text-accent border-2 border-accent/30 rounded-xl hover:bg-accent-light transition">
                                    <Eye size={14} /> {showSolution[q.id] ? "Hide Answer" : "View Answer"}
                                  </button>
                                  {!correct && (
                                    <button onClick={() => setTutorQuestion(q.question + "\n\nCorrect answer: " + q.answer)} className="h-9 px-4 flex items-center gap-1.5 text-sm font-bold text-primary border-2 border-primary/30 rounded-xl hover:bg-primary-light transition">
                                      🌱 Ask Tutor
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* View answer (shared for both modes) */}
                            {showSolution[q.id] && (
                              <div className="mt-3 bg-white rounded-xl p-4 border border-border">
                                <p className="text-xs font-bold text-primary mb-1">Answer: <MathText text={q.answer} /></p>
                                {q.solution && <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mt-2"><MathText text={q.solution} /></p>}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Question Bank questions matching this topic */}
            {(() => {
              const topicName = activeTopicData.name.toLowerCase();
              const topicKeywords = topicName.split(/[\s&()/]+/).filter(w => w.length > 2);
              const bankQs = questionBank.filter(q => {
                if (q.subject !== "Math") return false;
                if (q.paperType && q.paperType !== "syllabus") return false;
                if (q.difficulty && q.difficulty !== activeLevel) return false;
                const qt = (q.topic || "").toLowerCase();
                if (qt === topicName) return true;
                return topicKeywords.some(kw => qt.includes(kw)) || qt.split(/[\s&()/]+/).filter(w => w.length > 2).some(kw => topicName.includes(kw));
              });
              if (bankQs.length === 0) return null;
              return (
                <>
                  <div className="flex items-center gap-3 my-8">
                    <div className="flex-1 h-px bg-border-strong" />
                    <span className="text-sm font-bold text-text-muted">EXAM QUESTIONS</span>
                    <div className="flex-1 h-px bg-border-strong" />
                  </div>
                  <div className="space-y-3">
                    {bankQs.map((q, i) => (
                      <div key={q.id} className="border-2 rounded-2xl bg-white border-border overflow-hidden p-5">
                        {q.contentBlocks ? (
                          <>
                            <p className="text-xs text-text-muted mb-2">{q.difficulty} · {q.source}</p>
                            {q.contentBlocks.map((block, bi) => (
                              block.type === "image"
                                ? <img key={bi} src={block.content} alt="" className="max-w-[70%] max-h-[200px] object-contain my-2" />
                                : <p key={bi} className="text-sm text-foreground leading-relaxed"><MathText text={block.content} /></p>
                            ))}
                          </>
                        ) : (
                          <>
                            {q.imageUrl && q.imagePosition !== "below" && (
                              <img src={q.imageUrl} alt="" className="max-w-[70%] max-h-[200px] object-contain mb-2" />
                            )}
                            <p className="text-sm font-bold text-foreground mb-1">Q{i + 1}. <MathText text={q.questionText} /></p>
                            <span className="text-xs text-text-muted">{q.difficulty} · {q.source}</span>
                            {q.imageUrl && q.imagePosition === "below" && (
                              <img src={q.imageUrl} alt="" className="max-w-[70%] max-h-[200px] object-contain mt-2" />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">📐 {activeLevel} Mathematics</h2>
            <p className="text-sm text-text-secondary mb-8">{grade?.topics.length} chapters · Select a chapter to start learning</p>

            {/* Progress overview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border-2 border-border rounded-2xl p-5 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
                <p className="text-xs font-bold text-text-muted mb-1">Chapters</p>
                <p className="text-3xl font-extrabold text-foreground">{grade?.topics.length}</p>
              </div>
              <div className="bg-white border-2 border-border rounded-2xl p-5 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
                <p className="text-xs font-bold text-text-muted mb-1">Practice Questions</p>
                <p className="text-3xl font-extrabold text-primary">{grade?.topics.reduce((sum, t) => sum + (t.practice?.length || 0), 0)}</p>
              </div>
              <div className="bg-white border-2 border-border rounded-2xl p-5 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
                <p className="text-xs font-bold text-text-muted mb-1">Worked Examples</p>
                <p className="text-3xl font-extrabold text-accent">{grade?.topics.reduce((sum, t) => sum + (t.examples?.length || 0), 0)}</p>
              </div>
            </div>

            {/* Chapter list cards */}
            <h3 className="text-base font-extrabold text-foreground mb-4">Chapters</h3>
            <div className="grid grid-cols-2 gap-3">
              {grade?.topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className="flex items-center gap-3 bg-white border-2 border-border rounded-2xl p-4 text-left hover:border-primary/30 transition shadow-[0_2px_0_0_rgba(0,0,0,0.03)]"
                >
                  <span className="w-9 h-9 flex items-center justify-center bg-primary-light text-primary rounded-xl text-sm font-bold shrink-0">{topic.chapter}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{topic.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {topic.practice?.length ? `${topic.practice.length} questions` : "No practice yet"}
                      {topic.examples?.length ? ` · ${topic.examples.length} examples` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tutor Chat */}
      {tutorQuestion && <TutorPopup question={tutorQuestion} onClose={() => setTutorQuestion(null)} />}
    </div>
  );
}

// --- Floating Tutor Chat Popup ---
interface ChatMsg { role: "user" | "tutor"; text: string }

function TutorPopup({ question, onClose }: { question: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function start() {
      setLoading(true);
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, messages: [], subject: "Math" }),
        });
        const data = await res.json();
        setMessages([{ role: "tutor", text: data.text || "Sproutie is taking a short break. Try again! 🌱" }]);
      } catch {
        setMessages([{ role: "tutor", text: "Sproutie is taking a short break. Try again! 🌱" }]);
      }
      setLoading(false);
    }
    start();
  }, [question]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", text: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, subject: "Math", messages: updated.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text })) }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "tutor", text: data.text || "Let me think... try again! 🌱" }]);
    } catch {
      setMessages([...updated, { role: "tutor", text: "Sproutie is resting. Try again! 🌱" }]);
    }
    setLoading(false);
  }

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)} className="fixed bottom-6 right-6 h-12 px-5 bg-primary text-white rounded-full flex items-center gap-2 shadow-lg shadow-primary/30 hover:brightness-105 transition z-50">
        <span>🌱</span><span className="text-sm font-bold">Sproutie</span>
        {messages.length > 0 && <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{messages.length}</span>}
      </button>
    );
  }

  return (
    <div className={`fixed bg-white rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden z-50 transition-all duration-200 ${expanded ? "bottom-4 right-4 w-[600px] h-[700px]" : "bottom-6 right-6 w-[400px] h-[520px]"}`}>
      <div className="flex items-center justify-between px-5 py-3.5 bg-primary shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌱</span>
          <span className="text-sm font-bold text-white">Sproutie</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition rounded-full hover:bg-white/10"><Minus size={16} /></button>
          <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition rounded-full hover:bg-white/10">{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "tutor" && <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5">🌱</div>}
            <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-white rounded-[16px_4px_16px_16px]" : "bg-background border border-border rounded-[4px_16px_16px_16px] text-foreground"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs">🌱</div><Loader2 size={16} className="text-primary animate-spin" /></div>}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type your answer..." className="flex-1 h-9 px-4 bg-background border border-border-strong rounded-full text-sm focus:border-primary focus:outline-none transition" />
        <button onClick={send} disabled={!input.trim() || loading} className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"><Send size={16} /></button>
      </div>
    </div>
  );
}
