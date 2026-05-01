import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const StatCard = ({ label, value, icon, accent }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, statusBreakdown, myTasks, overdueTasks, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's what's happening across your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Projects" value={summary.totalProjects} icon="◫" accent="bg-blue-500/10 text-blue-400" />
        <StatCard label="My Tasks" value={summary.myTasksCount} icon="✓" accent="bg-brand-500/10 text-brand-400" />
        <StatCard label="Completed" value={summary.completedCount} icon="✦" accent="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Overdue" value={summary.overdueCount} icon="⚠" accent="bg-red-500/10 text-red-400" />
      </div>

      {/* Status breakdown */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Task Status Overview</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} className="bg-surface-800 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{status.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">My Tasks</h2>
            <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No tasks assigned to you</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 5).map(task => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-800 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate group-hover:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    {task.dueDate && (
                      <span className={`text-xs ${isPast(parseISO(task.dueDate)) && task.status !== 'DONE' ? 'text-red-400' : 'text-slate-500'}`}>
                        {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">
              Overdue Tasks
              {overdueTasks.length > 0 && (
                <span className="ml-2 badge bg-red-500/15 text-red-400">{overdueTasks.length}</span>
              )}
            </h2>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-emerald-400 text-2xl mb-2">✓</p>
              <p className="text-slate-500 text-sm">No overdue tasks!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map(task => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-800 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate group-hover:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-red-400">
                      {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map(task => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-surface-800 transition-colors"
              >
                <StatusBadge status={task.status} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-200">{task.title}</span>
                  <span className="text-xs text-slate-500 ml-2">in {task.project.name}</span>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
