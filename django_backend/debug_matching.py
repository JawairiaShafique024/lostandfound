#!/usr/bin/env python
"""
Debug matching issues step by step
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import LostItem, FoundItem, Match
from django.contrib.auth.models import User

def debug_matching():
    print("=== DEBUGGING MATCHING SYSTEM ===")
    
    # Check current data
    print(f"\n[DATABASE] Current Database State:")
    print(f"   Lost Items: {LostItem.objects.count()}")
    print(f"   Found Items: {FoundItem.objects.count()}")
    print(f"   Matches: {Match.objects.count()}")
    print(f"   Users: {User.objects.count()}")
    
    # Show all items
    print(f"\n[LOST ITEMS] Lost Items:")
    for item in LostItem.objects.all():
        print(f"   - {item.id}: {item.item_name} ({item.status}) by {item.posted_by.username}")
    
    print(f"\n[FOUND ITEMS] Found Items:")
    for item in FoundItem.objects.all():
        print(f"   - {item.id}: {item.item_name} ({item.status}) by {item.posted_by.username}")
    
    print(f"\n[MATCHES] Existing Matches:")
    for match in Match.objects.all():
        print(f"   - Match {match.id}: {match.lost_item.item_name} <-> {match.found_item.item_name} (Score: {match.confidence_score})")
    
    # Test matching manually
    print(f"\n[TEST] Manual Matching Test:")
    lost_items = LostItem.objects.filter(status='active')
    found_items = FoundItem.objects.filter(status='active')
    
    if lost_items.exists() and found_items.exists():
        from api.views import LostItemViewSet
        viewset = LostItemViewSet()
        
        lost_item = lost_items.first()
        print(f"\n[TESTING] Testing matches for: {lost_item.item_name}")
        
        for found_item in found_items:
            # Check if already matched
            existing = Match.objects.filter(lost_item=lost_item, found_item=found_item).exists()
            if existing:
                print(f"   [WARNING] Already matched with: {found_item.item_name}")
                continue
                
            # Calculate score
            score = viewset.calculate_match_score(lost_item, found_item)
            threshold = 0.6 if lost_item.image else 0.5
            
            print(f"   [SCORE] vs {found_item.item_name}: Score={score:.3f}, Threshold={threshold}")
            
            if score >= threshold:
                print(f"   [SUCCESS] WOULD CREATE MATCH!")
            else:
                print(f"   [FAIL] Below threshold")
    else:
        print("   [WARNING] No active lost/found items to test")
    
    # Test creating new items
    print(f"\n[CREATE] Creating Test Items:")
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Create similar items that should match
    lost_test = LostItem.objects.create(
        item_name='Black Phone',
        description='Black smartphone with cracked screen',
        location='University Library',
        latitude=33.6844,
        longitude=73.0479,
        posted_by=user,
        date_lost='2024-10-02',
        reporter_email='lost@test.com'
    )
    print(f"   [SUCCESS] Created lost item: {lost_test.item_name}")
    
    found_test = FoundItem.objects.create(
        item_name='Phone',
        description='Dark colored phone found near library',
        location='Library Area',
        latitude=33.6845,
        longitude=73.0480,
        posted_by=user,
        date_found='2024-10-02',
        reporter_email='found@test.com'
    )
    print(f"   [SUCCESS] Created found item: {found_test.item_name}")
    
    # This should trigger matching automatically via perform_create
    print(f"\n[CHECK] Checking if match was created automatically...")
    new_matches = Match.objects.filter(lost_item=lost_test, found_item=found_test)
    if new_matches.exists():
        match = new_matches.first()
        print(f"   [SUCCESS] AUTO-MATCH CREATED! Score: {match.confidence_score}")
    else:
        print(f"   [FAIL] NO AUTO-MATCH CREATED")
        
        # Try manual matching
        print(f"   [MANUAL] Trying manual match...")
        from api.views import LostItemViewSet
        viewset = LostItemViewSet()
        viewset.find_matches(lost_test)
        
        # Check again
        new_matches = Match.objects.filter(lost_item=lost_test, found_item=found_test)
        if new_matches.exists():
            match = new_matches.first()
            print(f"   [SUCCESS] MANUAL MATCH CREATED! Score: {match.confidence_score}")
        else:
            print(f"   [FAIL] MANUAL MATCH ALSO FAILED")
            score = viewset.calculate_match_score(lost_test, found_test)
            print(f"   [DEBUG] Debug score: {score}")

if __name__ == '__main__':
    debug_matching()

