/**
 * Worker Routes
 * Handles worker management, task assignments, and location tracking
 */

const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/worker
 * @desc    Get all workers
 * @access  Private (Admin/Supervisor)
 */
router.get('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { status, zone, isActive } = req.query;
    const query = { role: 'worker' };
    
    if (zone) query.assignedZone = zone;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const workers = await User.find(query)
      .populate('assignedZone', 'name code')
      .select('-password -fcmToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/worker/nearby
 * @desc    Find workers near a location
 * @access  Private (Admin/Supervisor)
 */
router.get('/nearby', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { longitude, latitude, radius = 50000, limit = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    const workers = await User.find({
      role: 'worker',
      isActive: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .select('name email phone currentLocation stats lastLogin')
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/worker/:id
 * @desc    Get single worker details
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id)
      .populate('assignedZone', 'name code')
      .select('-password -fcmToken');

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get worker's tasks
    const tasks = await Task.find({ assignedTo: req.params.id })
      .populate('detection', 'location detectionResult')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        worker,
        recentTasks: tasks
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/worker/:id/zone
 * @desc    Assign worker to zone
 * @access  Private (Admin/Supervisor)
 */
router.put('/:id/zone', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { zoneId } = req.body;

    const worker = await User.findByIdAndUpdate(
      req.params.id,
      { assignedZone: zoneId },
      { new: true }
    ).populate('assignedZone', 'name code');

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    logger.info(`Worker ${worker._id} assigned to zone ${zoneId}`);

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/worker/:id/status
 * @desc    Activate/deactivate worker
 * @access  Private (Admin)
 */
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const worker = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    logger.info(`Worker ${worker._id} status changed to ${isActive ? 'active' : 'inactive'}`);

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/worker/:id/stats
 * @desc    Get worker statistics
 * @access  Private
 */
router.get('/:id/stats', protect, async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get detailed stats from tasks
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: worker._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyCollections = await Task.aggregate([
      {
        $match: {
          assignedTo: worker._id,
          status: 'verified',
          'verification.verifiedAt': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$verification.verifiedAt' },
            month: { $month: '$verification.verifiedAt' }
          },
          totalWeight: { $sum: '$collectionData.weight' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        basicStats: worker.stats,
        taskBreakdown: taskStats,
        monthlyPerformance: monthlyCollections
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
