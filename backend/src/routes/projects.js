const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma/client');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - list all projects user is a member of
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.id } }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create a project
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId - get single project
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId - update project (admin only)
router.put('/:projectId', authenticate, requireProjectAdmin, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } }
      }
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:projectId - delete project (admin only)
router.delete('/:projectId', authenticate, requireProjectAdmin, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/members - invite member (admin only)
router.post('/:projectId/members', authenticate, requireProjectAdmin, [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role = 'MEMBER' } = req.body;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId: req.params.projectId } }
    });
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId: req.params.projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId/members/:userId - change member role (admin only)
router.put('/:projectId/members/:userId', authenticate, requireProjectAdmin, [
  body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId } },
      data: { role: req.body.role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(member);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:projectId/members/:userId - remove member (admin only)
router.delete('/:projectId/members/:userId', authenticate, requireProjectAdmin, async (req, res, next) => {
  try {
    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
