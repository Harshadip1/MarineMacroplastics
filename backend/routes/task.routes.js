/**
 * Task Routes
 * Manages task assignments, status updates, and completion
 */

const express = require('express');
const Task = require('../models/Task');
const Detection = require('../models/Detection');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/tasks
 * @desc    Create new task from detection
 * @access  Private (Admin/Supervisor)
 */
router.post('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const {
      detectionId,
      workerId,
      priority,
      scheduledDate,
      estimatedWeight,
      notes
    } = req.body;

    // Verify detection exists and needs assignment
    const detection = await Detection.findById(detectionId);
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    if (detection.status === 'collected' || detection.status === 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Detection already ${detection.status}`
      });
    }

    // Verify worker exists and is active
    const worker = await User.findOne({ _id: workerId, role: 'worker', isActive: true });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or inactive'
      });
    }

    // Create task
    const task = await Task.create({
      detection: detectionId,
      assignedTo: workerId,
      assignedBy: req.user.id,
      title: `Collection at ${detection.location.coordinates[1].toFixed(4)}, ${detection.location.coordinates[0].toFixed(4)}`,
      description: notes || `Collect marine plastic pollution. Estimated density: ${detection.detectionResult.density}`,
      priority: priority || detection.priority,
      location: detection.location,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      estimatedWeight: estimatedWeight || detection.detectionResult.estimatedWeight
    });

    // Update detection status
    detection.status = 'assigned';
    detection.assignedTo = workerId;
    detection.assignedAt = new Date();
    await detection.save();

    // Update worker stats
    worker.stats.tasksAssigned += 1;
    await worker.save({ validateBeforeSave: false });

    logger.info(`Task created: ${task.taskId} assigned to worker ${workerId}`);

    // Emit notification to worker
    const io = req.app.get('io');
    io.to(`worker-${workerId}`).emit('new-task', {
      task: await Task.findById(task._id).populate('detection', 'location detectionResult')
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      status,
      priority,
      workerId,
      startDate,
      endDate,
      myTasks,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Filter by requester's role
    if (req.user.role === 'worker' || myTasks === 'true') {
      query.assignedTo = req.user.id;
    } else if (workerId) {
      query.assignedTo = workerId;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('detection', 'location detectionResult satelliteImage')
      .populate('assignedTo', 'name email phone')
      .populate('assignedBy', 'name')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('detection')
      .populate('assignedTo', 'name email phone currentLocation')
      .populate('assignedBy', 'name')
      .populate('verification.verifiedBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization
    if (req.user.role === 'worker' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id/accept
 * @desc    Worker accepts task
 * @access  Private (Worker)
 */
router.put('/:id/accept', protect, authorize('worker'), async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user.id,
      status: 'pending'
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not in pending status'
      });
    }

    task.status = 'accepted';
    await task.save();

    // Notify admin
    const io = req.app.get('io');
    io.to('admin-room').emit('task-accepted', {
      taskId: task._id,
      workerId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id/start
 * @desc    Worker starts task
 * @access  Private (Worker)
 */
router.put('/:id/start', protect, authorize('worker'), async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or cannot be started'
      });
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();

    // Update detection status
    await Detection.findByIdAndUpdate(task.detection, { status: 'in_progress' });

    logger.info(`Task ${task.taskId} started by worker ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id/complete
 * @desc    Worker marks task as complete
 * @access  Private (Worker)
 */
router.put('/:id/complete', protect, authorize('worker'), async (req, res, next) => {
  try {
    const {
      weight,
      volume,
      plasticTypes,
      photos,
      notes,
      conditions
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user.id,
      status: 'in_progress'
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not in progress'
      });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.collectionData = {
      weight,
      volume,
      plasticTypes,
      photos,
      notes,
      conditions
    };
    await task.save();

    // Update detection with collection data
    await Detection.findByIdAndUpdate(task.detection, {
      status: 'collected',
      collection: {
        collectedAt: new Date(),
        collectedBy: req.user.id,
        actualWeight: weight,
        plasticTypes,
        photos,
        notes
      }
    });

    // Update worker stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        'stats.totalCollections': 1,
        'stats.totalWeight': weight,
        'stats.tasksCompleted': 1
      }
    });

    logger.info(`Task ${task.taskId} completed by worker ${req.user.id}`);

    // Notify supervisors
    const io = req.app.get('io');
    io.to('admin-room').emit('task-completed', {
      taskId: task._id,
      workerId: req.user.id,
      requiresVerification: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id/verify
 * @desc    Supervisor verifies task completion
 * @access  Private (Admin/Supervisor)
 */
router.put('/:id/verify', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { status, notes, quality } = req.body; // status: 'approved' or 'rejected'

    const task = await Task.findOne({
      _id: req.params.id,
      status: 'completed'
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not completed'
      });
    }

    task.verification = {
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      status,
      notes,
      quality
    };

    if (status === 'approved') {
      task.status = 'verified';
      
      // Update detection to verified
      await Detection.findByIdAndUpdate(task.detection, {
        status: 'verified',
        'collection.verifiedBy': req.user.id
      });
    } else {
      task.status = 'rejected';
      // Revert detection status
      await Detection.findByIdAndUpdate(task.detection, {
        status: 'assigned'
      });
    }

    await task.save();

    logger.info(`Task ${task.taskId} ${status} by supervisor ${req.user.id}`);

    // Notify worker
    const io = req.app.get('io');
    io.to(`worker-${task.assignedTo}`).emit('task-verified', {
      taskId: task._id,
      status,
      notes
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Private (Admin/Supervisor)
 */
router.put('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { priority, scheduledDate, assignedTo } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (priority) task.priority = priority;
    if (scheduledDate) task.scheduledDate = new Date(scheduledDate);
    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      // Reassign task
      task.assignedTo = assignedTo;
      task.status = 'pending';
      
      // Update detection assignment
      await Detection.findByIdAndUpdate(task.detection, {
        assignedTo
      });

      // Notify new worker
      const io = req.app.get('io');
      io.to(`worker-${assignedTo}`).emit('new-task', {
        task: await Task.findById(task._id).populate('detection')
      });
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
