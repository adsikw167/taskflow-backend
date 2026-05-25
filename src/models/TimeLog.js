const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Calculate duration before saving
timeLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    const diff = this.endTime - this.startTime;
    this.duration = Math.round(diff / 60000); // Convert to minutes
    this.isRunning = false;
  }
  next();
});

// Index for efficient queries
timeLogSchema.index({ task: 1, user: 1, createdAt: -1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
