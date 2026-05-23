const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { loadProject } = require('../controllers/projectController');

router.use(protect);
router.use(loadProject);

router.route('/').get(getTasks).post(createTask);
router.route('/:taskId').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
