const STATUS_CONFIG = {
  TODO: { label: 'To Do', classes: 'bg-slate-500/15 text-slate-400' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-blue-500/15 text-blue-400' },
  IN_REVIEW: { label: 'In Review', classes: 'bg-amber-500/15 text-amber-400' },
  DONE: { label: 'Done', classes: 'bg-emerald-500/15 text-emerald-400' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
  return <span className={`badge ${cfg.classes}`}>{cfg.label}</span>;
}
