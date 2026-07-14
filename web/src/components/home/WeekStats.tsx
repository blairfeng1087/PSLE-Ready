const stats = [
  { label: "Questions", value: "47", color: "text-primary" },
  { label: "Accuracy", value: "85%", color: "text-accent" },
  { label: "Study time", value: "2h 15m", color: "text-warm" },
  { label: "vs Last week", value: "↑ +12%", color: "text-primary" },
];

export default function WeekStats() {
  return (
    <div className="bg-surface rounded-2xl border-2 border-border p-4 shadow-[0_3px_0_0_rgba(0,0,0,0.03)]">
      <h4 className="text-[15px] font-extrabold text-foreground mb-3">This Week</h4>
      <div className="space-y-2.5">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between items-center">
            <span className="text-xs font-medium text-text-secondary">{s.label}</span>
            <span className={`text-base font-extrabold font-mono ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
