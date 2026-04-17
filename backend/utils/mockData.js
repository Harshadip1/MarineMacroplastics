/**
 * Mock Data for Offline Development
 * Provides sample data when database is not available
 */

const generateMockDetections = () => [
  {
    _id: 'det_001',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749]
    },
    detectionResult: {
      plasticDetected: true,
      density: 'high',
      confidence: 0.87,
      estimatedArea: 523.5,
      estimatedWeight: 178.2,
      plasticTypes: ['PET', 'HDPE']
    },
    priority: 'high',
    status: 'detected',
    createdAt: new Date()
  },
  {
    _id: 'det_002',
    location: {
      type: 'Point',
      coordinates: [-122.4094, 37.7649]
    },
    detectionResult: {
      plasticDetected: true,
      density: 'medium',
      confidence: 0.72,
      estimatedArea: 234.1,
      estimatedWeight: 89.5,
      plasticTypes: ['PP', 'LDPE']
    },
    priority: 'medium',
    status: 'drone_verified',
    createdAt: new Date()
  }
];

const generateMockDrones = () => [
  {
    _id: 'drn_001',
    droneId: 'DRN-001',
    name: 'Sea-Eagle-1',
    status: 'available',
    batteryLevel: 85,
    currentLocation: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749]
    },
    lastMission: null
  },
  {
    _id: 'drn_002',
    droneId: 'DRN-002',
    name: 'Ocean-Hawk-2',
    status: 'in_mission',
    batteryLevel: 67,
    currentLocation: {
      type: 'Point',
      coordinates: [-122.4094, 37.7649]
    },
    lastMission: 'M-ABC123'
  }
];

const generateMockTasks = () => [
  {
    _id: 'task_001',
    taskId: 'TSK-001',
    title: 'High Density Plastic Collection',
    description: 'Collect high-density plastic near Pier 39',
    priority: 'high',
    status: 'pending',
    assignedTo: {
      _id: 'worker_001',
      name: 'Worker One',
      email: 'worker1@marineplastic.com'
    },
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749]
    },
    estimatedWeight: 150,
    scheduledDate: new Date(),
    createdAt: new Date()
  },
  {
    _id: 'task_002',
    taskId: 'TSK-002',
    title: 'Medium Priority Collection',
    description: 'Collect plastic debris near Golden Gate Bridge',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: {
      _id: 'worker_002',
      name: 'Worker Two',
      email: 'worker2@marineplastic.com'
    },
    location: {
      type: 'Point',
      coordinates: [-122.4783, 37.8199]
    },
    estimatedWeight: 75,
    scheduledDate: new Date(),
    createdAt: new Date()
  }
];

const generateMockAnalytics = () => ({
  overview: {
    totalDetections: 156,
    plasticDetections: 142,
    collectedCount: 67,
    collectionRate: '42.7',
    totalWeight: 2345.6,
    totalWorkers: 3,
    totalZones: 2
  },
  recentActivity: {
    detectionsLast7Days: 23,
    collectionsLast7Days: 8
  },
  trends: [
    { date: '2024-01-15', detections: 12, collections: 5 },
    { date: '2024-01-16', detections: 15, collections: 7 },
    { date: '2024-01-17', detections: 18, collections: 6 }
  ],
  zones: [
    {
      _id: 'zone_001',
      name: 'San Francisco Bay Area',
      code: 'SF-001',
      totalDetections: 89,
      highPriorityDetections: 23,
      collected: 45
    },
    {
      _id: 'zone_002',
      name: 'Pacific Coast',
      code: 'PC-002',
      totalDetections: 67,
      highPriorityDetections: 18,
      collected: 22
    }
  ],
  plasticTypes: [
    { _id: 'PET', count: 234, totalWeight: 567.8 },
    { _id: 'HDPE', count: 189, totalWeight: 445.2 },
    { _id: 'PP', count: 156, totalWeight: 334.1 },
    { _id: 'LDPE', count: 98, totalWeight: 198.5 }
  ]
});

const generateMockWorkers = () => [
  {
    _id: 'worker_001',
    name: 'Worker One',
    email: 'worker1@marineplastic.com',
    role: 'worker',
    phone: '+1234567890',
    isActive: true,
    stats: {
      totalCollections: 15,
      totalWeight: 234.5,
      tasksCompleted: 18,
      tasksAssigned: 22
    }
  },
  {
    _id: 'worker_002',
    name: 'Worker Two',
    email: 'worker2@marineplastic.com',
    role: 'worker',
    phone: '+1234567891',
    isActive: true,
    stats: {
      totalCollections: 12,
      totalWeight: 189.3,
      tasksCompleted: 14,
      tasksAssigned: 17
    }
  }
];

module.exports = {
  generateMockDetections,
  generateMockDrones,
  generateMockTasks,
  generateMockAnalytics,
  generateMockWorkers
};
