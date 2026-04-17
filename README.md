# AI-Based Marine Plastic Detection and Collection System

A comprehensive system for detecting marine plastic pollution using AI/ML, coordinating drone verification, and managing collection operations through a web dashboard and mobile app.

## 🌊 Project Overview

This system automates marine plastic detection using satellite imagery, AI classification, and coordinated drone-worker operations for efficient ocean cleanup.

### Key Features
- **AI-Powered Detection**: Automatically detect plastic pollution in satellite images
- **Real-time Dashboard**: Monitor plastic zones, drone status, and collection metrics
- **Mobile Coordination**: Assign and track cleanup tasks for field workers
- **Drone Integration**: Automated verification and high-resolution imaging
- **Analytics & Reporting**: Track collection progress and environmental impact

## 🏗️ Architecture

```
marine-plastic-detection/
├── backend/          # Node.js + Express API Server
├── frontend/         # React.js Web Dashboard
├── ai-model/         # Python TensorFlow/PyTorch ML Model
├── mobile-app/       # Kotlin Android Application
├── drone-module/     # Simulated Drone API
└── shared-resources/ # Datasets and test images
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB 5.0+
- Android Studio (for mobile app)
- Java 11+ (for Android)

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### 2. Start Frontend Dashboard
```bash
cd frontend
npm install
npm start
```

### 3. Start AI Model Service
```bash
cd ai-model
pip install -r requirements.txt
python app.py
```

### 4. Start Drone Simulation
```bash
cd drone-module
npm install
npm start
```

### 5. Open Mobile App
Open `mobile-app/` in Android Studio and run on emulator or device.

## 📚 Documentation

- [Backend API Documentation](backend/README.md)
- [Frontend Setup](frontend/README.md)
- [AI Model Training](ai-model/README.md)
- [Mobile App Setup](mobile-app/README.md)
- [Drone Module](drone-module/README.md)

## 🔧 Environment Variables

Create `.env` files in each module:

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/marine_plastic
JWT_SECRET=your_jwt_secret_key
FIREBASE_PROJECT_ID=your_firebase_project
AI_MODEL_URL=http://localhost:5001
DRONE_MODULE_URL=http://localhost:5002
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### AI Model (.env)
```
PORT=5001
MODEL_PATH=./models/plastic_detector.h5
```

## 🧪 Testing

### API Testing (Postman)
Import the collection from `shared-resources/postman/` directory.

### Run Tests
```bash
# Backend tests
cd backend
npm test

# AI model tests
cd ai-model
python test_model.py
```

## 📱 Mobile App Screenshots

See `shared-resources/screenshots/` for UI previews.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Marine plastic datasets from public ocean cleanup initiatives
- TensorFlow and PyTorch communities
- OpenStreetMap for map visualization
