# AI-Based Marine Plastic Detection System - Setup Guide

Complete setup instructions for deploying the full system.

## 📋 Prerequisites

### Required Software
- **Node.js** 16+ with npm
- **Python** 3.8+ with pip
- **MongoDB** 5.0+ (local or MongoDB Atlas)
- **Android Studio** (for mobile app)
- **Java** 11+ (for Android)

### Optional
- **Firebase account** (for push notifications)
- **Google Maps API key** (for mobile maps)

---

## 🚀 Quick Start (All Modules)

### 1. Clone/Navigate to Project
```bash
cd marine-plastic-detection
```

### 2. Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 3. Setup and Run Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed  # Creates default users
npm run dev   # Starts on port 5000
```

### 4. Setup and Run AI Model Service
```bash
cd ../ai-model
pip install -r requirements.txt
python app.py  # Starts on port 5001
```

### 5. Setup and Run Drone Module
```bash
cd ../drone-module
npm install
npm start  # Starts on port 5002
```

### 6. Setup and Run Frontend Dashboard
```bash
cd ../frontend
npm install
npm start  # Starts on port 3000
```

### 7. Open Mobile App in Android Studio
- Open `mobile-app/` folder in Android Studio
- Sync project with Gradle
- Run on emulator or device

---

## 📁 Module-Specific Setup

### Backend (`/backend`)

**Environment Variables** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/marine_plastic
JWT_SECRET=your_super_secret_key
AI_MODEL_URL=http://localhost:5001
DRONE_MODULE_URL=http://localhost:5002
```

**Default Login Credentials**:
- Admin: `admin@marineplastic.com` / `admin123`
- Supervisor: `supervisor@marineplastic.com` / `supervisor123`
- Workers: `worker1@marineplastic.com` / `worker123`

**Commands**:
```bash
npm install          # Install dependencies
npm run dev          # Development mode with hot reload
npm start            # Production mode
npm run seed         # Seed database with test data
npm test             # Run tests
```

**API Documentation**:
- Base URL: `http://localhost:5000`
- API endpoints: `/api/*`
- Health check: `GET /health`
- Socket.io: Real-time updates on same port

---

### Frontend Dashboard (`/frontend`)

**Environment Variables** (`.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Commands**:
```bash
npm install          # Install dependencies
npm start            # Start development server (port 3000)
npm run build        # Build for production
npm test             # Run tests
```

**Features**:
- Interactive map with Leaflet.js
- Real-time updates via Socket.io
- Charts with Chart.js
- Responsive design with Tailwind CSS

---

### AI Model Service (`/ai-model`)

**Environment Variables** (`.env`):
```env
PORT=5001
MODEL_PATH=./models/plastic_detector.h5
```

**Commands**:
```bash
# Install dependencies
pip install -r requirements.txt

# Run the API server
python app.py

# Or use a production WSGI server
waitress-serve --port=5001 app:app
```

**Training Model** (optional):
```bash
# Generate synthetic training data
python -c "from model import generate_synthetic_dataset; generate_synthetic_dataset('./datasets/synthetic', 100)"

# Train the model
python train.py --dataset ./datasets/synthetic --epochs 20 --output ./models/plastic_detector.h5
```

**API Endpoints**:
- `POST /predict` - Analyze image for plastic
- `POST /predict-batch` - Batch prediction
- `GET /model/info` - Model information
- `GET /health` - Health check

---

### Drone Module (`/drone-module`)

**Environment Variables** (`.env`):
```env
PORT=5002
DRONE_API_KEY=drone_simulation_key_12345
BACKEND_URL=http://localhost:5000
```

**Commands**:
```bash
npm install
npm start        # Development
npm run dev      # With nodemon
```

**API Endpoints**:
- `POST /api/drone/mission` - Create new mission
- `GET /api/drone/mission/:id` - Get mission status
- `POST /api/drone/cancel` - Cancel mission

---

### Mobile App (`/mobile-app`)

**Setup Steps**:

1. **Configure API Base URL** in `app/src/main/java/com/oceanguard/marineplastic/di/NetworkModule.kt`:
```kotlin
const val BASE_URL = "http://10.0.2.2:5000/api/"  // For emulator
// or
const val BASE_URL = "http://YOUR_IP:5000/api/"   // For device
```

2. **Add Firebase Configuration**:
   - Download `google-services.json` from Firebase Console
   - Place in `app/` directory

3. **Configure Maps API Key** in `local.properties`:
```properties
MAPS_API_KEY=your_google_maps_api_key
```

4. **Build and Run**:
   - Open in Android Studio
   - Sync Gradle
   - Run on device or emulator

**Default Login**:
- Email: `worker1@marineplastic.com`
- Password: `worker123`

---

## 🧪 Testing with Postman

Import these example requests:

### Authentication
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@marineplastic.com",
  "password": "admin123"
}
```

### Create Detection
```http
POST http://localhost:5000/api/detection/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "longitude": -122.4194,
  "latitude": 37.7749,
  "imageUrl": "https://example.com/satellite-image.jpg",
  "source": "mock"
}
```

### Trigger Drone
```http
POST http://localhost:5000/api/drone/trigger
Authorization: Bearer <token>
Content-Type: application/json

{
  "detectionId": "<detection-id>",
  "priority": "high"
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Backend won't start**:
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check port 5000 is available
lsof -i :5000
```

**AI Model fails to load**:
- Model will use mock predictions if TensorFlow model isn't trained
- This is normal for initial setup

**Frontend can't connect to backend**:
- Verify CORS is enabled in backend
- Check `REACT_APP_API_URL` matches backend port

**Mobile app can't connect**:
- Use `10.0.2.2` for Android emulator (points to host localhost)
- Use actual IP address for physical device
- Ensure backend is accessible from device network

**Drone module webhook fails**:
- Backend webhook is optional
- Drone will still simulate missions without it

---

## 📊 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Web App  │────▶│  Node.js API    │◀────│  Android App    │
│   (Port 3000)   │     │   (Port 5000)   │     │   (Kotlin)      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │  Python AI   │  │ Drone Sim    │  │   MongoDB    │
      │  (Port 5001) │  │ (Port 5002)  │  │  (Port 27017)│
      └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📝 Environment Summary

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 5000 | Main REST API & WebSocket |
| AI Model | 5001 | Plastic detection predictions |
| Drone Module | 5002 | Drone mission simulation |
| Frontend | 3000 | React web dashboard |
| MongoDB | 27017 | Database |

---

## 🌐 Production Deployment

### Backend (with Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Frontend
```bash
npm run build
# Serve build/ folder with nginx or similar
```

### AI Model
```bash
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

---

## 📞 Support

For issues or questions:
1. Check individual module README files
2. Review API documentation at `/api` endpoints
3. Check logs in each module's console output
