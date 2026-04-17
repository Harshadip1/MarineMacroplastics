# Marine Plastic Detection - Backend API

Node.js + Express backend server for the Marine Plastic Detection System.

## 🚀 Features

- **RESTful API**: Full-featured API for all system operations
- **JWT Authentication**: Secure token-based authentication
- **WebSocket Support**: Real-time updates via Socket.io
- **MongoDB Integration**: Document-based data storage
- **Rate Limiting**: API protection against abuse
- **File Uploads**: Multer for image handling
- **Comprehensive Logging**: Winston logger

## 📁 Structure

```
backend/
├── middleware/       # Express middleware (auth, error handling)
├── models/          # Mongoose models
├── routes/          # API route handlers
├── utils/           # Utility functions
├── scripts/         # Database seeding and utilities
├── server.js        # Main entry point
└── .env.example     # Environment template
```

## 🔧 Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB** (locally or use MongoDB Atlas)

4. **Seed database** (optional):
```bash
npm run seed
```

5. **Run server**:
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/location | Update worker location |

### Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/detection/analyze | Analyze satellite image |
| POST | /api/detection/batch | Batch process images |
| GET | /api/detection | Get all detections |
| GET | /api/detection/:id | Get single detection |
| GET | /api/detection/map/data | Get map-ready data |
| PUT | /api/detection/:id/status | Update status |

### Drone
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/drone/trigger | Trigger drone mission |
| GET | /api/drone | List all drones |
| GET | /api/drone/:id/location | Get drone location |
| PUT | /api/drone/:id/status | Update drone status |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tasks | Create task |
| GET | /api/tasks | List tasks |
| PUT | /api/tasks/:id/accept | Accept task |
| PUT | /api/tasks/:id/start | Start task |
| PUT | /api/tasks/:id/complete | Complete task |
| PUT | /api/tasks/:id/verify | Verify completion |

### Workers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/worker | List workers |
| GET | /api/worker/nearby | Find nearby workers |
| PUT | /api/worker/:id/zone | Assign zone |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/dashboard | Dashboard stats |
| GET | /api/analytics/trends | Time trends |
| GET | /api/analytics/zones | Zone stats |
| GET | /api/analytics/workers | Worker performance |

## 🔒 Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## 📡 WebSocket Events

- `new-detection` - New plastic detection
- `detection-status-update` - Status change
- `drone-mission-assigned` - Drone dispatched
- `drone-verification-complete` - Drone verification done
- `new-task` - New task assigned
- `task-completed` - Task completion
- `task-verified` - Task verification
