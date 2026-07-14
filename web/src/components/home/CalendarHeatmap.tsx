"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/stores/useStore";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function cellStyle(status: number, isToday: boolean, isFuture: boolean) {
  if (isToday) return "bg-primary ring-2 ring-primary-dark";
  if (isFuture) return "bg-border";
  if (status === 2) return "bg-primary";
  if (status === 1) return "bg-primary/30";
  return "bg-red-100";
}

function textStyle(status: number, isToday: boolean, isFuture: boolean) {
  if (isToday) return "text-white";
  if (status === 2) return "text-white";
  if (isFuture) return "text-text-muted";
  if (status === 1) return "text-primary-dark";
  return "text-red-400";
}

export default function CalendarHeatmap() {
  const practiceLog = useStore((s) => s.practiceLog);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows: { day: number; status: number; isToday: boolean; isFuture: boolean }[][] = [];
    let row: typeof rows[0] = [];

    for (let i = 0; i < firstDay; i++) {
      row.push({ day: 0, status: -1, isToday: false, isFuture: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(year, month, d);
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;
      const status = practiceLog[key] ?? (isFuture ? -1 : 0);
      row.push({ day: d, status, isToday, isFuture });
      if (row.length === 7) { rows.push(row); row = []; }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push({ day: 0, status: -1, isToday: false, isFuture: false });
      rows.push(row);
    }
    return rows;
  }, [year, month, practiceLog]);

  const monthName = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });
  const monthKey = toKey(year, month, 1).slice(0, 7);
  const doneCount = Object.entries(practiceLog).filter(([k, v]) => k.startsWith(monthKey) && v === 2).length;
  const totalPast = weeks.flat().filter((c) => c.day > 0 && !c.isFuture).length;

  function prev() { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); }
  function next() { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); }

  return (
    <div className="bg-surface rounded-2xl border-2 border-border p-4 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-extrabold text-foreground">{monthName}</span>
        <div className="flex gap-1">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition"><ChevronLeft size={16} className="text-text-muted" /></button>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition"><ChevronRight size={16} className="text-text-muted" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <span key={i} className="text-center text-[10px] font-bold text-text-muted py-1">{d}</span>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <div key={ci} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold ${cell.day === 0 ? "" : cellStyle(cell.status, cell.isToday, cell.isFuture)}`}>
                {cell.day > 0 && <span className={textStyle(cell.status, cell.isToday, cell.isFuture)}>{cell.day}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-3">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-primary" /><span className="text-[10px] font-semibold text-text-secondary">Done</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-primary/30" /><span className="text-[10px] font-semibold text-text-secondary">Partial</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-100" /><span className="text-[10px] font-semibold text-text-secondary">Missed</span></div>
        </div>
        <span className="text-[11px] font-bold text-primary">{doneCount}/{totalPast} days</span>
      </div>
    </div>
  );
}
