#!/usr/bin/env python3
"""
Installation script for pre-trained models
Run this script to download and cache the models
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

def install_models():
    """Download and cache all pre-trained models"""
    print("Installing pre-trained models for Lost & Found system...")
    
    try:
        from sentence_transformers import SentenceTransformer
        
        print("Downloading Sentence-BERT model (text similarity)...")
        text_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Sentence-BERT model downloaded successfully!")
        
        print("Downloading CLIP model (image similarity + text-to-image)...")
        clip_model = SentenceTransformer('clip-ViT-B-32')
        print("CLIP model downloaded successfully!")
        
        print("Testing models...")
        
        # Test text similarity
        test_texts = ["red bag", "red backpack"]
        embeddings = text_model.encode(test_texts)
        print(f"Text model test passed! Embedding shape: {embeddings.shape}")
        
        # Test CLIP
        test_text = "blue phone"
        text_embedding = clip_model.encode([test_text])
        print(f"CLIP model test passed! Text embedding shape: {text_embedding.shape}")
        
        print("\nAll models installed and tested successfully!")
        print("Your Lost & Found system is now powered by AI!")
        
        return True
        
    except Exception as e:
        print(f"Error installing models: {e}")
        print("Make sure you have installed the requirements:")
        print("   pip install -r requirements.txt")
        return False

if __name__ == "__main__":
    success = install_models()
    if success:
        print("\nReady to run: python manage.py runserver")
    else:
        print("\nInstallation failed. Please check the error messages above.")
        sys.exit(1)

