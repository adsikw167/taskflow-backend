const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// Load project middleware
exports.loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(
      'members.user',
      'name email avatar'
    );
    if (!project)
      return res.status(404).json({ success: false, message: 'Project not found' });

    // Check membership
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember)
      return res.status(403).json({ success: false, message: 'Access denied' });

    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, dueDate } = req.body;
    const project = await Project.create({
      name,
      description,
      dueDate,
      owner: req.user._id,
    });
    await project.populate('members.user', 'name email avatar');
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProject = async (req, res) => {
  res.status(200).json({ success: true, data: req.project });
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.project._id,
      { name, description, status, dueDate },
      { new: true, runValidators: true }
    ).populate('members.user', 'name email avatar');
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const already = req.project.members.find(
      (m) => m.user._id.toString() === user._id.toString()
    );
    if (already)
      return res.status(400).json({ success: false, message: 'Already a member' });

    req.project.members.push({ user: user._id, role: role || 'member' });
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');

    res.status(200).json({ success: true, data: req.project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (memberId === req.project.owner.toString())
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });

    req.project.members = req.project.members.filter(
      (m) => m.user._id.toString() !== memberId
    );
    await req.project.save();
    res.status(200).json({ success: true, data: req.project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    const member = req.project.members.find(
      (m) => m.user._id.toString() === memberId
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    member.role = role;
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');
    res.status(200).json({ success: true, data: req.project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
