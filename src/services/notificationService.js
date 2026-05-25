const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  link,
  task,
  project,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      task,
      project,
    });

    await notification.populate('sender', 'name email avatar');

    // Emit real-time notification
    emitNotification(recipient.toString(), notification);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Notification templates
const notificationTemplates = {
  task_assigned: (senderName, taskTitle) => ({
    title: 'New Task Assigned',
    message: `${senderName} assigned you to "${taskTitle}"`,
  }),
  
  task_completed: (senderName, taskTitle) => ({
    title: 'Task Completed',
    message: `${senderName} completed "${taskTitle}"`,
  }),
  
  task_comment: (senderName, taskTitle) => ({
    title: 'New Comment',
    message: `${senderName} commented on "${taskTitle}"`,
  }),
  
  task_mention: (senderName, taskTitle) => ({
    title: 'You were mentioned',
    message: `${senderName} mentioned you in "${taskTitle}"`,
  }),
  
  project_invite: (senderName, projectName) => ({
    title: 'Project Invitation',
    message: `${senderName} invited you to "${projectName}"`,
  }),
  
  member_added: (senderName, projectName) => ({
    title: 'Added to Project',
    message: `${senderName} added you to "${projectName}"`,
  }),
  
  deadline_reminder: (taskTitle, hours) => ({
    title: 'Deadline Reminder',
    message: `"${taskTitle}" is due in ${hours} hours`,
  }),
  
  status_changed: (senderName, taskTitle, newStatus) => ({
    title: 'Status Changed',
    message: `${senderName} moved "${taskTitle}" to ${newStatus}`,
  }),
};

const notifyTaskAssigned = async (task, assignedTo, assignedBy) => {
  const { title, message } = notificationTemplates.task_assigned(
    assignedBy.name,
    task.title
  );
  
  await createNotification({
    recipient: assignedTo,
    sender: assignedBy._id,
    type: 'task_assigned',
    title,
    message,
    link: `/projects/${task.project}/tasks/${task._id}`,
    task: task._id,
    project: task.project,
  });
};

const notifyTaskComment = async (task, comment, commenter, mentions = []) => {
  // Notify task assignee
  if (task.assignedTo && task.assignedTo.toString() !== commenter._id.toString()) {
    const { title, message } = notificationTemplates.task_comment(
      commenter.name,
      task.title
    );
    
    await createNotification({
      recipient: task.assignedTo,
      sender: commenter._id,
      type: 'task_comment',
      title,
      message,
      link: `/projects/${task.project}/tasks/${task._id}`,
      task: task._id,
      project: task.project,
    });
  }

  // Notify mentioned users
  for (const mentionedUserId of mentions) {
    if (mentionedUserId.toString() !== commenter._id.toString()) {
      const { title, message } = notificationTemplates.task_mention(
        commenter.name,
        task.title
      );
      
      await createNotification({
        recipient: mentionedUserId,
        sender: commenter._id,
        type: 'task_mention',
        title,
        message,
        link: `/projects/${task.project}/tasks/${task._id}`,
        task: task._id,
        project: task.project,
      });
    }
  }
};

const notifyProjectInvite = async (project, invitedUser, inviter) => {
  const { title, message } = notificationTemplates.project_invite(
    inviter.name,
    project.name
  );
  
  await createNotification({
    recipient: invitedUser,
    sender: inviter._id,
    type: 'project_invite',
    title,
    message,
    link: `/projects/${project._id}`,
    project: project._id,
  });
};

module.exports = {
  createNotification,
  notifyTaskAssigned,
  notifyTaskComment,
  notifyProjectInvite,
};
