const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  loadProject,
} = require('../controllers/projectController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getProjects).post(createProject);

router.use('/:projectId', (req, res, next) => {
  req.params.projectId = req.params.projectId;
  next();
});

router
  .route('/:projectId')
  .get(loadProject, getProject)
  .put(loadProject, requireAdmin, updateProject)
  .delete(loadProject, requireAdmin, deleteProject);

router.post('/:projectId/members', loadProject, requireAdmin, addMember);
router.delete('/:projectId/members/:memberId', loadProject, requireAdmin, removeMember);
router.put('/:projectId/members/:memberId', loadProject, requireAdmin, updateMemberRole);

module.exports = router;
