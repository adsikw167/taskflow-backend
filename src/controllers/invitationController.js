const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const User = require('../models/User');

// Get invitation details
const getInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token, status: 'pending' })
      .populate('project', 'name description')
      .populate('invitedBy', 'name email');
    
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found or expired' });
    }
    
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        email: invitation.email,
        projectName: invitation.project.name,
        projectDescription: invitation.project.description,
        inviterName: invitation.invitedBy.name,
        role: invitation.role,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Accept invitation (called after signup/login)
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user._id;
    
    const invitation = await Invitation.findOne({ token, status: 'pending' });
    
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found or already accepted' });
    }
    
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }
    
    // Check if user email matches invitation
    const user = await User.findById(userId);
    if (user.email !== invitation.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'This invitation was sent to a different email address' 
      });
    }
    
    // Add user to project
    const project = await Project.findById(invitation.project);
    
    const alreadyMember = project.members.find(
      (m) => m.user.toString() === userId.toString()
    );
    
    if (!alreadyMember) {
      project.members.push({ user: userId, role: invitation.role });
      await project.save();
    }
    
    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();
    
    await project.populate('members.user', 'name email avatar');
    
    res.status(200).json({ 
      success: true, 
      message: 'Invitation accepted successfully',
      project: {
        _id: project._id,
        name: project.name,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get pending invitations for a project
const getProjectInvitations = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const invitations = await Invitation.find({ 
      project: projectId, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('invitedBy', 'name email');
    
    res.status(200).json({ success: true, data: invitations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel invitation
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    
    await invitation.deleteOne();
    
    res.status(200).json({ success: true, message: 'Invitation cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getInvitation,
  acceptInvitation,
  getProjectInvitations,
  cancelInvitation,
};
