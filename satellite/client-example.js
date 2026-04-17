/**
 * Satellite Client Example
 * Demonstrates how to upload images from satellite to the processing server
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const SATELLITE_SERVER_URL = 'http://localhost:6000';

class SatelliteClient {
  constructor(satelliteId = 'SAT-001') {
    this.satelliteId = satelliteId;
    this.baseUrl = SATELLITE_SERVER_URL;
  }

  /**
   * Upload satellite image with location data
   * @param {string} imagePath - Path to the image file
   * @param {object} locationData - Location information
   * @param {object} metadata - Additional metadata
   */
  async uploadImage(imagePath, locationData, metadata = {}) {
    try {
      // Validate inputs
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      if (!locationData.lat || !locationData.lng) {
        throw new Error('Location data (lat, lng) is required');
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));
      formData.append('location', JSON.stringify({
        lat: locationData.lat,
        lng: locationData.lng,
        altitude: locationData.altitude || 0,
        timestamp: locationData.timestamp || new Date().toISOString(),
        accuracy: locationData.accuracy || 10
      }));
      formData.append('metadata', JSON.stringify({
        satelliteId: this.satelliteId,
        captureTime: metadata.captureTime || new Date().toISOString(),
        resolution: metadata.resolution || 1.0,
        cloudCover: metadata.cloudCover || 0,
        sensorType: metadata.sensorType || 'optical',
        ...metadata
      }));

      // Upload to satellite server
      const response = await axios.post(`${this.baseUrl}/api/satellite/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 seconds timeout
      });

      console.log('Upload successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('Upload failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get satellite server status
   */
  async getStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/satellite/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get status:', error.message);
      throw error;
    }
  }

  /**
   * Get specific image data
   */
  async getImageData(imageId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/satellite/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get image data:', error.message);
      throw error;
    }
  }
}

// Example usage
async function demoSatelliteUpload() {
  const satellite = new SatelliteClient('SAT-001');

  try {
    // Check server status
    console.log('Checking satellite server status...');
    const status = await satellite.getStatus();
    console.log('Server status:', status);

    // Example location data (Mumbai coast)
    const locationData = {
      lat: 19.0760,
      lng: 72.8777,
      altitude: 400000, // 400km altitude
      timestamp: new Date().toISOString(),
      accuracy: 5 // 5 meters accuracy
    };

    // Example metadata
    const metadata = {
      captureTime: new Date().toISOString(),
      resolution: 0.5, // 0.5 meters per pixel
      cloudCover: 10, // 10% cloud cover
      sensorType: 'multispectral',
      bands: ['red', 'green', 'blue', 'nir']
    };

    // Upload image (you need to provide actual image path)
    const imagePath = './sample-satellite-image.jpg';
    
    // Create a dummy image for demo (remove this in production)
    if (!fs.existsSync(imagePath)) {
      console.log('Creating dummy image for demo...');
      // In production, you would use actual satellite images
      console.log('Please provide a real satellite image file for upload');
      return;
    }

    console.log('Uploading satellite image...');
    const result = await satellite.uploadImage(imagePath, locationData, metadata);
    console.log('Upload result:', result);

  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Export for use in other modules
module.exports = SatelliteClient;

// Run demo if called directly
if (require.main === module) {
  demoSatelliteUpload();
}
