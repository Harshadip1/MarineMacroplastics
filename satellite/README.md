# Satellite Image Processing System

This system handles satellite image uploads, AI processing, and integration with the Marine Plastic Detection dashboard.

## Features

- **Image Upload**: Accepts satellite images with location data
- **AI Processing**: Processes images to detect marine plastic
- **Location Integration**: Uses precise GPS coordinates for accurate mapping
- **Dashboard Integration**: Sends processed data to main dashboard
- **Real-time Processing**: Automatic AI processing and data transfer

## Architecture

```
Satellite -> Satellite Server -> AI Processing -> Dashboard Backend -> Frontend
```

## Setup

### 1. Install Dependencies

```bash
cd satellite
npm install
```

### 2. Start Satellite Server

```bash
npm start
# or for development
npm run dev
```

The server will run on port 6000.

### 3. Ensure Main Backend is Running

The main backend should be running on port 5000 to receive processed data.

## API Endpoints

### Upload Satellite Image

```
POST /api/satellite/upload
Content-Type: multipart/form-data

Form Data:
- image: Image file (JPEG, PNG, TIFF)
- location: JSON string with location data
- metadata: JSON string with additional metadata
```

#### Location Data Format

```json
{
  "lat": 19.0760,
  "lng": 72.8777,
  "altitude": 400000,
  "timestamp": "2024-01-15T10:30:00Z",
  "accuracy": 10
}
```

#### Metadata Format

```json
{
  "satelliteId": "SAT-001",
  "captureTime": "2024-01-15T10:30:00Z",
  "resolution": 0.5,
  "cloudCover": 10,
  "sensorType": "optical"
}
```

### Get Server Status

```
GET /api/satellite/status
```

### Get Image Data

```
GET /api/satellite/images/:id
```

## Usage Examples

### Using the Satellite Client

```javascript
const SatelliteClient = require('./client-example');

const satellite = new SatelliteClient('SAT-001');

// Upload image with location
await satellite.uploadImage(
  './satellite-image.jpg',
  {
    lat: 19.0760,
    lng: 72.8777,
    altitude: 400000
  },
  {
    resolution: 0.5,
    cloudCover: 10
  }
);
```

### Using curl

```bash
curl -X POST http://localhost:6000/api/satellite/upload \
  -F "image=@satellite-image.jpg" \
  -F 'location={"lat":19.0760,"lng":72.8777,"altitude":400000}' \
  -F 'metadata={"satelliteId":"SAT-001","resolution":0.5}'
```

## AI Processing

The system processes uploaded images to detect:

- **Plastic Bottles**: Count and concentration
- **Plastic Bags**: Distribution patterns
- **Microplastics**: Small particle detection
- **Risk Assessment**: High/Medium/Low risk classification

## Data Flow

1. **Satellite** captures image with GPS coordinates
2. **Upload** to satellite server with metadata
3. **AI Processing** analyzes image for plastic detection
4. **Results** sent to main dashboard backend
5. **Dashboard** updates with new detection data
6. **Map** shows color-coded risk zones

## Integration with Dashboard

Processed data is automatically sent to the main backend and appears in:

- **Dashboard**: Real-time statistics and charts
- **Area Map**: Color-coded zones based on risk levels
- **Area Data**: Detailed detection information

## File Structure

```
satellite/
  server.js              # Main satellite server
  client-example.js      # Example satellite client
  package.json           # Dependencies
  README.md              # This file
  uploads/               # Uploaded images (auto-created)
  processed/             # Processed results (auto-created)
```

## Configuration

The satellite server can be configured by:

- Changing port in `server.js`
- Updating AI processing logic
- Modifying dashboard backend URL
- Adjusting file size limits

## Error Handling

The system handles:

- Invalid image formats
- Missing location data
- Large file sizes
- Network failures
- AI processing errors

## Production Considerations

- Use database instead of in-memory storage
- Implement authentication for satellite endpoints
- Add image compression
- Implement retry logic for dashboard updates
- Add monitoring and logging
- Scale AI processing with queue system
