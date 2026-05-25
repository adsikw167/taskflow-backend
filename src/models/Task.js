const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
    checklist: [checklistItemSchema],
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    timeTracking: {
      estimated: { type: Number, default: 0 }, // in minutes
      logged: { type: Number, default: 0 }, // in minutes
    },
  },
  { timestamps: true }
);

// Virtual: is overdue
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.status !== 'done' && new Date() > this.dueDate;
});

// Virtual: checklist progress
taskSchema.virtual('checklistProgress').get(function () {
  if (!this.checklist || this.checklist.length === 0) return null;
  const completed = this.checklist.filter(item => item.completed).length;
  return { completed, total: this.checklist.length, percentage: Math.round((completed / this.checklist.length) * 100) };
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
