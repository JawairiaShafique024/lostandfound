"""
Enhanced ML Models for Lost & Found Matching System
Uses pre-trained models for superior accuracy
"""

import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from PIL import Image
import logging
from typing import Optional, Tuple, Dict, Any
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class EnhancedMatchingService:
    """
    Advanced matching service using pre-trained models
    Handles: Image similarity, Text similarity, Text-to-Image matching
    """
    
    def __init__(self):
        self.text_model = None
        self.image_model = None
        self.clip_model = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all pre-trained models"""
        try:
            # Text similarity model (Sentence-BERT)
            logger.info("Loading Sentence-BERT model...")
            self.text_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Image similarity model
            logger.info("Loading image similarity model...")
            self.image_model = SentenceTransformer('clip-ViT-B-32')
            
            # CLIP model for text-to-image matching
            logger.info("Loading CLIP model for text-to-image matching...")
            self.clip_model = SentenceTransformer('clip-ViT-B-32')
            
            logger.info("All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            # Fallback to None - will use basic matching
            self.text_model = None
            self.image_model = None
            self.clip_model = None
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts
        Returns: similarity score (0-1)
        """
        if not self.text_model or not text1 or not text2:
            # Fallback to basic string matching
            from difflib import SequenceMatcher
            return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
        
        try:
            # Get embeddings
            embeddings = self.text_model.encode([text1, text2])
            
            # Calculate cosine similarity
            similarity = torch.nn.functional.cosine_similarity(
                torch.tensor(embeddings[0]).unsqueeze(0),
                torch.tensor(embeddings[1]).unsqueeze(0)
            )
            
            return float(similarity.item())
            
        except Exception as e:
            logger.error(f"Error in text similarity calculation: {e}")
            # Fallback to basic matching
            from difflib import SequenceMatcher
            return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def calculate_image_similarity(self, image_path1: str, image_path2: str) -> float:
        """
        Calculate similarity between two images using CLIP
        Returns: similarity score (0-1)
        """
        if not self.image_model:
            # Fallback to ImageHash
            return self._fallback_image_similarity(image_path1, image_path2)
        
        try:
            # Load images
            img1 = Image.open(image_path1).convert('RGB')
            img2 = Image.open(image_path2).convert('RGB')
            
            # Get image embeddings
            embeddings = self.image_model.encode([img1, img2])
            
            # Calculate cosine similarity
            similarity = torch.nn.functional.cosine_similarity(
                torch.tensor(embeddings[0]).unsqueeze(0),
                torch.tensor(embeddings[1]).unsqueeze(0)
            )
            
            return float(similarity.item())
            
        except Exception as e:
            logger.error(f"Error in image similarity calculation: {e}")
            return self._fallback_image_similarity(image_path1, image_path2)
    
    def calculate_text_to_image_similarity(self, text: str, image_path: str) -> float:
        """
        ENHANCED Calculate similarity between text description and image using CLIP
        This is the MAGIC for when lost item has no picture!
        Includes advanced text preprocessing for better accuracy
        Returns: similarity score (0-1)
        """
        if not self.clip_model:
            logger.warning("CLIP model not available for text-to-image matching")
            return 0.0
        
        try:
            # Load image
            image = Image.open(image_path).convert('RGB')
            
            # ENHANCED TEXT PREPROCESSING for better CLIP matching
            enhanced_text = self._enhance_text_for_clip(text)
            
            # Get embeddings for both enhanced text and image
            text_embedding = self.clip_model.encode([enhanced_text])
            image_embedding = self.clip_model.encode([image])
            
            # Calculate cosine similarity
            similarity = torch.nn.functional.cosine_similarity(
                torch.tensor(text_embedding[0]).unsqueeze(0),
                torch.tensor(image_embedding[0]).unsqueeze(0)
            )
            
            # Apply confidence boost for high-quality matches
            base_score = float(similarity.item())
            
            # Boost score if text contains clear visual descriptors
            boosted_score = self._apply_visual_descriptor_boost(text, base_score)
            
            logger.info(f"Text-to-Image: '{enhanced_text}' -> {boosted_score:.4f} (base: {base_score:.4f})")
            
            return boosted_score
            
        except Exception as e:
            logger.error(f"Error in text-to-image similarity calculation: {e}")
            return 0.0
    
    def _enhance_text_for_clip(self, text: str) -> str:
        """
        Enhance text description for better CLIP model performance
        """
        if not text:
            return ""
        
        # Convert to lowercase for consistency
        enhanced = text.lower().strip()
        
        # Add common visual descriptors that CLIP understands well
        visual_keywords = {
            'phone': 'mobile phone smartphone device',
            'bag': 'handbag backpack purse luggage',
            'wallet': 'leather wallet purse money holder',
            'keys': 'key chain metal keys car keys',
            'watch': 'wristwatch timepiece clock',
            'laptop': 'computer notebook laptop device',
            'glasses': 'eyeglasses spectacles reading glasses',
            'book': 'notebook book diary journal',
            'bottle': 'water bottle drink container',
            'umbrella': 'rain umbrella weather protection'
        }
        
        # Enhance with visual synonyms
        for keyword, synonyms in visual_keywords.items():
            if keyword in enhanced:
                enhanced = f"{enhanced} {synonyms}"
        
        # Add "a photo of" prefix which CLIP is trained to recognize
        enhanced = f"a photo of {enhanced}"
        
        return enhanced
    
    def _apply_visual_descriptor_boost(self, text: str, base_score: float) -> float:
        """
        Apply confidence boost based on visual descriptors in text
        """
        if not text:
            return base_score
        
        text_lower = text.lower()
        boost_factor = 1.0
        
        # Colors boost
        colors = {'red', 'blue', 'green', 'black', 'white', 'yellow', 'brown', 'gray', 'pink', 'purple', 'orange'}
        if any(color in text_lower for color in colors):
            boost_factor += 0.1
        
        # Material descriptors boost
        materials = {'leather', 'metal', 'plastic', 'wooden', 'fabric', 'cotton', 'silk'}
        if any(material in text_lower for material in materials):
            boost_factor += 0.08
        
        # Size descriptors boost
        sizes = {'small', 'large', 'big', 'tiny', 'huge', 'medium'}
        if any(size in text_lower for size in sizes):
            boost_factor += 0.05
        
        # Shape descriptors boost
        shapes = {'round', 'square', 'rectangular', 'oval', 'circular'}
        if any(shape in text_lower for shape in shapes):
            boost_factor += 0.05
        
        # Apply boost but cap at reasonable maximum
        boosted_score = base_score * min(boost_factor, 1.3)  # Max 30% boost
        
        return min(boosted_score, 1.0)  # Cap at 1.0
    
    def _fallback_image_similarity(self, image_path1: str, image_path2: str) -> float:
        """Fallback to ImageHash if CLIP models fail"""
        try:
            import imagehash
            from PIL import Image
            
            img1 = Image.open(image_path1)
            img2 = Image.open(image_path2)
            
            hash1 = imagehash.phash(img1)
            hash2 = imagehash.phash(img2)
            
            # Convert hamming distance to similarity
            max_bits = len(hash1.hash) ** 2
            hamming_distance = (hash1 - hash2)
            similarity = max(0.0, 1.0 - (hamming_distance / max_bits))
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error in fallback image similarity: {e}")
            return 0.0
    
    def calculate_location_similarity(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate location proximity score
        Returns: similarity score (0-1) based on distance
        """
        try:
            import math
            
            # Haversine formula for distance calculation
            R = 6371  # Earth's radius in kilometers
            
            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lng = math.radians(lng2 - lng1)
            
            a = (math.sin(delta_lat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * 
                 math.sin(delta_lng / 2) ** 2)
            
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = R * c
            
            # Convert distance to similarity (closer = higher score)
            # Max reasonable distance: 50km
            max_distance = 50.0
            similarity = max(0.0, 1.0 - (distance / max_distance))
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error in location similarity calculation: {e}")
            return 0.0
    
    def calculate_date_similarity(self, date1, date2) -> float:
        """
        Calculate date proximity score
        Returns: similarity score (0-1) based on date difference
        """
        try:
            from datetime import datetime, timedelta
            
            # Convert to datetime if needed
            if isinstance(date1, str):
                date1 = datetime.strptime(date1, '%Y-%m-%d').date()
            if isinstance(date2, str):
                date2 = datetime.strptime(date2, '%Y-%m-%d').date()
            
            # Calculate difference in days
            diff_days = abs((date1 - date2).days)
            
            # Max reasonable difference: 30 days
            max_days = 30
            similarity = max(0.0, 1.0 - (diff_days / max_days))
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error in date similarity calculation: {e}")
            return 0.0
    
    def extract_colors_advanced(self, text: str) -> set:
        """
        Enhanced color extraction with more colors and variations
        """
        if not text:
            return set()
        
        colors = {
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'pink', 'purple', 
            'orange', 'brown', 'gray', 'grey', 'gold', 'silver', 'maroon', 'navy', 
            'beige', 'teal', 'cyan', 'magenta', 'violet', 'indigo', 'turquoise',
            'crimson', 'scarlet', 'emerald', 'lime', 'olive', 'coral', 'salmon',
            'khaki', 'tan', 'bronze', 'copper', 'platinum', 'cream', 'ivory'
        }
        
        words = {w.strip('.,!?:;()[]{}"\'-').lower() for w in text.split()}
        found_colors = {w for w in words if w in colors}
        
        return found_colors

# Global instance
ml_service = EnhancedMatchingService()

