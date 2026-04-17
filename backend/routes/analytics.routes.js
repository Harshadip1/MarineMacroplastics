/**
 * Analytics Routes
 * Provides data analytics and reporting endpoints
 */

const express = require('express');
const Detection = require('../models/Detection');
const Task = require('../models/Task');
const User = require('../models/User');
const Zone = require('../models/Zone');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get main dashboard statistics
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    // Get counts
    const totalDetections = await Detection.countDocuments();
    const plasticDetections = await Detection.countDocuments({ 'detectionResult.plasticDetected': true });
    const collectedCount = await Detection.countDocuments({ status: 'collected' });
    const verifiedCount = await Detection.countDocuments({ status: 'verified' });
    
    const totalWorkers = await User.countDocuments({ role: 'worker', isActive: true });
    const totalZones = await Zone.countDocuments({ status: 'active' });
    
    // Get collection stats
    const collectionStats = await Detection.aggregate([
      { $match: { status: { $in: ['collected', 'verified'] } } },
      {
        $group: {
          _id: null,
          totalWeight: { $sum: '$collection.actualWeight' },
          totalDetections: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentDetections = await Detection.countDocuments({
      createdAt: { $gte: last7Days }
    });

    const recentCollections = await Detection.countDocuments({
      'collection.collectedAt': { $gte: last7Days }
    });

    // Priority breakdown
    const priorityBreakdown = await Detection.aggregate([
      { $match: { 'detectionResult.plasticDetected': true } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Status breakdown
    const statusBreakdown = await Detection.aggregate([
      { $match: { 'detectionResult.plasticDetected': true } },
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
        overview: {
          totalDetections,
          plasticDetections,
          collectedCount,
          verifiedCount,
          collectionRate: plasticDetections > 0 ? ((collectedCount + verifiedCount) / plasticDetections * 100).toFixed(1) : 0,
          totalWeight: collectionStats[0]?.totalWeight || 0,
          totalWorkers,
          totalZones
        },
        recentActivity: {
          detectionsLast7Days: recentDetections,
          collectionsLast7Days: recentCollections
        },
        priorityBreakdown,
        statusBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get detection and collection trends over time
 * @access  Private
 */
router.get('/trends', protect, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Daily detection trends
    const detectionTrends = await Detection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'detectionResult.plasticDetected': true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          detections: { $sum: 1 },
          highDensity: {
            $sum: { $cond: [{ $eq: ['$detectionResult.density', 'high'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Daily collection trends
    const collectionTrends = await Detection.aggregate([
      {
        $match: {
          'collection.collectedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$collection.collectedAt' },
            month: { $month: '$collection.collectedAt' },
            day: { $dayOfMonth: '$collection.collectedAt' }
          },
          collections: { $sum: 1 },
          weight: { $sum: '$collection.actualWeight' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        detectionTrends,
        collectionTrends
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/zones
 * @desc    Get zone-wise statistics
 * @access  Private
 */
router.get('/zones', protect, async (req, res, next) => {
  try {
    const zoneStats = await Zone.aggregate([
      {
        $lookup: {
          from: 'detections',
          localField: '_id',
          foreignField: 'zone',
          as: 'detections'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalDetections: { $size: '$detections' },
          highPriorityDetections: {
            $size: {
              $filter: {
                input: '$detections',
                cond: { $in: ['$$this.priority', ['high', 'critical']] }
              }
            }
          },
          collected: {
            $size: {
              $filter: {
                input: '$detections',
                cond: { $eq: ['$$this.status', 'collected'] }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: zoneStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/workers
 * @desc    Get worker performance analytics
 * @access  Private (Admin/Supervisor)
 */
router.get('/workers', protect, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const workerStats = await User.aggregate([
      { $match: { role: 'worker' } },
      {
        $lookup: {
          from: 'tasks',
          let: { workerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$workerId'] },
                status: 'verified',
                'verification.verifiedAt': { $gte: startDate }
              }
            }
          ],
          as: 'completedTasks'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalWeight: { $sum: '$completedTasks.collectionData.weight' },
          tasksCompleted: { $size: '$completedTasks' },
          avgQuality: { $avg: '$completedTasks.verification.quality' }
        }
      },
      { $sort: { totalWeight: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: workerStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/plastic-types
 * @desc    Get breakdown of plastic types collected
 * @access  Private
 */
router.get('/plastic-types', protect, async (req, res, next) => {
  try {
    const plasticTypeStats = await Detection.aggregate([
      { $match: { status: { $in: ['collected', 'verified'] } } },
      { $unwind: '$collection.plasticTypes' },
      {
        $group: {
          _id: '$collection.plasticTypes',
          count: { $sum: 1 },
          totalWeight: { $sum: '$collection.actualWeight' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: plasticTypeStats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
