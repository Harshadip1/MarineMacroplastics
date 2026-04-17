/**
 * Task Model
 * Manages collection tasks assigned to workers
 */

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Task identification
  taskId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Associated detection
  detection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Detection',
    required: true
  },
  
  // Task details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  
  // Timeline
  scheduledDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
  // Status workflow
  status: {
    type: String,
    enum: [
      'pending',      // Just assigned
      'accepted',     // Worker accepted
      'in_progress',  // Worker started
      'paused',       // Temporarily paused
      'completed',    // Worker marked complete
      'verified',     // Supervisor verified
      'rejected',     // Supervisor rejected completion
      'cancelled'     // Cancelled by admin
    ],
    default: 'pending'
  },
  
  // Collection results
  collectionData: {
    weight: Number, // in kg
    volume: Number, // in cubic meters
    plasticTypes: [{
      type: String,
      enum: ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Other']
    }],
    photos: [String],
    notes: String,
    conditions: String
  },
  
  // Verification by supervisor
  verification: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    notes: String,
    quality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Notifications sent
  notifications: [{
    type: {
      type: String,
      enum: ['assigned', 'reminder', 'overdue', 'completed']
    },
    sentAt: Date,
    delivered: Boolean
  }],
  
  // Estimates
  estimatedWeight: Number,
  estimatedTime: Number, // in hours
  
  // Feedback
  workerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for common queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ scheduledDate: 1 });
taskSchema.index({ location: '2dsphere' });

// Generate task ID before saving
taskSchema.pre('save', async function(next) {
  if (!this.taskId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.taskId = `TSK-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
