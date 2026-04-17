# API Reference - Marine Plastic Detection System

Complete API documentation for all endpoints.

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **AI Model**: `http://localhost:5001`
- **Drone Module**: `http://localhost:5002/api/drone`

---

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@marineplastic.com",
  "password": "admin123",
  "fcmToken": "optional_fcm_token_for_mobile"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@marineplastic.com",
    "role": "admin"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update Location (Mobile)
```http
PUT /auth/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "longitude": -122.4194,
  "latitude": 37.7749
}
```

---

## Detections

### Analyze Image
```http
POST /detection/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "longitude": -122.4194,
  "latitude": 37.7749,
  "imageUrl": "https://example.com/image.jpg",
  "source": "mock",
  "resolution": "10m"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "detectionResult": {
      "plasticDetected": true,
      "density": "high",
      "confidence": 0.87,
      "estimatedArea": 523.5,
      "estimatedWeight": 178.2,
      "plasticTypes": ["PET", "HDPE"]
    },
    "priority": "high",
    "status": "detected"
  }
}
```

### Batch Analysis
```http
POST /detection/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "coordinates": [
    {
      "longitude": -122.4194,
      "latitude": 37.7749,
      "imageUrl": "https://example.com/image1.jpg"
    },
    {
      "longitude": -122.4200,
      "latitude": 37.7750,
      "imageUrl": "https://example.com/image2.jpg"
    }
  ]
}
```

### List Detections
```http
GET /detection?status=detected&priority=high&plasticDetected=true&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters**:
- `status` - detected, drone_verified, assigned, in_progress, collected, verified
- `priority` - low, medium, high, critical
- `density` - low, medium, high
- `plasticDetected` - true/false
- `longitude` / `latitude` / `radius` - Geospatial search
- `startDate` / `endDate` - Date range
- `page` / `limit` - Pagination

### Get Map Data
```http
GET /detection/map/data?bounds=-122.5,37.7,-122.3,37.8
Authorization: Bearer <token>
```

### Get Detection Details
```http
GET /detection/:id
Authorization: Bearer <token>
```

### Update Status
```http
PUT /detection/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "collected"
}
```

---

## Drones

### List Drones
```http
GET /drone
Authorization: Bearer <token>
```

### Get Drone Location
```http
GET /drone/:id/location
Authorization: Bearer <token>
```

### Trigger Drone Mission
```http
POST /drone/trigger
Authorization: Bearer <token>
Content-Type: application/json

{
  "detectionId": "detection_id_here",
  "droneId": "DRN-001",
  "priority": "high"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "missionId": "M-ABC123",
    "drone": {
      "id": "...",
      "droneId": "DRN-001",
      "name": "Sea-Eagle-1",
      "batteryLevel": 85
    },
    "estimatedArrival": "2024-01-15T10:30:00Z"
  }
}
```

---

## Workers

### List Workers
```http
GET /worker
Authorization: Bearer <token>
```

### Find Nearby Workers
```http
GET /worker/nearby?longitude=-122.4194&latitude=37.7749&radius=50000
Authorization: Bearer <token>
```

### Get Worker Details
```http
GET /worker/:id
Authorization: Bearer <token>
```

### Get Worker Stats
```http
GET /worker/:id/stats
Authorization: Bearer <token>
```

---

## Tasks

### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "detectionId": "detection_id",
  "workerId": "worker_id",
  "priority": "high",
  "scheduledDate": "2024-01-20T08:00:00Z",
  "estimatedWeight": 150,
  "notes": "Priority collection at high-density zone"
}
```

### List Tasks
```http
GET /tasks?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

### Accept Task (Worker)
```http
PUT /tasks/:id/accept
Authorization: Bearer <token>
```

### Start Task (Worker)
```http
PUT /tasks/:id/start
Authorization: Bearer <token>
```

### Complete Task (Worker)
```http
PUT /tasks/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "weight": 145.5,
  "volume": 2.5,
  "plasticTypes": ["PET", "HDPE"],
  "photos": ["url1", "url2"],
  "notes": "Collection completed successfully",
  "conditions": "Calm seas, good visibility"
}
```

### Verify Task (Supervisor)
```http
PUT /tasks/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "Good work",
  "quality": 5
}
```

---

## Analytics

### Dashboard Stats
```http
GET /analytics/dashboard
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDetections": 150,
      "plasticDetections": 120,
      "collectedCount": 45,
      "collectionRate": "37.5",
      "totalWeight": 1234.5
    },
    "recentActivity": {
      "detectionsLast7Days": 23,
      "collectionsLast7Days": 8
    }
  }
}
```

### Trends
```http
GET /analytics/trends?days=30
Authorization: Bearer <token>
```

### Zone Statistics
```http
GET /analytics/zones
Authorization: Bearer <token>
```

### Worker Performance
```http
GET /analytics/workers?days=30
Authorization: Bearer <token>
```

### Plastic Types Breakdown
```http
GET /analytics/plastic-types
Authorization: Bearer <token>
```

---

## AI Model API

### Health Check
```http
GET /health
```

### Predict Plastic
```http
POST /predict
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "coordinates": {
    "longitude": -122.4194,
    "latitude": 37.7749
  }
}
```

**Response**:
```json
{
  "plastic_detected": true,
  "density": "high",
  "confidence": 0.87,
  "estimated_area": 523.5,
  "estimated_weight": 178.2,
  "plastic_types": ["PET", "HDPE"],
  "model_version": "1.0.0",
  "processing_time": 1.23
}
```

### Batch Predict
```http
POST /predict-batch
Content-Type: application/json

{
  "images": [
    {"imageUrl": "...", "coordinates": {...}},
    {"imageUrl": "...", "coordinates": {...}}
  ]
}
```

### Model Info
```http
GET /model/info
```

---

## Drone Module API

### Health Check
```http
GET /health
```

### Create Mission
```http
POST /api/drone/mission
X-API-Key: drone_simulation_key_12345
Content-Type: application/json

{
  "droneId": "DRN-001",
  "targetLocation": {
    "longitude": -122.4194,
    "latitude": 37.7749
  },
  "priority": "high",
  "detectionId": "detection_id"
}
```

### Get Mission Status
```http
GET /api/drone/mission/:missionId
X-API-Key: drone_simulation_key_12345
```

### List Missions
```http
GET /api/drone/missions?status=assigned&droneId=DRN-001
X-API-Key: drone_simulation_key_12345
```

---

## WebSocket Events

Connect to `ws://localhost:5000` for real-time updates.

### Client → Server
```json
{
  "role": "admin",
  "userId": "user_id"
}
```

### Server → Client Events

**New Detection**:
```json
{
  "event": "new-detection",
  "detection": { ... }
}
```

**Detection Status Update**:
```json
{
  "event": "detection-status-update",
  "detectionId": "...",
  "status": "collected"
}
```

**Drone Mission Assigned**:
```json
{
  "event": "drone-mission-assigned",
  "detectionId": "...",
  "droneId": "DRN-001",
  "missionId": "M-ABC123"
}
```

**New Task (Worker)**:
```json
{
  "event": "new-task",
  "task": { ... }
}
```

---

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error
