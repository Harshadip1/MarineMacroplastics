"""
Training script for the plastic detection model
Usage: python train.py --dataset ./datasets/training --epochs 20
"""

import argparse
import os
from model import PlasticDetectionModel

def main():
    parser = argparse.ArgumentParser(description='Train marine plastic detection model')
    parser.add_argument('--dataset', type=str, required=True,
                        help='Path to training dataset')
    parser.add_argument('--epochs', type=int, default=10,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Batch size')
    parser.add_argument('--output', type=str, default='./models/plastic_detector.h5',
                        help='Output path for trained model')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Marine Plastic Detection - Model Training")
    print("=" * 60)
    print(f"Dataset: {args.dataset}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Output: {args.output}")
    print("=" * 60)
    
    # Initialize model
    model = PlasticDetectionModel()
    model.build_model()
    
    # Print model summary
    model.model.summary()
    
    # Train
    print("\nStarting training...")
    results = model.train(
        dataset_path=args.dataset,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
    
    print("\nTraining completed!")
    print(f"Final accuracy: {results['final_accuracy']:.4f}")
    print(f"Validation accuracy: {results['val_accuracy']:.4f}")
    
    # Save model
    print(f"\nSaving model to {args.output}...")
    model.save_model(args.output)
    
    print("\nDone!")

if __name__ == '__main__':
    main()
