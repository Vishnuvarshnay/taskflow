import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <span>+</span> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">◫</p>
          <p className="text-slate-300 font-medium">No projects yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Create your first project to get started</p>
          <button className="btn-primary mx-auto" onClick={() => setShowCreate(true)}>Create project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => {
            const myRole = project.members.find(m => m.user)?.role;
            const adminCount = project.members.filter(m => m.role === 'ADMIN').length;
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card hover:border-slate-600 transition-all duration-150 block group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-brand-500/10 text-brand-400 rounded-lg flex items-center justify-center font-semibold text-sm">
                    {project.name[0].toUpperCase()}
                  </div>
                  <span className="badge bg-slate-700/50 text-slate-400 text-xs">
                    {project.members.find(m => m.userId === project.ownerId)?.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">{project.name}</h3>
                {project.description && (
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    {project.members.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        className="w-6 h-6 rounded-full bg-surface-700 border-2 border-surface-900 flex items-center justify-center text-xs text-slate-300 -ml-1 first:ml-0"
                        title={m.user?.name}
                      >
                        {m.user?.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {project.members.length > 4 && (
                      <span className="text-xs text-slate-500 ml-1">+{project.members.length - 4}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{project._count.tasks} tasks</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project name</label>
            <input
              className="input"
              placeholder="My awesome project"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description <span className="text-slate-600 normal-case">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What's this project about?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={creating}>
              {creating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Project'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
