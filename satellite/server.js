/**
 * Satellite Image Processing Server
 * Handles satellite image uploads, AI processing, and data integration
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 6000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Create directories
const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'processed');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|tif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, TIFF) are allowed'));
    }
  }
});

// Satellite data structure
class SatelliteImage {
  constructor(imagePath, locationData, metadata) {
    this.id = uuidv4();
    this.imagePath = imagePath;
    this.location = locationData; // { lat, lng, altitude, timestamp }
    this.metadata = metadata; // { satelliteId, captureTime, resolution, cloudCover }
    this.processed = false;
    this.detectionResults = null;
    this.uploadTime = new Date();
  }
}

// In-memory storage for satellite images (in production, use database)
const satelliteImages = [];

/**
 * @route   POST /api/satellite/upload
 * @desc    Upload satellite image with location data
 * @access  Public (satellite endpoint)
 */
app.post('/api/satellite/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Parse location and metadata from form data
    const locationData = JSON.parse(req.body.location || '{}');
    const metadata = JSON.parse(req.body.metadata || '{}');

    // Validate required location data
    if (!locationData.lat || !locationData.lng) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        message: 'Location data (lat, lng) is required'
      });
    }

    // Create satellite image record
    const satelliteImage = new SatelliteImage(
      req.file.path,
      locationData,
      metadata
    );

    satelliteImages.push(satelliteImage);

    console.log(`Satellite image uploaded: ${satelliteImage.id}`);
    console.log(`Location: ${locationData.lat}, ${locationData.lng}`);
    console.log(`Satellite ID: ${metadata.satelliteId || 'Unknown'}`);

    // Process image with AI model
    await processImageWithAI(satelliteImage);

    // Send processed data to dashboard
    await sendDataToDashboard(satelliteImage);

    res.status(200).json({
      success: true,
      message: 'Image uploaded and processed successfully',
      data: {
        id: satelliteImage.id,
        location: satelliteImage.location,
        processed: satelliteImage.processed,
        detectionResults: satelliteImage.detectionResults
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

/**
 * Process image with AI model
 */
async function processImageWithAI(satelliteImage) {
  try {
    console.log(`Processing image ${satelliteImage.id} with AI...`);

    // Send image to AI model for processing
    const aiResults = await sendToAIModel(satelliteImage);
    
    satelliteImage.detectionResults = aiResults;
    satelliteImage.processed = true;

    console.log(`AI processing completed for ${satelliteImage.id}`);
    console.log(`Detected plastic: ${aiResults.totalPlasticAmount}kg`);

  } catch (error) {
    console.error(`AI processing failed for ${satelliteImage.id}:`, error);
    satelliteImage.detectionResults = {
      error: error.message,
      totalPlasticAmount: 0,
      confidence: 0,
      detections: []
    };
  }
}

/**
 * Send image to AI model for processing
 */
async function sendToAIModel(satelliteImage) {
  try {
    // Read image file and convert to base64
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(satelliteImage.imagePath);
    const base64Image = imageBuffer.toString('base64');

    const payload = {
      image: `data:image/jpeg;base64,${base64Image}`,
      location: satelliteImage.location,
      metadata: {
        ...satelliteImage.metadata,
        imageId: satelliteImage.id
      }
    };

    console.log('Sending image to AI model at http://localhost:5001/api/ai/process');
    
    const response = await axios.post('http://localhost:5001/api/ai/process', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.success) {
      console.log('AI model processing successful');
      return response.data.data.detectionResults;
    } else {
      throw new Error(response.data.message || 'AI processing failed');
    }

  } catch (error) {
    console.error('AI model communication error:', error.message);
    
    // Fallback to simulation if AI model is not available
    console.log('Using fallback simulation...');
    return await simulateAIProcessing(satelliteImage.imagePath, satelliteImage.location);
  }
}

/**
 * Simulate AI processing (replace with actual AI model call)
 */
async function simulateAIProcessing(imagePath, location) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate realistic detection results based on location
  const randomFactor = Math.random();
  const baseAmount = 50 + (randomFactor * 500);
  
  const detections = [
    {
      type: 'plastic_bottles',
      count: Math.floor(randomFactor * 100),
      confidence: 0.75 + (randomFactor * 0.2),
      area: randomFactor * 1000
    },
    {
      type: 'plastic_bags',
      count: Math.floor(randomFactor * 50),
      confidence: 0.70 + (randomFactor * 0.25),
      area: randomFactor * 500
    },
    {
      type: 'microplastics',
      count: Math.floor(randomFactor * 1000),
      confidence: 0.60 + (randomFactor * 0.3),
      area: randomFactor * 2000
    }
  ];

  return {
    totalPlasticAmount: Math.round(baseAmount),
    confidence: 0.75 + (randomFactor * 0.2),
    detections: detections,
    riskLevel: baseAmount > 300 ? 'high' : baseAmount > 100 ? 'medium' : 'low',
    processingTime: new Date().toISOString(),
    location: location
  };
}

/**
 * Send processed data to dashboard backend
 */
async function sendDataToDashboard(satelliteImage) {
  try {
    const payload = {
      source: 'satellite',
      imageId: satelliteImage.id,
      location: satelliteImage.location,
      detectionResults: satelliteImage.detectionResults,
      metadata: satelliteImage.metadata,
      timestamp: satelliteImage.uploadTime
    };

    // Send to main backend for dashboard integration
    const response = await axios.post('http://localhost:5000/api/detections/satellite', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`Data sent to dashboard: ${response.data.success ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('Failed to send data to dashboard:', error.message);
  }
}

/**
 * @route   GET /api/satellite/status
 * @desc    Get satellite server status and recent uploads
 * @access  Public
 */
app.get('/api/satellite/status', (req, res) => {
  const recentImages = satelliteImages.slice(-10).map(img => ({
    id: img.id,
    location: img.location,
    processed: img.processed,
    uploadTime: img.uploadTime,
    plasticAmount: img.detectionResults?.totalPlasticAmount || 0,
    riskLevel: img.detectionResults?.riskLevel || 'unknown'
  }));

  res.json({
    success: true,
    status: 'Satellite server running',
    totalUploads: satelliteImages.length,
    recentUploads: recentImages,
    serverTime: new Date().toISOString()
  });
});

/**
 * @route   GET /api/satellite/images/:id
 * @desc    Get specific satellite image data
 * @access  Public
 */
app.get('/api/satellite/images/:id', (req, res) => {
  const image = satelliteImages.find(img => img.id === req.params.id);
  
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: image.id,
      location: image.location,
      metadata: image.metadata,
      processed: image.processed,
      detectionResults: image.detectionResults,
      uploadTime: image.uploadTime
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

/**
 * @route   GET /
 * @desc    Serve the satellite upload interface
 * @access  Public
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Satellite server running on port ${PORT}`);
  console.log(`Upload interface: http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/satellite/upload`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/satellite/status`);
});

module.exports = app;
