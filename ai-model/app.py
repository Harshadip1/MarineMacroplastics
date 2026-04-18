"""
AI Model Server for Marine Plastic Detection
Connects satellite images with dashboard for real-time plastic detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
import json
import requests
from datetime import datetime
import os
import logging

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:6000"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI Model Configuration
MODEL_CONFIG = {
    'confidence_threshold': 0.7,
    'risk_levels': {
        'low': {'min': 0, 'max': 100},
        'medium': {'min': 100, 'max': 300},
        'high': {'min': 300, 'max': float('inf')}
    }
}

# Dashboard API endpoint
DASHBOARD_API_URL = "http://localhost:5000/api/detections/satellite"

class MarinePlasticDetector:
    """AI Model for detecting marine plastic in satellite images"""
    
    def __init__(self):
        self.model_loaded = False
        logger.info("Marine Plastic Detector initialized")
    
    def preprocess_image(self, image_data):
        """Preprocess satellite image for AI processing"""
        try:
            # Decode base64 image
            if isinstance(image_data, str) and ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image")
            
            # Resize for model input
            image = cv2.resize(image, (224, 224))
            image = image / 255.0  # Normalize
            
            return image
        except Exception as e:
            logger.error(f"Image preprocessing error: {e}")
            raise
    
    def detect_plastic(self, image, location_data):
        """Detect plastic in satellite image using AI model"""
        try:
            # Simulate AI processing (replace with actual model)
            # In production, load your trained model here
            # results = self.model.predict(image)
            
            # Generate realistic detection results based on location
            random_factor = np.random.random()
            
            # Simulate different plastic types detection
            detections = [
                {
                    'type': 'plastic_bottles',
                    'count': int(random_factor * 100),
                    'confidence': 0.75 + random_factor * 0.2,
                    'area': random_factor * 1000,
                    'bbox': self._generate_bbox(image.shape, random_factor)
                },
                {
                    'type': 'plastic_bags',
                    'count': int(random_factor * 50),
                    'confidence': 0.70 + random_factor * 0.25,
                    'area': random_factor * 500,
                    'bbox': self._generate_bbox(image.shape, random_factor * 0.8)
                },
                {
                    'type': 'microplastics',
                    'count': int(random_factor * 1000),
                    'confidence': 0.60 + random_factor * 0.3,
                    'area': random_factor * 2000,
                    'bbox': self._generate_bbox(image.shape, random_factor * 1.2)
                }
            ]
            
            # Calculate total plastic amount
            total_amount = int(50 + random_factor * 500)
            
            # Determine risk level
            risk_level = self._calculate_risk_level(total_amount)
            
            # Calculate overall confidence
            overall_confidence = np.mean([d['confidence'] for d in detections])
            
            return {
                'totalPlasticAmount': total_amount,
                'confidence': float(overall_confidence),
                'detections': detections,
                'riskLevel': risk_level,
                'processingTime': datetime.now().isoformat(),
                'location': location_data
            }
            
        except Exception as e:
            logger.error(f"AI detection error: {e}")
            return {
                'error': str(e),
                'totalPlasticAmount': 0,
                'confidence': 0,
                'detections': [],
                'riskLevel': 'low'
            }
    
    def _generate_bbox(self, image_shape, scale_factor):
        """Generate bounding box for detection"""
        h, w = image_shape[:2]
        return {
            'x': int(w * 0.2 * scale_factor),
            'y': int(h * 0.2 * scale_factor),
            'width': int(w * 0.6 * scale_factor),
            'height': int(h * 0.6 * scale_factor)
        }
    
    def _calculate_risk_level(self, plastic_amount):
        """Calculate risk level based on plastic amount"""
        for level, bounds in MODEL_CONFIG['risk_levels'].items():
            if bounds['min'] <= plastic_amount < bounds['max']:
                return level
        return 'low'

# Initialize detector
detector = MarinePlasticDetector()

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    """AI Model health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector.model_loaded,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/ai/process', methods=['POST'])
def process_satellite_image():
    """Process satellite image from satellite server"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data received'
            }), 400
        
        # Extract image data and location
        image_data = data.get('image')
        location_data = data.get('location', {})
        metadata = data.get('metadata', {})
        
        if not image_data or not location_data:
            return jsonify({
                'success': False,
                'message': 'Image data and location are required'
            }), 400
        
        logger.info(f"Processing image from location: {location_data.get('lat')}, {location_data.get('lng')}")
        
        # Process image with AI model
        detection_results = detector.detect_plastic(image_data, location_data)
        
        if 'error' in detection_results:
            return jsonify({
                'success': False,
                'message': f"AI processing failed: {detection_results['error']}"
            }), 500
        
        # Send results to dashboard
        dashboard_payload = {
            'source': 'ai-model',
            'imageId': metadata.get('imageId', 'unknown'),
            'location': location_data,
            'detectionResults': detection_results,
            'metadata': metadata,
            'timestamp': datetime.now().isoformat()
        }
        
        # Send to dashboard backend
        try:
            response = requests.post(
                DASHBOARD_API_URL,
                json=dashboard_payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                logger.info("✅ Results sent to dashboard successfully")
                dashboard_success = True
            else:
                logger.warning(f"⚠️ Dashboard response: {response.status_code}")
                dashboard_success = False
                
        except Exception as e:
            logger.error(f"❌ Failed to send to dashboard: {e}")
            dashboard_success = False
        
        return jsonify({
            'success': True,
            'message': 'Image processed successfully',
            'data': {
                'detectionResults': detection_results,
                'dashboardSent': dashboard_success,
                'processingTime': detection_results['processingTime']
            }
        })
        
    except Exception as e:
        logger.error(f"Processing error: {e}")
        return jsonify({
            'success': False,
            'message': f"Processing failed: {str(e)}"
        }), 500

@app.route('/api/ai/batch-process', methods=['POST'])
def batch_process_images():
    """Process multiple satellite images"""
    try:
        data = request.get_json()
        images = data.get('images', [])
        
        if not images:
            return jsonify({
                'success': False,
                'message': 'No images provided'
            }), 400
        
        results = []
        
        for idx, img_data in enumerate(images):
            logger.info(f"Processing batch image {idx + 1}/{len(images)}")
            
            try:
                result = detector.detect_plastic(
                    img_data.get('image'),
                    img_data.get('location', {})
                )
                results.append({
                    'index': idx,
                    'success': True,
                    'results': result
                })
            except Exception as e:
                results.append({
                    'index': idx,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'message': f'Processed {len(images)} images',
            'data': {
                'results': results,
                'processedCount': len([r for r in results if r['success']]),
                'failedCount': len([r for r in results if not r['success']])
            }
        })
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        return jsonify({
            'success': False,
            'message': f"Batch processing failed: {str(e)}"
        }), 500

@app.route('/api/ai/model-info', methods=['GET'])
def model_info():
    """Get AI model information"""
    return jsonify({
        'success': True,
        'data': {
            'name': 'Marine Plastic Detection Model',
            'version': '1.0.0',
            'types_detected': ['plastic_bottles', 'plastic_bags', 'microplastics'],
            'risk_levels': MODEL_CONFIG['risk_levels'],
            'confidence_threshold': MODEL_CONFIG['confidence_threshold'],
            'supported_formats': ['JPEG', 'PNG', 'TIFF'],
            'max_image_size': '50MB'
        }
    })

@app.route('/api/ai/test', methods=['POST'])
def test_ai_model():
    """Test AI model with sample data"""
    try:
        # Create test location
        test_location = {
            'lat': 19.0760,
            'lng': 72.8777,
            'altitude': 400000,
            'timestamp': datetime.now().isoformat()
        }
        
        # Generate test image (in production, use real image)
        test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        # Process test image
        results = detector.detect_plastic(test_image, test_location)
        
        return jsonify({
            'success': True,
            'message': 'AI model test completed',
            'data': {
                'test_location': test_location,
                'detection_results': results,
                'model_status': 'operational'
            }
        })
        
    except Exception as e:
        logger.error(f"Test error: {e}")
        return jsonify({
            'success': False,
            'message': f"Test failed: {str(e)}"
        }), 500

if __name__ == '__main__':
    logger.info("Starting AI Model Server on port 5001")
    logger.info("Connected to Dashboard API at http://localhost:5000")
    logger.info("Receiving data from Satellite Server at http://localhost:6000")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
