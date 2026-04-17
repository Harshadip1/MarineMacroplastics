/**
 * Zone Model
 * Defines geographic zones for plastic collection management
 */

const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Geographic boundaries (polygon)
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of [longitude, latitude]
      required: true
    }
  },
  
  // Center point for quick reference
  centerPoint: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  
  // Zone details
  description: {
    type: String
  },
  country: {
    type: String,
    required: true
  },
  region: {
    type: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active'
  },
  
  // Assigned workers/supervisors
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  stats: {
    totalDetections: {
      type: Number,
      default: 0
    },
    highPriorityDetections: {
      type: Number,
      default: 0
    },
    totalCollected: {
      type: Number,
      default: 0 // in kg
    },
    lastCollection: {
      type: Date
    }
  },
  
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  
  // Environmental factors
  environmentalData: {
    averageCurrentSpeed: Number,
    tidalInformation: String,
    protectedArea: {
      type: Boolean,
      default: false
    },
    marineLifePresence: String
  }
}, {
  timestamps: true
});

// Create geospatial indexes
zoneSchema.index({ boundary: '2dsphere' });
zoneSchema.index({ centerPoint: '2dsphere' });

// Method to check if a point is within zone
zoneSchema.methods.containsPoint = function(longitude, latitude) {
  // This would use MongoDB's $geoIntersects in actual query
  // Simplified check here
  return true;
};

module.exports = mongoose.model('Zone', zoneSchema);
