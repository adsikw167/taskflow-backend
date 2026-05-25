const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/emailService');

// Load project middleware
exports.loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(
      'members.user',
      'name email avatar'
    );
    if (!project)
      return res.status(404).json({ success: false, message: 'Project not found' });

    // Global admins can access any project
    if (req.user.isGlobalAdmin) {
      req.project = project;
      return next();
    }

    // Check membership
    const isMember = project.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
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
    let query = {};
    
    // Global admins can see all projects
    if (!req.user.isGlobalAdmin) {
      query = { 'members.user': req.user._id };
    }
    
    const projects = await Project.find(query)
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

    // Check if already a member
    const already = req.project.members.find(
      (m) => m.user && m.user._id.toString() === (user?._id.toString() || '')
    );
    if (already)
      return res.status(400).json({ success: false, message: 'Already a member' });

    // If user exists, add them directly
    if (user) {
      req.project.members.push({ user: user._id, role: role || 'member' });
      await req.project.save();
      await req.project.populate('members.user', 'name email avatar');
      return res.status(200).json({ success: true, data: req.project, message: 'Member added successfully' });
    }

    // If user doesn't exist, send invitation
    const existingInvite = await Invitation.findOne({ 
      email, 
      project: req.project._id, 
      status: 'pending' 
    });
    
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'Invitation already sent to this email' });
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex');
    
    const invitation = await Invitation.create({
      email,
      project: req.project._id,
      role: role || 'member',
      invitedBy: req.user._id,
      token,
    });

    // Send invitation email
    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${token}`;
    
    try {
      await sendInvitationEmail({
        to: email,
        projectName: req.project.name,
        inviterName: req.user.name,
        inviteLink,
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      // Continue even if email fails (for development)
    }

    res.status(200).json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      invitation: {
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }
    });
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
      (m) => m.user && m.user._id.toString() !== memberId
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
      (m) => m.user && m.user._id.toString() === memberId
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
