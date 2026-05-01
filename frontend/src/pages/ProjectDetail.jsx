import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Modal from '../components/Modal';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filterStatus, setFilterStatus] = useState('');

  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' });
  const [savingTask, setSavingTask] = useState(false);

  const [showMember, setShowMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchProject = () => {
    api.get(`/projects/${projectId}`)
      .then(res => setProject(res.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [projectId]);

  const myMembership = project?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      await api.post('/tasks', {
        ...taskForm,
        projectId,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      toast.success('Task created!');
      setShowTask(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' });
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail });
      toast.success('Member added!');
      setShowMember(false);
      setMemberEmail('');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filteredTasks = filterStatus
    ? project.tasks.filter(t => t.status === filterStatus)
    : project.tasks;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/projects')} className="text-xs text-slate-500 hover:text-slate-300 mb-1 flex items-center gap-1">
            ← Projects
          </button>
          <h1 className="text-xl font-semibold text-white">{project.name}</h1>
          {project.description && <p className="text-slate-400 text-sm mt-0.5">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button className="btn-secondary text-xs" onClick={() => setShowMember(true)}>+ Member</button>
              <button className="btn-danger text-xs" onClick={handleDeleteProject}>Delete</button>
            </>
          )}
          <button className="btn-primary text-xs" onClick={() => setShowTask(true)}>+ Task</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {['tasks', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab} {tab === 'tasks' && `(${project.tasks.length})`}
            {tab === 'members' && `(${project.members.length})`}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('')}
              className={`btn text-xs py-1 ${!filterStatus ? 'btn-primary' : 'btn-secondary'}`}
            >All</button>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`btn text-xs py-1 ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500 text-sm">No tasks {filterStatus ? `with status "${filterStatus}"` : 'yet'}</p>
              {!filterStatus && <button className="btn-primary mx-auto mt-3 text-xs" onClick={() => setShowTask(true)}>Create first task</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div key={task.id} className="card hover:border-slate-700 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/tasks/${task.id}`} className="font-medium text-slate-100 hover:text-white group-hover:text-white">
                          {task.title}
                        </a>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {task.assignee && (
                          <span className="text-xs text-slate-500">
                            → {task.assignee.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`text-xs ${isPast(parseISO(task.dueDate)) && task.status !== 'DONE' ? 'text-red-400' : 'text-slate-500'}`}>
                            Due {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value)}
                        className="text-xs bg-surface-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="space-y-2">
          {project.members.map(member => (
            <div key={member.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-semibold text-sm">
                  {member.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{member.user?.name}</p>
                  <p className="text-xs text-slate-500">{member.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge text-xs ${member.role === 'ADMIN' ? 'bg-brand-500/15 text-brand-400' : 'bg-slate-700/50 text-slate-400'}`}>
                  {member.role}
                </span>
                {isAdmin && member.userId !== user.id && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="btn-danger py-1 px-2 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={showTask} onClose={() => setShowTask(false)} title="New Task" size="lg">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Task title" value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional description..."
              value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={savingTask}>
              {savingTask ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Task'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowTask(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showMember} onClose={() => setShowMember(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">User Email</label>
            <input type="email" className="input" placeholder="colleague@example.com"
              value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required autoFocus />
            <p className="text-xs text-slate-500 mt-1.5">The user must already have an account</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={addingMember}>
              {addingMember ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Member'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowMember(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
