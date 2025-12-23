#!/usr/bin/env python
"""
Quick test script to check matching functionality
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import LostItem, FoundItem, Match
from django.contrib.auth.models import User

def test_matching():
    print("=== TESTING MATCHING FUNCTIONALITY ===")
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass')
        user.save()
        print("✓ Test user created")
    
    # Create test lost item
    lost_item = LostItem.objects.create(
        item_name='Black Wallet',
        description='Black leather wallet with cards',
        location='University Campus',
        latitude=33.6844,
        longitude=73.0479,
        posted_by=user,
        date_lost='2024-10-01',
        reporter_email='lost@test.com'
    )
    print(f"✓ Lost item created: {lost_item.item_name}")
    
    # Create test found item
    found_item = FoundItem.objects.create(
        item_name='Wallet',
        description='Dark colored wallet found near library',
        location='Library Area',
        latitude=33.6845,
        longitude=73.0480,
        posted_by=user,
        date_found='2024-10-01',
        reporter_email='found@test.com'
    )
    print(f"✓ Found item created: {found_item.item_name}")
    
    # Trigger matching manually
    from api.views import LostItemViewSet
    viewset = LostItemViewSet()
    viewset.find_matches(lost_item)
    
    # Check matches
    matches = Match.objects.filter(lost_item=lost_item, found_item=found_item)
    if matches.exists():
        match = matches.first()
        print(f"✅ MATCH CREATED! Score: {match.confidence_score}")
        print(f"   Match Type: {match.match_type}")
        print(f"   Status: {match.status}")
        
        # Test email notification
        print("\n=== TESTING EMAIL NOTIFICATION ===")
        match.send_match_notifications()
        print("✓ Email notifications sent (check console output)")
        
    else:
        print("❌ NO MATCH CREATED")
        
        # Debug: Calculate score manually
        score = viewset.calculate_match_score(lost_item, found_item)
        print(f"   Calculated score: {score}")
        print(f"   Threshold needed: 0.3")
    
    print("\n=== CURRENT DATABASE STATE ===")
    print(f"Lost Items: {LostItem.objects.count()}")
    print(f"Found Items: {FoundItem.objects.count()}")
    print(f"Total Matches: {Match.objects.count()}")

if __name__ == '__main__':
    test_matching()
