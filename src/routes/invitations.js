const express = require('express');
const router = express.Router();
const {
  getInvitation,
  acceptInvitation,
  getProjectInvitations,
  cancelInvitation,
} = require('../controllers/invitationController');
const { protect } = require('../middleware/auth');

// Public route - get invitation details
router.get('/:token', getInvitation);

// Protected routes
router.post('/:token/accept', protect, acceptInvitation);
router.get('/project/:projectId', protect, getProjectInvitations);
router.delete('/:invitationId', protect, cancelInvitation);

module.exports = router;
