/**
 * Database Seeding Script
 * Creates initial data for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Zone = require('../models/Zone');
const Drone = require('../models/Drone');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marine_plastic';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Zone.deleteMany({});
    await Drone.deleteMany({});

    // Create Admin User
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@marineplastic.com',
      password: adminPassword,
      role: 'admin',
      phone: '+1-555-0100'
    });
    console.log('Admin created:', admin.email);

    // Create Supervisor
    console.log('Creating supervisor...');
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);
    const supervisor = await User.create({
      name: 'John Supervisor',
      email: 'supervisor@marineplastic.com',
      password: supervisorPassword,
      role: 'supervisor',
      phone: '+1-555-0101'
    });
    console.log('Supervisor created:', supervisor.email);

    // Create Workers
    console.log('Creating workers...');
    const workerPassword = await bcrypt.hash('worker123', 10);
    const workers = [
      {
        name: 'Mike Worker',
        email: 'worker1@marineplastic.com',
        password: workerPassword,
        role: 'worker',
        phone: '+1-555-0201',
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        }
      },
      {
        name: 'Sarah Worker',
        email: 'worker2@marineplastic.com',
        password: workerPassword,
        role: 'worker',
        phone: '+1-555-0202',
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4194, 37.7849]
        }
      },
      {
        name: 'David Worker',
        email: 'worker3@marineplastic.com',
        password: workerPassword,
        role: 'worker',
        phone: '+1-555-0203',
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4294, 37.7749]
        }
      }
    ];

    const createdWorkers = await User.insertMany(workers);
    console.log(`${createdWorkers.length} workers created`);

    // Create Zones
    console.log('Creating zones...');
    const zones = [
      {
        name: 'San Francisco Bay',
        code: 'SFB-001',
        description: 'Northern California coastal waters',
        country: 'USA',
        region: 'California',
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [-122.5, 37.7],
            [-122.3, 37.7],
            [-122.3, 37.8],
            [-122.5, 37.8],
            [-122.5, 37.7]
          ]]
        },
        centerPoint: {
          type: 'Point',
          coordinates: [-122.4, 37.75]
        },
        assignedWorkers: createdWorkers.slice(0, 2).map(w => w._id),
        supervisor: supervisor._id
      },
      {
        name: 'Monterey Bay',
        code: 'MB-001',
        description: 'Monterey Bay marine sanctuary',
        country: 'USA',
        region: 'California',
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [-122.1, 36.5],
            [-121.8, 36.5],
            [-121.8, 36.7],
            [-122.1, 36.7],
            [-122.1, 36.5]
          ]]
        },
        centerPoint: {
          type: 'Point',
          coordinates: [-121.95, 36.6]
        },
        assignedWorkers: [createdWorkers[2]._id],
        supervisor: supervisor._id
      }
    ];

    const createdZones = await Zone.insertMany(zones);
    console.log(`${createdZones.length} zones created`);

    // Update workers with assigned zones
    await User.findByIdAndUpdate(createdWorkers[0]._id, { assignedZone: createdZones[0]._id });
    await User.findByIdAndUpdate(createdWorkers[1]._id, { assignedZone: createdZones[0]._id });
    await User.findByIdAndUpdate(createdWorkers[2]._id, { assignedZone: createdZones[1]._id });

    // Create Drones
    console.log('Creating drones...');
    const drones = [
      {
        droneId: 'DRN-001',
        name: 'Sea-Eagle-1',
        model: 'DJI Matrice 300 RTK',
        serialNumber: 'SN123456789',
        status: 'idle',
        homeLocation: {
          type: 'Point',
          coordinates: [-122.4, 37.77]
        },
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4, 37.77]
        },
        specifications: {
          maxFlightTime: 55,
          maxSpeed: 82,
          maxAltitude: 500,
          cameraResolution: '20MP',
          batteryCapacity: 5935,
          windResistance: 15
        },
        batteryLevel: 85
      },
      {
        droneId: 'DRN-002',
        name: 'Sea-Eagle-2',
        model: 'DJI Matrice 300 RTK',
        serialNumber: 'SN123456790',
        status: 'idle',
        homeLocation: {
          type: 'Point',
          coordinates: [-121.95, 36.6]
        },
        currentLocation: {
          type: 'Point',
          coordinates: [-121.95, 36.6]
        },
        specifications: {
          maxFlightTime: 55,
          maxSpeed: 82,
          maxAltitude: 500,
          cameraResolution: '20MP',
          batteryCapacity: 5935,
          windResistance: 15
        },
        batteryLevel: 92
      },
      {
        droneId: 'DRN-003',
        name: 'Ocean-Scout-1',
        model: 'Autel EVO II',
        serialNumber: 'SN987654321',
        status: 'charging',
        homeLocation: {
          type: 'Point',
          coordinates: [-122.4, 37.77]
        },
        currentLocation: {
          type: 'Point',
          coordinates: [-122.4, 37.77]
        },
        specifications: {
          maxFlightTime: 40,
          maxSpeed: 72,
          maxAltitude: 700,
          cameraResolution: '48MP',
          batteryCapacity: 7100,
          windResistance: 12
        },
        batteryLevel: 15
      }
    ];

    await Drone.insertMany(drones);
    console.log(`${drones.length} drones created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@marineplastic.com / admin123');
    console.log('Supervisor: supervisor@marineplastic.com / supervisor123');
    console.log('Workers: worker1@marineplastic.com / worker123');
    console.log('           worker2@marineplastic.com / worker123');
    console.log('           worker3@marineplastic.com / worker123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
