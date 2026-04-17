"""
Plastic Detection Model
TensorFlow-based CNN for detecting marine plastic in satellite/aerial images
"""

import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing.image import img_to_array, load_img

class PlasticDetectionModel:
    """
    CNN-based model for detecting marine plastic pollution
    Uses transfer learning with ResNet50 backbone
    """
    
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.input_size = (224, 224)
        self.class_names = ['no_plastic', 'low', 'medium', 'high']
        
    def build_model(self):
        """Build the CNN model architecture"""
        # Use ResNet50 as base model
        base_model = ResNet50(
            weights='imagenet',
            include_top=False,
            input_shape=(*self.input_size, 3)
        )
        
        # Freeze base model layers
        base_model.trainable = False
        
        # Add custom layers
        inputs = keras.Input(shape=(*self.input_size, 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(0.3)(x)
        
        # Classification head (plastic density levels)
        density_output = layers.Dense(
            len(self.class_names),
            activation='softmax',
            name='density'
        )(x)
        
        # Confidence output
        confidence_output = layers.Dense(
            1,
            activation='sigmoid',
            name='confidence'
        )(x)
        
        self.model = Model(
            inputs=inputs,
            outputs=[density_output, confidence_output]
        )
        
        # Compile model
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss={
                'density': 'categorical_crossentropy',
                'confidence': 'binary_crossentropy'
            },
            metrics={
                'density': 'accuracy',
                'confidence': 'mae'
            }
        )
        
        return self.model
    
    def load_model(self, model_path):
        """Load a pre-trained model"""
        try:
            self.model = keras.models.load_model(model_path)
            self.is_loaded = True
            print(f"Model loaded from {model_path}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            self.is_loaded = False
            return False
    
    def save_model(self, model_path):
        """Save the current model"""
        if self.model:
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            self.model.save(model_path)
            print(f"Model saved to {model_path}")
            return True
        return False
    
    def preprocess_image(self, image):
        """Preprocess image for prediction"""
        # Convert PIL image to numpy array if needed
        if isinstance(image, Image.Image):
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize
            image = image.resize(self.input_size)
            img_array = img_to_array(image)
        else:
            img_array = image
        
        # Normalize
        img_array = img_array / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image):
        """
        Predict plastic in image
        
        Returns:
        {
            'plastic_detected': bool,
            'density': str,
            'confidence': float,
            'estimated_area': float,
            'estimated_weight': float,
            'plastic_types': list
        }
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded")
        
        # Preprocess
        processed_img = self.preprocess_image(image)
        
        # Predict
        density_pred, confidence_pred = self.model.predict(processed_img, verbose=0)
        
        # Decode predictions
        density_class = np.argmax(density_pred[0])
        density_label = self.class_names[density_class]
        confidence = float(confidence_pred[0][0])
        
        # Calculate density probability
        density_probs = density_pred[0]
        
        # Estimate area and weight based on density class
        if density_label == 'no_plastic':
            plastic_detected = False
            estimated_area = 0
            estimated_weight = 0
        else:
            plastic_detected = True
            
            # Base estimates (in square meters and kg)
            base_estimates = {
                'low': (100, 25),
                'medium': (300, 75),
                'high': (600, 200)
            }
            
            base_area, base_weight = base_estimates.get(density_label, (0, 0))
            
            # Adjust by confidence
            estimated_area = base_area * confidence
            estimated_weight = base_weight * confidence
        
        return {
            'plastic_detected': plastic_detected,
            'density': density_label if plastic_detected else 'none',
            'confidence': round(confidence, 2),
            'estimated_area': round(estimated_area, 2),
            'estimated_weight': round(estimated_weight, 2),
            'plastic_types': self._estimate_plastic_types(image),
            'density_probabilities': {
                cls: round(float(prob), 3)
                for cls, prob in zip(self.class_names, density_probs)
            },
            'model_version': '1.0.0',
            'processing_time': 0.0  # Would be measured in production
        }
    
    def _estimate_plastic_types(self, image):
        """
        Estimate likely plastic types based on image characteristics
        This is a simplified version - in production, this could use
        additional specialized models
        """
        # Common marine plastic types
        common_types = ['PET', 'HDPE', 'PP', 'LDPE']
        
        # Return most common types
        return common_types[:2]  # Simplified
    
    def train(self, dataset_path, epochs=10, batch_size=32):
        """
        Train the model with a dataset
        
        Dataset structure should be:
        dataset_path/
            no_plastic/
                image1.jpg, image2.jpg, ...
            low/
                image1.jpg, image2.jpg, ...
            medium/
                image1.jpg, image2.jpg, ...
            high/
                image1.jpg, image2.jpg, ...
        """
        if self.model is None:
            self.build_model()
        
        # Load training data
        train_dataset = tf.keras.preprocessing.image_dataset_from_directory(
            dataset_path,
            labels='inferred',
            label_mode='categorical',
            batch_size=batch_size,
            image_size=self.input_size,
            shuffle=True,
            seed=42,
            validation_split=0.2,
            subset='training'
        )
        
        val_dataset = tf.keras.preprocessing.image_dataset_from_directory(
            dataset_path,
            labels='inferred',
            label_mode='categorical',
            batch_size=batch_size,
            image_size=self.input_size,
            shuffle=True,
            seed=42,
            validation_split=0.2,
            subset='validation'
        )
        
        # Normalize
        normalization_layer = layers.Rescaling(1./255)
        train_dataset = train_dataset.map(lambda x, y: (normalization_layer(x), y))
        val_dataset = val_dataset.map(lambda x, y: (normalization_layer(x), y))
        
        # Cache and prefetch
        AUTOTUNE = tf.data.AUTOTUNE
        train_dataset = train_dataset.cache().prefetch(buffer_size=AUTOTUNE)
        val_dataset = val_dataset.cache().prefetch(buffer_size=AUTOTUNE)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=3,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=2
            )
        ]
        
        # Train
        history = self.model.fit(
            train_dataset,
            validation_data=val_dataset,
            epochs=epochs,
            callbacks=callbacks
        )
        
        self.is_loaded = True
        
        return {
            'final_loss': float(history.history['loss'][-1]),
            'final_accuracy': float(history.history['density_accuracy'][-1]),
            'val_loss': float(history.history['val_loss'][-1]),
            'val_accuracy': float(history.history['val_density_accuracy'][-1]),
            'epochs_trained': len(history.history['loss'])
        }


# Utility function for creating synthetic training data
def generate_synthetic_dataset(output_path, samples_per_class=100):
    """
    Generate synthetic training images for testing
    This creates simple patterns that simulate water and plastic
    """
    import random
    from PIL import ImageDraw
    
    os.makedirs(output_path, exist_ok=True)
    
    for class_name in ['no_plastic', 'low', 'medium', 'high']:
        class_path = os.path.join(output_path, class_name)
        os.makedirs(class_path, exist_ok=True)
        
        for i in range(samples_per_class):
            # Create base water image
            img = Image.new('RGB', (224, 224), color=(20, 50, 100))
            draw = ImageDraw.Draw(img)
            
            # Add "plastic" based on class
            if class_name != 'no_plastic':
                # Number of plastic patches
                if class_name == 'low':
                    num_patches = random.randint(1, 3)
                    color_variation = (150, 150, 150)
                elif class_name == 'medium':
                    num_patches = random.randint(4, 8)
                    color_variation = (180, 180, 160)
                else:  # high
                    num_patches = random.randint(9, 15)
                    color_variation = (200, 200, 180)
                
                for _ in range(num_patches):
                    x = random.randint(0, 200)
                    y = random.randint(0, 200)
                    size = random.randint(10, 40)
                    
                    # Draw irregular shape
                    draw.ellipse(
                        [x, y, x + size, y + size],
                        fill=color_variation
                    )
            
            # Save
            img.save(os.path.join(class_path, f'{class_name}_{i:04d}.jpg'))
    
    print(f"Generated synthetic dataset at {output_path}")


if __name__ == '__main__':
    # Test the model
    print("Testing Plastic Detection Model...")
    
    # Create and build model
    model = PlasticDetectionModel()
    model.build_model()
    print("Model built successfully")
    
    # Generate synthetic dataset for testing
    # generate_synthetic_dataset('./datasets/synthetic', samples_per_class=50)
    
    # Test prediction with dummy image
    dummy_img = Image.new('RGB', (224, 224), color=(50, 100, 150))
    result = model.predict(dummy_img)
    print("Prediction result:", result)
