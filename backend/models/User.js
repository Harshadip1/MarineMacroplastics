/**
 * User Model
 * Defines schema for admin and worker users
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'worker', 'supervisor'],
    default: 'worker'
  },
  phone: {
    type: String,
    trim: true
  },
  fcmToken: {
    type: String,
    select: false
  },
  // For workers - current location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  // Worker specific fields
  assignedZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Statistics for workers
  stats: {
    totalCollections: {
      type: Number,
      default: 0
    },
    totalWeight: {
      type: Number,
      default: 0 // in kg
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    tasksAssigned: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
