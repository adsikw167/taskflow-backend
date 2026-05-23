const Task = require('../models/Task');
const Project = require('../models/Project');

const checkProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, member: null };
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return { project, member };
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status,
      priority,
      dueDate,
      tags,
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { member } = await checkProjectMembership(projectId, req.user._id);

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Members can only update status/assignedTo unless they're admin or creator
    const isAdmin = member?.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    if (isAdmin || isCreator) {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (tags !== undefined) task.tags = tags;
    }
    if (status !== undefined) task.status = status;

    await task.save();
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { project, member } = await checkProjectMembership(projectId, req.user._id);

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isAdmin = member?.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator)
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });

    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects the user belongs to
    const projects = await Project.find({ 'members.user': userId });
    const projectIds = projects.map((p) => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } });
    const myTasks = await Task.find({ project: { $in: projectIds }, assignedTo: userId });

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
    );

    const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    allTasks.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

    res.status(200).json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        myTasks: myTasks.length,
        overdueTasks: overdueTasks.length,
        statusCounts,
        recentTasks: await Task.find({ project: { $in: projectIds } })
          .sort('-createdAt')
          .limit(5)
          .populate('project', 'name')
          .populate('assignedTo', 'name avatar'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
