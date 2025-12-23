#!/usr/bin/env python
"""
Test improved matching algorithm with category filtering
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import LostItem, FoundItem
from api.item_categories import classify_item, are_items_compatible
from api.views import LostItemViewSet

def test_improved_matching():
    print("=== TESTING IMPROVED MATCHING ALGORITHM ===")
    
    # Test category classification
    print("\n1. CATEGORY CLASSIFICATION TEST")
    test_items = [
        "Black Phone",
        "infinix mobile hot9", 
        "bag",
        "watch",
        "Samsung Galaxy",
        "iPhone 13",
        "Nike backpack"
    ]
    
    for item in test_items:
        category = classify_item(item)
        print(f"   '{item}' -> {category}")
    
    # Test compatibility
    print("\n2. COMPATIBILITY TEST")
    test_pairs = [
        ("Black Phone", "infinix mobile hot9"),
        ("Black Phone", "bag"),
        ("bag", "Nike backpack"),
        ("watch", "Samsung watch"),
        ("iPhone", "Samsung phone")
    ]
    
    for lost, found in test_pairs:
        # Create mock items
        class MockItem:
            def __init__(self, name):
                self.item_name = name
                self.description = ""
        
        lost_item = MockItem(lost)
        found_item = MockItem(found)
        
        is_compatible, score, lost_cat, found_cat = are_items_compatible(lost_item, found_item)
        print(f"   '{lost}' ({lost_cat}) <-> '{found}' ({found_cat})")
        print(f"     Compatible: {is_compatible}, Score: {score}")
    
    # Test with real database items
    print("\n3. REAL DATABASE TEST")
    lost_items = LostItem.objects.all()
    found_items = FoundItem.objects.all()
    
    print(f"Testing {lost_items.count()} lost items vs {found_items.count()} found items")
    
    viewset = LostItemViewSet()
    
    for lost_item in lost_items[:3]:  # Test first 3 lost items
        print(f"\n--- Testing Lost Item: {lost_item.item_name} ---")
        
        for found_item in found_items[:3]:  # Against first 3 found items
            score = viewset.calculate_match_score(lost_item, found_item)
            print(f"  vs '{found_item.item_name}': Score = {score:.3f}")
            
            # Check if it would match with new thresholds
            threshold = 0.75 if lost_item.image else 0.65
            would_match = score >= threshold
            print(f"    Threshold: {threshold}, Would Match: {would_match}")
    
    print("\n=== IMPROVED MATCHING TEST COMPLETE ===")

if __name__ == '__main__':
    test_improved_matching()
