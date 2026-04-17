"""
AI Model Service for Marine Plastic Detection
Flask API server that provides plastic detection predictions
"""

import os
import io
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import requests
from urllib.parse import urlparse

from model import PlasticDetectionModel

app = Flask(__name__)
CORS(app)

# Initialize model
model = PlasticDetectionModel()
MODEL_PATH = os.getenv('MODEL_PATH', './models/plastic_detector.h5')

# Try to load trained model, otherwise use mock
if os.path.exists(MODEL_PATH):
    try:
        model.load_model(MODEL_PATH)
        print(f"Loaded model from {MODEL_PATH}")
    except Exception as e:
        print(f"Could not load model: {e}")
        print("Using mock predictions")
else:
    print("Model file not found. Using mock predictions")
    os.makedirs('./models', exist_ok=True)


def download_image(url):
    """Download image from URL"""
    try:
        # Check if it's a base64 encoded image
        if url.startswith('data:image'):
            # Extract base64 data
            base64_data = url.split(',')[1]
            image_data = base64.b64decode(base64_data)
            return Image.open(io.BytesIO(image_data))
        
        # Download from URL
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None


def generate_mock_prediction():
    """Generate mock prediction for testing"""
    import random
    
    densities = ['low', 'medium', 'high']
    density = random.choice(densities)
    confidence = random.uniform(0.6, 0.95)
    
    # Base estimates
    area_estimates = {'low': 100, 'medium': 300, 'high': 600}
    weight_estimates = {'low': 20, 'medium': 80, 'high': 200}
    
    plastic_detected = random.random() > 0.3  # 70% chance
    
    return {
        'plastic_detected': plastic_detected,
        'density': density if plastic_detected else 'none',
        'confidence': round(confidence, 2),
        'estimated_area': round(area_estimates[density] * random.uniform(0.8, 1.2), 2),
        'estimated_weight': round(weight_estimates[density] * random.uniform(0.8, 1.2), 2),
        'plastic_types': ['PET', 'HDPE'] if plastic_detected else [],
        'model_version': 'mock-v1.0',
        'processing_time': round(random.uniform(0.5, 2.0), 2)
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.is_loaded,
        'model_version': '1.0.0'
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict plastic in image
    
    Request Body:
    {
        "imageUrl": "https://example.com/image.jpg" or "data:image/jpeg;base64,...",
        "coordinates": {"longitude": -122.4194, "latitude": 37.7749} (optional)
    }
    
    Response:
    {
        "plastic_detected": true,
        "density": "high",
        "confidence": 0.87,
        "estimated_area": 450.5,
        "estimated_weight": 150.2,
        "plastic_types": ["PET", "HDPE"],
        "model_version": "1.0.0",
        "processing_time": 1.23
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'imageUrl' not in data:
            return jsonify({'error': 'imageUrl is required'}), 400
        
        image_url = data['imageUrl']
        coordinates = data.get('coordinates', {})
        
        # Download image
        image = download_image(image_url)
        if image is None:
            # Return mock prediction if image download fails
            result = generate_mock_prediction()
            result['image_error'] = 'Could not download image, using mock data'
            return jsonify(result)
        
        # Get prediction from model
        if model.is_loaded:
            prediction = model.predict(image)
        else:
            prediction = generate_mock_prediction()
        
        # Add metadata
        prediction['coordinates'] = coordinates
        
        return jsonify(prediction)
        
    except Exception as e:
        print(f"Prediction error: {e}")
        # Return mock prediction on error
        result = generate_mock_prediction()
        result['error'] = str(e)
        return jsonify(result), 500


@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple images
    
    Request Body:
    {
        "images": [
            {"imageUrl": "...", "coordinates": {...}},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({'error': 'images array is required'}), 400
        
        images = data['images']
        results = []
        
        for img_data in images:
            image_url = img_data.get('imageUrl')
            coordinates = img_data.get('coordinates', {})
            
            # Download and predict
            image = download_image(image_url)
            
            if model.is_loaded and image is not None:
                prediction = model.predict(image)
            else:
                prediction = generate_mock_prediction()
            
            prediction['coordinates'] = coordinates
            results.append(prediction)
        
        return jsonify({
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        print(f"Batch prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def train():
    """
    Train the model with new data (admin only)
    
    Request Body:
    {
        "dataset_path": "path/to/dataset",
        "epochs": 10,
        "batch_size": 32
    }
    """
    try:
        data = request.get_json()
        
        dataset_path = data.get('dataset_path', './datasets/training')
        epochs = data.get('epochs', 10)
        batch_size = data.get('batch_size', 32)
        
        # Start training (this would run asynchronously in production)
        result = model.train(dataset_path, epochs, batch_size)
        
        return jsonify({
            'success': True,
            'message': 'Training completed',
            'metrics': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'version': '1.0.0',
        'loaded': model.is_loaded,
        'type': 'CNN-ResNet50',
        'classes': ['no_plastic', 'low', 'medium', 'high'],
        'input_shape': [224, 224, 3],
        'description': 'Convolutional neural network for marine plastic detection'
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    
    # Use waitress in production, Flask dev server in development
    if os.getenv('ENVIRONMENT') == 'production':
        from waitress import serve
        print(f"Starting AI Model Service on port {port} (production)")
        serve(app, host='0.0.0.0', port=port)
    else:
        print(f"Starting AI Model Service on port {port} (development)")
        app.run(host='0.0.0.0', port=port, debug=True)
