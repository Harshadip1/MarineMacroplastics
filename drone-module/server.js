/**
 * Drone Communication Simulation Module
 * Simulates drone operations, mission management, and image capture
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;
const API_KEY = process.env.DRONE_API_KEY || 'drone_simulation_key_12345';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for missions
const activeMissions = new Map();
const missionHistory = [];

// API Key middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

/**
 * @route   GET /health
 * @desc    Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    activeMissions: activeMissions.size,
    totalMissions: missionHistory.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/drone/mission
 * @desc    Create new drone mission
 */
app.post('/api/drone/mission', validateApiKey, (req, res) => {
  const {
    droneId,
    targetLocation,
    priority = 'medium',
    detectionId
  } = req.body;

  if (!droneId || !targetLocation || !targetLocation.longitude || !targetLocation.latitude) {
    return res.status(400).json({
      error: 'droneId and targetLocation (with longitude, latitude) are required'
    });
  }

  const missionId = `M-${uuidv4().split('-')[0].toUpperCase()}`;
  
  // Calculate estimated arrival (30-60 minutes based on distance/priority)
  const baseTime = 30; // minutes
  const priorityMultiplier = { low: 1.5, medium: 1, high: 0.7 };
  const estimatedMinutes = Math.floor(baseTime * (priorityMultiplier[priority] || 1));
  const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60000);

  const mission = {
    missionId,
    droneId,
    detectionId,
    priority,
    targetLocation,
    status: 'assigned',
    createdAt: new Date().toISOString(),
    estimatedArrival: estimatedArrival.toISOString(),
    progress: 0,
    stages: [
      { name: 'takeoff', status: 'pending', timestamp: null },
      { name: 'transit', status: 'pending', timestamp: null },
      { name: 'scanning', status: 'pending', timestamp: null },
      { name: 'returning', status: 'pending', timestamp: null },
      { name: 'landing', status: 'pending', timestamp: null }
    ]
  };

  activeMissions.set(missionId, mission);
  missionHistory.push(mission);

  console.log(`[Drone] Mission ${missionId} assigned to ${droneId} for detection ${detectionId}`);

  // Simulate mission progress
  simulateMissionProgress(missionId);

  res.status(201).json({
    success: true,
    missionId,
    droneId,
    status: 'assigned',
    estimatedArrival: mission.estimatedArrival
  });
});

/**
 * @route   GET /api/drone/mission/:missionId
 * @desc    Get mission status
 */
app.get('/api/drone/mission/:missionId', validateApiKey, (req, res) => {
  const { missionId } = req.params;
  const mission = activeMissions.get(missionId) || missionHistory.find(m => m.missionId === missionId);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  res.json({
    success: true,
    mission
  });
});

/**
 * @route   GET /api/drone/missions
 * @desc    List all missions
 */
app.get('/api/drone/missions', validateApiKey, (req, res) => {
  const { status, droneId } = req.query;
  
  let missions = Array.from(activeMissions.values());
  
  if (status) {
    missions = missions.filter(m => m.status === status);
  }
  if (droneId) {
    missions = missions.filter(m => m.droneId === droneId);
  }

  res.json({
    success: true,
    count: missions.length,
    missions
  });
});

/**
 * Simulate mission progress
 * Updates mission stages and eventually calls the backend webhook
 */
function simulateMissionProgress(missionId) {
  const mission = activeMissions.get(missionId);
  if (!mission) return;

  const stages = ['takeoff', 'transit', 'scanning', 'returning', 'landing'];
  const stageDuration = 6000; // 6 seconds per stage for simulation

  let currentStage = 0;

  const updateStage = () => {
    if (currentStage >= stages.length) {
      // Mission complete - call backend webhook
      completeMission(missionId);
      return;
    }

    const stage = stages[currentStage];
    
    // Update previous stage to completed
    if (currentStage > 0) {
      mission.stages[currentStage - 1].status = 'completed';
    }
    
    // Set current stage to in_progress
    mission.stages[currentStage].status = 'in_progress';
    mission.stages[currentStage].timestamp = new Date().toISOString();
    
    // Update progress
    mission.progress = ((currentStage + 1) / stages.length) * 100;
    
    // Update status based on stage
    if (stage === 'scanning') {
      mission.status = 'scanning';
    } else if (stage === 'returning') {
      mission.status = 'returning';
    }

    console.log(`[Drone] Mission ${missionId} - ${stage}: ${mission.progress.toFixed(0)}%`);

    currentStage++;
    setTimeout(updateStage, stageDuration);
  };

  // Start simulation
  setTimeout(updateStage, 2000);
}

/**
 * Complete mission and send data to backend
 */
function completeMission(missionId) {
  const mission = activeMissions.get(missionId);
  if (!mission) return;

  // Mark all stages complete
  mission.stages.forEach(stage => {
    stage.status = 'completed';
    if (!stage.timestamp) stage.timestamp = new Date().toISOString();
  });
  
  mission.status = 'completed';
  mission.progress = 100;
  mission.completedAt = new Date().toISOString();

  // Generate simulated high-res image and data
  const verificationData = generateVerificationData(mission);

  console.log(`[Drone] Mission ${missionId} completed`);
  console.log(`[Drone] Sending verification data to backend`);

  // Call backend webhook
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  fetch(`${backendUrl}/api/drone/mission-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verificationData)
  }).catch(err => {
    console.log(`[Drone] Could not reach backend: ${err.message}`);
    console.log(`[Drone] Verification data:`, verificationData);
  });

  // Keep in history but remove from active
  activeMissions.delete(missionId);
}

/**
 * Generate simulated verification data
 */
function generateVerificationData(mission) {
  const { targetLocation } = mission;
  
  // Simulate refined detection data
  const densities = ['low', 'medium', 'high'];
  const density = densities[Math.floor(Math.random() * densities.length)];
  
  const areaEstimates = { low: 120, medium: 350, high: 650 };
  const weightEstimates = { low: 25, medium: 90, high: 220 };
  
  const confidence = 0.75 + Math.random() * 0.20; // 0.75 - 0.95
  
  return {
    missionId: mission.missionId,
    highResImage: `https://storage.oceanguard.com/drone-captures/${mission.missionId}.jpg`,
    coordinates: {
      longitude: targetLocation.longitude,
      latitude: targetLocation.latitude
    },
    estimatedQuantity: {
      area: areaEstimates[density] * (0.9 + Math.random() * 0.2),
      weight: weightEstimates[density] * (0.9 + Math.random() * 0.2),
      confidence: parseFloat(confidence.toFixed(2))
    },
    plasticTypes: ['PET', 'HDPE', 'PP'],
    capturedAt: new Date().toISOString(),
    flightDuration: Math.floor(20 + Math.random() * 20), // 20-40 minutes
    imagesCaptured: Math.floor(5 + Math.random() * 10) // 5-15 images
  };
}

/**
 * @route   POST /api/drone/cancel
 * @desc    Cancel a mission
 */
app.post('/api/drone/cancel', validateApiKey, (req, res) => {
  const { missionId } = req.body;
  
  const mission = activeMissions.get(missionId);
  if (!mission) {
    return res.status(404).json({ error: 'Mission not found or already completed' });
  }

  mission.status = 'cancelled';
  mission.cancelledAt = new Date().toISOString();
  
  activeMissions.delete(missionId);
  
  console.log(`[Drone] Mission ${missionId} cancelled`);

  res.json({
    success: true,
    message: 'Mission cancelled'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚁 Drone Communication Simulation Module');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`API Key: ${API_KEY}`);
  console.log('='.repeat(60));
});

module.exports = app;
