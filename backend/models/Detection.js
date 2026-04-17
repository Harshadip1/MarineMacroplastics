/**
 * Detection Model
 * Stores AI detection results for marine plastic zones
 */

const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String
    }
  },
  
  // Satellite image information
  satelliteImage: {
    url: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['sentinel', 'landsat', 'modis', 'mock'],
      default: 'mock'
    },
    captureDate: {
      type: Date,
      default: Date.now
    },
    resolution: {
      type: String // e.g., "10m"
    }
  },
  
  // AI Detection results
  detectionResult: {
    plasticDetected: {
      type: Boolean,
      required: true
    },
    density: {
      type: String,
      enum: ['low', 'medium', 'high', 'none'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    estimatedArea: {
      type: Number, // in square meters
    },
    estimatedWeight: {
      type: Number, // in kg
    },
    plasticTypes: [{
      type: String,
      enum: ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Other']
    }]
  },
  
  // Classification and priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['detected', 'drone_verified', 'assigned', 'in_progress', 'collected', 'verified'],
    default: 'detected'
  },
  
  // Drone verification
  droneVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    droneId: {
      type: String
    },
    verificationDate: {
      type: Date
    },
    highResImage: {
      type: String
    },
    refinedEstimate: {
      area: Number,
      weight: Number,
      confidence: Number
    }
  },
  
  // Collection assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  
  // Collection details
  collection: {
    collectedAt: Date,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actualWeight: Number,
    plasticTypes: [String],
    photos: [String],
    notes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Zone information
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  },
  
  // Weather conditions at detection time
  weather: {
    temperature: Number,
    windSpeed: Number,
    visibility: String,
    waveHeight: Number
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
detectionSchema.index({ location: '2dsphere' });

// Index for common queries
detectionSchema.index({ status: 1, priority: 1 });
detectionSchema.index({ 'detectionResult.plasticDetected': 1, createdAt: -1 });

// Virtual for days since detection
detectionSchema.virtual('daysSinceDetection').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to update status
detectionSchema.methods.updateStatus = async function(newStatus, metadata = {}) {
  this.status = newStatus;
  
  if (newStatus === 'collected') {
    this.collection = {
      ...this.collection,
      ...metadata,
      collectedAt: new Date()
    };
  }
  
  return await this.save();
};

module.exports = mongoose.model('Detection', detectionSchema);
