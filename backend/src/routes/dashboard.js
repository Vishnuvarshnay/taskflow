const express = require('express');
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - get aggregated stats for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Projects user is in
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { tasks: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });

    // Tasks assigned to user
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Tasks created by user
    const createdTasks = await prisma.task.findMany({
      where: { creatorId: userId },
      include: { project: { select: { id: true, name: true } } }
    });

    // All tasks across user's projects
    const projectIds = projects.map(p => p.id);
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });

    // Overdue tasks (not done, past due date)
    const overdueTasks = allTasks.filter(t =>
      t.dueDate && t.dueDate < now && t.status !== 'DONE'
    );

    // Status breakdown
    const statusBreakdown = {
      TODO: allTasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
      IN_REVIEW: allTasks.filter(t => t.status === 'IN_REVIEW').length,
      DONE: allTasks.filter(t => t.status === 'DONE').length,
    };

    // Recent activity (last 10 tasks updated)
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    res.json({
      summary: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        myTasksCount: myTasks.length,
        overdueCount: overdueTasks.length,
        completedCount: statusBreakdown.DONE,
      },
      statusBreakdown,
      myTasks: myTasks.slice(0, 10),
      overdueTasks: overdueTasks.slice(0, 10),
      recentActivity: recentTasks,
      projects
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
