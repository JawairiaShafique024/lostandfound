#!/usr/bin/env python
"""
Test matching with existing items
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import LostItem, FoundItem, Match
from api.views import LostItemViewSet, FoundItemViewSet

def test_existing_matches():
    print("=== TESTING EXISTING ITEMS MATCHING ===")
    
    # Get all active items
    lost_items = LostItem.objects.filter(status='active')
    found_items = FoundItem.objects.filter(status='active')
    
    print(f"\n[ITEMS] Found {lost_items.count()} lost items and {found_items.count()} found items")
    
    # Test each lost item against each found item
    for lost_item in lost_items:
        print(f"\n[TESTING] Lost Item: '{lost_item.item_name}' by {lost_item.posted_by.username}")
        
        for found_item in found_items:
            # Check if already matched
            existing_match = Match.objects.filter(lost_item=lost_item, found_item=found_item).exists()
            if existing_match:
                print(f"   [EXISTING] Already matched with: '{found_item.item_name}'")
                continue
            
            # Calculate score
            viewset = LostItemViewSet()
            score = viewset.calculate_match_score(lost_item, found_item)
            
            # Determine threshold
            if lost_item.image and found_item.image:
                threshold = 0.70
            elif not lost_item.image and found_item.image:
                threshold = 0.50
            else:
                threshold = 0.45
            
            print(f"   [SCORE] vs '{found_item.item_name}': {score:.3f} (threshold: {threshold})")
            
            if score >= threshold:
                print(f"   [SUCCESS] WOULD CREATE MATCH!")
                
                # Create the match
                match_type = viewset.determine_match_type(lost_item, found_item, score)
                match = Match.objects.create(
                    lost_item=lost_item,
                    found_item=found_item,
                    match_type=match_type,
                    confidence_score=score
                )
                print(f"   [CREATED] Match ID: {match.id}")
            else:
                print(f"   [FAIL] Below threshold")

if __name__ == '__main__':
    test_existing_matches()
