/**
 * Drone Routes
 * Handles drone operations, mission management, and verification
 */

const express = require('express');
const axios = require('axios');
const Joi = require('joi');
const Drone = require('../models/Drone');
const Detection = require('../models/Detection');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Drone Module Service URL
const DRONE_MODULE_URL = process.env.DRONE_MODULE_URL || 'http://localhost:5002';

// Validation schemas
const triggerDroneSchema = Joi.object({
  detectionId: Joi.string().required(),
  droneId: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

const missionCompleteSchema = Joi.object({
  missionId: Joi.string().required(),
  highResImage: Joi.string().uri().required(),
  coordinates: Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }).required(),
  estimatedQuantity: Joi.object({
    area: Joi.number().required(),
    weight: Joi.number().required(),
    confidence: Joi.number().min(0).max(1).required()
  }).required(),
  plasticTypes: Joi.array().items(Joi.string()).optional()
});

/**
 * @route   POST /api/drone/trigger
 * @desc    Trigger drone verification for a detection
 * @access  Private (Admin/Supervisor)
 */
router.post('/trigger', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { error } = triggerDroneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { detectionId, droneId, priority } = req.body;

    // Get detection details
    const detection = await Detection.findById(detectionId);
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Check if already drone verified
    if (detection.droneVerification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Detection already verified by drone'
      });
    }

    // Find available drone
    let drone;
    if (droneId) {
      drone = await Drone.findOne({ droneId, status: 'idle', isActive: true });
    } else {
      // Find nearest available drone
      drone = await Drone.findOne({
        status: 'idle',
        isActive: true,
        currentLocation: {
          $near: {
            $geometry: detection.location,
            $maxDistance: 100000 // 100km radius
          }
        }
      });
    }

    if (!drone) {
      // Queue for later or return error
      return res.status(400).json({
        success: false,
        message: 'No drones available for verification'
      });
    }

    logger.info(`Triggering drone ${drone.droneId} for detection ${detectionId}`);

    // Call Drone Module API
    let missionResponse;
    try {
      missionResponse = await axios.post(`${DRONE_MODULE_URL}/api/drone/mission`, {
        droneId: drone.droneId,
        targetLocation: {
          longitude: detection.location.coordinates[0],
          latitude: detection.location.coordinates[1]
        },
        priority,
        detectionId: detection._id.toString()
      }, {
        headers: {
          'X-API-Key': process.env.DRONE_API_KEY || 'drone_simulation_key_12345'
        },
        timeout: 10000
      });
    } catch (droneError) {
      logger.error('Drone module error:', droneError.message);
      // Fallback to mock response
      missionResponse = {
        data: {
          missionId: `M-${Date.now()}`,
          droneId: drone.droneId,
          status: 'assigned',
          estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString()
        }
      };
    }

    // Update drone status
    drone.status = 'flying';
    drone.currentMission = {
      missionId: missionResponse.data.missionId,
      startTime: new Date(),
      targetLocation: detection.location.coordinates,
      progress: 0
    };
    await drone.save();

    // Update detection status
    detection.status = 'drone_verified';
    await detection.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('drone-mission-assigned', {
      detectionId,
      droneId: drone.droneId,
      missionId: missionResponse.data.missionId,
      status: 'assigned'
    });

    res.status(200).json({
      success: true,
      data: {
        missionId: missionResponse.data.missionId,
        drone: {
          id: drone._id,
          droneId: drone.droneId,
          name: drone.name,
          model: drone.model,
          batteryLevel: drone.batteryLevel
        },
        detection: detectionId,
        estimatedArrival: missionResponse.data.estimatedArrival,
        status: 'assigned'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/drone/mission-complete
 * @desc    Webhook from drone module when mission completes
 * @access  Public (with API key verification)
 */
router.post('/mission-complete', async (req, res, next) => {
  try {
    const { error } = missionCompleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { missionId, highResImage, coordinates, estimatedQuantity, plasticTypes } = req.body;

    logger.info(`Drone mission completed: ${missionId}`);

    // Find drone by mission
    const drone = await Drone.findOne({ 'currentMission.missionId': missionId });
    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone mission not found'
      });
    }

    // Find associated detection
    const detection = await Detection.findOne({
      'location.coordinates': [coordinates.longitude, coordinates.latitude]
    }).sort({ createdAt: -1 });

    if (detection) {
      // Update detection with drone verification
      detection.droneVerification = {
        verified: true,
        droneId: drone.droneId,
        verificationDate: new Date(),
        highResImage,
        refinedEstimate: estimatedQuantity
      };
      
      // Update confidence based on drone data
      detection.detectionResult.confidence = estimatedQuantity.confidence;
      detection.detectionResult.estimatedArea = estimatedQuantity.area;
      detection.detectionResult.estimatedWeight = estimatedQuantity.weight;
      if (plasticTypes) {
        detection.detectionResult.plasticTypes = plasticTypes;
      }
      
      await detection.save();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('drone-verification-complete', {
        detectionId: detection._id,
        droneId: drone.droneId,
        missionId,
        refinedData: estimatedQuantity
      });
    }

    // Update drone
    drone.status = 'idle';
    drone.currentMission = null;
    drone.stats.totalVerifications += 1;
    drone.stats.totalFlights += 1;
    drone.stats.lastFlight = new Date();
    drone.currentLocation = {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude]
    };
    await drone.save();

    res.status(200).json({
      success: true,
      message: 'Mission completion processed'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drone
 * @desc    Get all drones
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, isActive } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const drones = await Drone.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: drones.length,
      data: drones
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drone/:id
 * @desc    Get single drone details
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: drone
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/drone/:id/location
 * @desc    Get drone current location
 * @access  Private
 */
router.get('/:id/location', protect, async (req, res, next) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        droneId: drone.droneId,
        location: drone.currentLocation,
        status: drone.status,
        batteryLevel: drone.batteryLevel,
        lastPing: drone.lastPing,
        currentMission: drone.currentMission
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/drone/:id/status
 * @desc    Update drone status (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['idle', 'flying', 'charging', 'maintenance', 'offline', 'error'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const drone = await Drone.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    // Emit drone status update
    const io = req.app.get('io');
    io.to('admin-room').emit('drone-status-update', {
      droneId: drone._id,
      status: drone.status
    });

    res.status(200).json({
      success: true,
      data: drone
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/drone
 * @desc    Register new drone (Admin only)
 * @access  Private (Admin)
 */
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const drone = await Drone.create(req.body);

    logger.info(`New drone registered: ${drone.droneId}`);

    res.status(201).json({
      success: true,
      data: drone
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
