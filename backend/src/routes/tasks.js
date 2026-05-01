const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma/client');
const { authenticate, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks?projectId=xxx - list tasks for a project
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    // Verify membership
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } }
    });
    if (!member) return res.status(403).json({ error: 'Not a project member' });

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - create task
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('projectId is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
  body('assigneeId').optional(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, projectId, status, priority, dueDate, assigneeId } = req.body;

    // Check membership
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } }
    });
    if (!member) return res.status(403).json({ error: 'Not a project member' });

    // If assigning, ensure assignee is a member
    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId } }
      });
      if (!assigneeMember) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        creatorId: req.user.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:taskId - get single task
router.get('/:taskId', authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check membership
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:taskId - update task
router.put('/:taskId', authenticate, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
  body('assigneeId').optional(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // If assigning, validate assignee is member
    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId: task.projectId } }
      });
      if (!assigneeMember) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:taskId - delete task (admin or creator)
router.delete('/:taskId', authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    // Only admin or task creator can delete
    if (member.role !== 'ADMIN' && task.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only admins or task creator can delete tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
