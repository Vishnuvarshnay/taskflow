const PRIORITY_CONFIG = {
  LOW: { label: 'Low', classes: 'bg-slate-500/15 text-slate-400' },
  MEDIUM: { label: 'Medium', classes: 'bg-blue-500/15 text-blue-400' },
  HIGH: { label: 'High', classes: 'bg-orange-500/15 text-orange-400' },
  URGENT: { label: 'Urgent', classes: 'bg-red-500/15 text-red-400' },
};

export default function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return <span className={`badge ${cfg.classes}`}>{cfg.label}</span>;
}
