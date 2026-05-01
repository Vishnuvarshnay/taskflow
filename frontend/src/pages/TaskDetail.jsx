import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { format, parseISO } from 'date-fns';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskDetail() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get(`/tasks/${taskId}`)
      .then(res => {
        setTask(res.data);
        setForm({
          title: res.data.title,
          description: res.data.description || '',
          status: res.data.status,
          priority: res.data.priority,
          dueDate: res.data.dueDate ? format(parseISO(res.data.dueDate), 'yyyy-MM-dd') : '',
          assigneeId: res.data.assigneeId || '',
        });
        return api.get(`/projects/${res.data.projectId}`);
      })
      .then(res => setProject(res.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [taskId]);

  const myMembership = project?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';
  const isCreator = task?.creatorId === user?.id;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tasks/${taskId}`, {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      });
      setTask(res.data);
      setEditing(false);
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      navigate(`/projects/${task.projectId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/projects" className="hover:text-slate-300">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${task.projectId}`} className="hover:text-slate-300">{task.project?.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Task</span>
      </div>

      {/* Main card */}
      <div className="card space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {editing ? (
              <input
                className="input text-base font-semibold"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            ) : (
              <h1 className="text-lg font-semibold text-white">{task.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(isAdmin || isCreator) && !editing && (
              <>
                <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>Edit</button>
                <button className="btn-danger text-xs" onClick={handleDelete}>Delete</button>
              </>
            )}
            {editing && (
              <>
                <button className="btn-primary text-xs" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
                </button>
                <button className="btn-secondary text-xs" onClick={() => setEditing(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          {editing ? (
            <textarea
              className="input resize-none"
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description..."
            />
          ) : (
            <p className="text-slate-400 text-sm">{task.description || <span className="text-slate-600 italic">No description</span>}</p>
          )}
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            {editing ? (
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            ) : (
              <StatusBadge status={task.status} />
            )}
          </div>
          <div>
            <label className="label">Priority</label>
            {editing ? (
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <PriorityBadge priority={task.priority} />
            )}
          </div>
          <div>
            <label className="label">Assignee</label>
            {editing ? (
              <select className="input" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {project?.members?.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-300">
                {task.assignee?.name || <span className="text-slate-500">Unassigned</span>}
              </p>
            )}
          </div>
          <div>
            <label className="label">Due Date</label>
            {editing ? (
              <input type="date" className="input" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            ) : (
              <p className="text-sm text-slate-300">
                {task.dueDate
                  ? format(parseISO(task.dueDate), 'MMM d, yyyy')
                  : <span className="text-slate-500">No due date</span>}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Created by {task.creator?.name}</span>
          <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
