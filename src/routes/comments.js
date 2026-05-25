const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getProjectActivity,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Task comments
router.route('/tasks/:taskId/comments').get(getComments).post(createComment);
router.route('/comments/:commentId').put(updateComment).delete(deleteComment);

// Project activity
router.get('/projects/:projectId/activity', getProjectActivity);

module.exports = router;
