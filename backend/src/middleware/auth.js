const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is ADMIN in a specific project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } }
    });

    if (!member) return res.status(403).json({ error: 'Not a project member' });
    if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is any member of a project
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } }
    });

    if (!member) return res.status(403).json({ error: 'Not a project member' });

    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
