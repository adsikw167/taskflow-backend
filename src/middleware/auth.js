const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

// Check if user is admin of a project (attach project to req first)
exports.requireAdmin = (req, res, next) => {
  const project = req.project;
  if (!project) return res.status(500).json({ success: false, message: 'Project not loaded' });

  const member = project.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!member || member.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
