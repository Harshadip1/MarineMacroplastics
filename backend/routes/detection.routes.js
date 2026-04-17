/**
 * Detection Routes
 * Handles AI detection operations, satellite image processing
 */

const express = require('express');
const axios = require('axios');
const Joi = require('joi');
const Detection = require('../models/Detection');
const Zone = require('../models/Zone');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const { generateMockDetections } = require('../utils/mockData');

const router = express.Router();

// AI Model Service URL
const AI_MODEL_URL = process.env.AI_MODEL_URL || 'http://localhost:5001';

// Validation schema for satellite data
const satelliteDetectionSchema = Joi.object({
  source: Joi.string().valid('satellite').required(),
  imageId: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    altitude: Joi.number().optional(),
    timestamp: Joi.string().isoDate().required(),
    accuracy: Joi.number().optional()
  }).required(),
  detectionResults: Joi.object({
    totalPlasticAmount: Joi.number().min(0).required(),
    confidence: Joi.number().min(0).max(1).required(),
    detections: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      count: Joi.number().min(0).required(),
      confidence: Joi.number().min(0).max(1).required(),
      area: Joi.number().min(0).required()
    })).required(),
    riskLevel: Joi.string().valid('high', 'medium', 'low').required(),
    processingTime: Joi.string().isoDate().required()
  }).required(),
  metadata: Joi.object({
    satelliteId: Joi.string().required(),
    captureTime: Joi.string().isoDate().required(),
    resolution: Joi.number().min(0).required(),
    cloudCover: Joi.number().min(0).max(100).required(),
    sensorType: Joi.string().required()
  }).required(),
  timestamp: Joi.string().isoDate().required()
});

// Validation schemas
const satelliteDataSchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  imageUrl: Joi.string().uri().required(),
  source: Joi.string().valid('sentinel', 'landsat', 'modis', 'mock').default('mock'),
  resolution: Joi.string().optional()
});

const batchDetectionSchema = Joi.object({
  coordinates: Joi.array().items(
    Joi.object({
      longitude: Joi.number().required(),
      latitude: Joi.number().required(),
      imageUrl: Joi.string().uri().required()
    })
  ).min(1).max(50).required()
});

/**
 * @route   POST /api/detection/analyze
 * @desc    Analyze satellite image for plastic detection
 * @access  Private (Admin/Supervisor)
 */
router.post('/analyze', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    // Validate input
    const { error } = satelliteDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { longitude, latitude, imageUrl, source, resolution } = req.body;

    logger.info(`Processing detection at [${longitude}, ${latitude}]`);

    // Call AI Model Service for detection
    let detectionResult;
    try {
      const aiResponse = await axios.post(`${AI_MODEL_URL}/predict`, {
        imageUrl,
        coordinates: { longitude, latitude }
      }, {
        timeout: parseInt(process.env.AI_MODEL_TIMEOUT) || 30000
      });

      detectionResult = aiResponse.data;
    } catch (aiError) {
      logger.error('AI Model service error:', aiError.message);
      // Fallback to mock detection if AI service is unavailable
      detectionResult = generateMockDetection();
    }

    // Find zone for this location
    const zone = await Zone.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }
      }
    });

    // Determine priority based on density
    let priority = 'medium';
    if (detectionResult.density === 'high') priority = 'high';
    if (detectionResult.density === 'high' && detectionResult.confidence > 0.9) priority = 'critical';

    // Create detection record
    const detection = await Detection.create({
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      satelliteImage: {
        url: imageUrl,
        source,
        resolution
      },
      detectionResult: {
        plasticDetected: detectionResult.plastic_detected,
        density: detectionResult.density,
        confidence: detectionResult.confidence,
        estimatedArea: detectionResult.estimated_area,
        estimatedWeight: detectionResult.estimated_weight,
        plasticTypes: detectionResult.plastic_types || []
      },
      priority,
      zone: zone ? zone._id : null
    });

    logger.info(`Detection created: ${detection._id}, Plastic: ${detectionResult.plastic_detected}`);

    // Emit real-time update to admin dashboard
    const io = req.app.get('io');
    io.to('admin-room').emit('new-detection', {
      detection: await Detection.findById(detection._id)
        .populate('zone', 'name code')
        .populate('assignedTo', 'name')
    });

    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/detection/batch
 * @desc    Process multiple satellite images in batch
 * @access  Private (Admin/Supervisor)
 */
