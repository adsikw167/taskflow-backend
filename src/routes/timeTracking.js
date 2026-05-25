const express = require('express');
const router = express.Router();
const {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTaskTimeLogs,
  addManualEntry,
  updateTimeLog,
  deleteTimeLog,
  updateTimeEstimate,
} = require('../controllers/timeTrackingController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Timer operations
router.post('/tasks/:taskId/timer/start', startTimer);
router.put('/timelogs/:timeLogId/stop', stopTimer);
router.get('/timer/active', getActiveTimer);

// Time logs
router.get('/tasks/:taskId/timelogs', getTaskTimeLogs);
router.post('/tasks/:taskId/timelogs', addManualEntry);
router.put('/timelogs/:timeLogId', updateTimeLog);
router.delete('/timelogs/:timeLogId', deleteTimeLog);

// Time estimate
router.put('/tasks/:taskId/estimate', updateTimeEstimate);

module.exports = router;
