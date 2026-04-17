/**
 * Drone Model
 * Tracks drone fleet and their operations
 */

const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['idle', 'flying', 'charging', 'maintenance', 'offline', 'error'],
    default: 'idle'
  },
  
  // Current location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude, altitude]
      default: [0, 0, 0]
    }
  },
  
  // Home base location
  homeLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  
  // Specifications
  specifications: {
    maxFlightTime: Number, // in minutes
    maxSpeed: Number, // in km/h
    maxAltitude: Number, // in meters
    cameraResolution: String,
    batteryCapacity: Number, // in mAh
    windResistance: Number // in m/s
  },
  
  // Battery status
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  
  // Mission information
  currentMission: {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DroneMission'
    },
    startTime: Date,
    targetLocation: {
      type: [Number], // [longitude, latitude]
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalFlights: {
      type: Number,
      default: 0
    },
    totalFlightTime: {
      type: Number,
      default: 0 // in minutes
    },
    totalVerifications: {
      type: Number,
      default: 0
    },
    lastFlight: {
      type: Date
    }
  },
  
  // Maintenance
  maintenance: {
    lastMaintenance: Date,
    nextScheduled: Date,
    totalRepairs: {
      type: Number,
      default: 0
    }
  },
  
  // Communication
  lastPing: {
    type: Date,
    default: Date.now
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index
droneSchema.index({ currentLocation: '2dsphere' });

// Pre-save hook to update lastPing
droneSchema.pre('save', function(next) {
  if (this.isModified('currentLocation') || this.isModified('status')) {
    this.lastPing = new Date();
  }
  next();
});

module.exports = mongoose.model('Drone', droneSchema);