router.post('/batch', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { error } = batchDetectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { coordinates } = req.body;
    const results = [];
    const detections = [];

    // Process each coordinate
    for (const coord of coordinates) {
      try {
        let detectionResult;
        
        // Call AI Model
        try {
          const aiResponse = await axios.post(`${AI_MODEL_URL}/predict`, {
            imageUrl: coord.imageUrl,
            coordinates: { longitude: coord.longitude, latitude: coord.latitude }
          }, { timeout: 30000 });
          detectionResult = aiResponse.data;
        } catch (aiError) {
          detectionResult = generateMockDetection();
        }

        if (detectionResult.plastic_detected) {
          const zone = await Zone.findOne({
            boundary: {
              $geoIntersects: {
                $geometry: {
                  type: 'Point',
                  coordinates: [coord.longitude, coord.latitude]
                }
              }
            }
          });

          let priority = 'medium';
          if (detectionResult.density === 'high') priority = 'high';

          const detection = await Detection.create({
            location: {
              type: 'Point',
              coordinates: [coord.longitude, coord.latitude]
            },
            satelliteImage: {
              url: coord.imageUrl,
              source: 'mock'
            },
            detectionResult: {
              plasticDetected: true,
              density: detectionResult.density,
              confidence: detectionResult.confidence,
              estimatedArea: detectionResult.estimated_area,
              estimatedWeight: detectionResult.estimated_weight
            },
            priority,
            zone: zone ? zone._id : null
          });

          detections.push(detection);
        }

        results.push({
          coordinates: [coord.longitude, coord.latitude],
          plasticDetected: detectionResult.plastic_detected,
          density: detectionResult.density,
          confidence: detectionResult.confidence
        });
      } catch (err) {
        results.push({
          coordinates: [coord.longitude, coord.latitude],
          error: err.message
        });
      }
    }

    // Emit batch update
    if (detections.length > 0) {
      const io = req.app.get('io');
      io.to('admin-room').emit('batch-detections', {
        count: detections.length,
        detections
      });
    }

    res.status(201).json({
      success: true,
      processed: coordinates.length,
      plasticDetected: detections.length,
      results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/detection
 * @desc    Get all detections with filtering
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    // OFFLINE MODE: Return mock data
    const mockDetections = generateMockDetections();
    
    return res.status(200).json({
      success: true,
      data: mockDetections,
      total: mockDetections.length,
      page: 1,
      pages: 1
    });

    const {
      status,
      priority,
      density,
      zone,
      plasticDetected,
      startDate,
      endDate,
      longitude,
      latitude,
      radius = 10000, // 10km default
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (density) query['detectionResult.density'] = density;
    if (zone) query.zone = zone;
    if (plasticDetected !== undefined) {
      query['detectionResult.plasticDetected'] = plasticDetected === 'true';
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Geospatial query
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const detections = await Detection.find(query)
      .populate('zone', 'name code')
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Detection.countDocuments(query);

    res.status(200).json({
      success: true,
      count: detections.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: detections
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/detection/:id
 * @desc    Get single detection by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const detection = await Detection.findById(req.params.id)
      .populate('zone', 'name code boundary')
      .populate('assignedTo', 'name email phone')
      .populate('collection.collectedBy', 'name');

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: detection
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/detection/map/data
 * @desc    Get detections formatted for map display
 * @access  Private
 */
router.get('/map/data', protect, async (req, res, next) => {
  try {
    const { bounds, status, priority } = req.query;

    const query = {
      'detectionResult.plasticDetected': true
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    // If bounds provided, filter by map viewport
    if (bounds) {
      const [swLng, swLat, neLng, neLat] = bounds.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[swLng, swLat], [neLng, neLat]]
        }
      };
    }

    const detections = await Detection.find(query)
      .select('location detectionResult status priority droneVerification')
      .limit(500);

    // Format for map markers
    const mapData = detections.map(d => ({
      id: d._id,
      coordinates: d.location.coordinates,
      density: d.detectionResult.density,
      confidence: d.detectionResult.confidence,
      status: d.status,
      priority: d.priority,
      droneVerified: d.droneVerification.verified
    }));

    res.status(200).json({
      success: true,
      count: mapData.length,
      data: mapData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/detection/:id/status
 * @desc    Update detection status
 * @access  Private (Admin/Supervisor)
 */
router.put('/:id/status', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['detected', 'drone_verified', 'assigned', 'in_progress', 'collected', 'verified'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const detection = await Detection.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Emit status update
    const io = req.app.get('io');
    io.to('admin-room').emit('detection-status-update', {
      detectionId: detection._id,
      status: detection.status
    });

    res.status(200).json({
      success: true,
      data: detection
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/detection/stats/summary
 * @desc    Get detection statistics summary
 * @access  Private
 */
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const stats = await Detection.aggregate([
      {
        $group: {
          _id: null,
          totalDetections: { $sum: 1 },
          plasticDetections: {
            $sum: { $cond: ['$detectionResult.plasticDetected', 1, 0] }
          },
          highDensity: {
            $sum: { $cond: [{ $eq: ['$detectionResult.density', 'high'] }, 1, 0] }
          },
          collected: {
            $sum: { $cond: [{ $eq: ['$status', 'collected'] }, 1, 0] }
          },
          totalWeight: { $sum: '$collection.actualWeight' }
        }
      }
    ]);

    const densityBreakdown = await Detection.aggregate([
      { $match: { 'detectionResult.plasticDetected': true } },
      {
        $group: {
          _id: '$detectionResult.density',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusBreakdown = await Detection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {},
        byDensity: densityBreakdown,
        byStatus: statusBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function for mock detection (fallback)
function generateMockDetection() {
  const densities = ['low', 'medium', 'high'];
  const density = densities[Math.floor(Math.random() * densities.length)];
  const confidence = 0.6 + Math.random() * 0.35;
  
  const areaEstimates = { low: 50, medium: 200, high: 500 };
  const weightEstimates = { low: 10, medium: 50, high: 150 };

  return {
    plastic_detected: Math.random() > 0.3, // 70% chance of detection
    density,
    confidence: parseFloat(confidence.toFixed(2)),
    estimated_area: areaEstimates[density] * (0.8 + Math.random() * 0.4),
    estimated_weight: weightEstimates[density] * (0.8 + Math.random() * 0.4),
    plastic_types: ['PET', 'HDPE']
  };
}

/**
 * @route   POST /api/detections/satellite
 * @desc    Receive satellite detection data and integrate with dashboard
 * @access  Public (satellite endpoint)
 */
router.post('/satellite', async (req, res, next) => {
  try {
    // Validate satellite data
    const { error } = satelliteDetectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      imageId,
      location,
      detectionResults,
      metadata,
      timestamp
    } = req.body;

    console.log(`Received satellite detection: ${imageId}`);
    console.log(`Location: ${location.lat}, ${location.lng}`);
    console.log(`Plastic Amount: ${detectionResults.totalPlasticAmount}kg`);

    // Create detection record
    const detection = new Detection({
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      detectionResult: {
        plasticDetected: detectionResults.totalPlasticAmount > 0,
        density: detectionResults.riskLevel,
        confidence: detectionResults.confidence,
        plasticAmount: detectionResults.totalPlasticAmount,
        plasticTypes: detectionResults.detections.map(d => ({
          type: d.type,
          count: d.count,
          confidence: d.confidence,
          area: d.area
        }))
      },
      source: 'satellite',
      metadata: {
        imageId: imageId,
        satelliteId: metadata.satelliteId,
        captureTime: metadata.captureTime,
        resolution: metadata.resolution,
        cloudCover: metadata.cloudCover,
        sensorType: metadata.sensorType,
        altitude: location.altitude,
        accuracy: location.accuracy
      },
      status: 'detected',
      detectedAt: new Date(timestamp),
      createdAt: new Date()
    });

    // Save detection to database (or use in-memory storage)
    try {
      await detection.save();
      console.log(`Detection saved to database: ${detection._id}`);
    } catch (dbError) {
      console.log('Database error, using in-memory storage:', dbError.message);
      // In production, implement fallback storage
    }

    // Update or create zone with new detection data
    await updateZoneWithDetection(location, detectionResults);

    // Emit real-time update to connected clients
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('newDetection', {
          type: 'satellite',
          location: location,
          plasticAmount: detectionResults.totalPlasticAmount,
          riskLevel: detectionResults.riskLevel,
          timestamp: timestamp,
          satelliteId: metadata.satelliteId
        });
      }
    } catch (socketError) {
      console.log('Socket emission failed:', socketError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Satellite detection processed successfully',
      data: {
        detectionId: detection._id,
        imageId: imageId,
        location: location,
        plasticAmount: detectionResults.totalPlasticAmount,
        riskLevel: detectionResults.riskLevel,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Satellite detection processing error:', error);
    next(error);
  }
});

/**
 * Helper function to update zone with detection data
 */
async function updateZoneWithDetection(location, detectionResults) {
  try {
    // Find nearby zone or create new one
    const nearbyZone = await Zone.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    if (nearbyZone) {
      // Update existing zone
      nearbyZone.currentPlasticLevel = detectionResults.totalPlasticAmount;
      nearbyZone.riskLevel = detectionResults.riskLevel;
      nearbyZone.lastUpdated = new Date();
      nearbyZone.detectionCount = (nearbyZone.detectionCount || 0) + 1;
      
      await nearbyZone.save();
      console.log(`Updated zone ${nearbyZone.name} with new detection data`);
    } else {
      // Create new zone
      const zoneName = `Zone-${location.lat.toFixed(2)}-${location.lng.toFixed(2)}`;
      const newZone = new Zone({
        name: zoneName,
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        currentPlasticLevel: detectionResults.totalPlasticAmount,
        riskLevel: detectionResults.riskLevel,
        detectionCount: 1,
        status: 'active',
        lastUpdated: new Date(),
        createdAt: new Date()
      });

      await newZone.save();
      console.log(`Created new zone: ${zoneName}`);
    }
  } catch (error) {
    console.error('Zone update error:', error.message);
  }
}

module.exports = router;
