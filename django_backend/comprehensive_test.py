#!/usr/bin/env python
"""
Comprehensive test of the Lost & Found Hub system
"""
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import LostItem, FoundItem, Match
from api.serializers import LostItemSerializer, FoundItemSerializer
from rest_framework.authtoken.models import Token

def test_system():
    print("=== COMPREHENSIVE SYSTEM TEST ===")
    
    # 1. Database Test
    print("\n1. DATABASE TEST")
    users = User.objects.all()
    lost_items = LostItem.objects.all()
    found_items = FoundItem.objects.all()
    matches = Match.objects.all()
    
    print(f"   Users: {users.count()}")
    print(f"   Lost Items: {lost_items.count()}")
    print(f"   Found Items: {found_items.count()}")
    print(f"   Matches: {matches.count()}")
    
    # 2. Test specific user
    print("\n2. USER TEST - lostandfoundhub235@gmail.com")
    try:
        user = User.objects.get(username='lostandfoundhub235@gmail.com')
        print(f"   User ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        
        # Get user's items
        user_lost = LostItem.objects.filter(posted_by=user)
        user_found = FoundItem.objects.filter(posted_by=user)
        print(f"   Lost Items: {user_lost.count()}")
        print(f"   Found Items: {user_found.count()}")
        
        # Show items
        for item in user_lost:
            print(f"     Lost: {item.item_name}")
        for item in user_found:
            print(f"     Found: {item.item_name}")
            
    except User.DoesNotExist:
        print("   User not found!")
    
    # 3. API Serializer Test
    print("\n3. API SERIALIZER TEST")
    if lost_items.exists():
        item = lost_items.first()
        serializer = LostItemSerializer(item)
        data = serializer.data
        print(f"   Sample Lost Item: {data['item_name']}")
        print(f"   Posted by: {data['posted_by']['username']} (ID: {data['posted_by']['id']})")
    
    if found_items.exists():
        item = found_items.first()
        serializer = FoundItemSerializer(item)
        data = serializer.data
        print(f"   Sample Found Item: {data['item_name']}")
        print(f"   Posted by: {data['posted_by']['username']} (ID: {data['posted_by']['id']})")
    
    # 4. Authentication Test
    print("\n4. AUTHENTICATION TEST")
    try:
        user = User.objects.get(username='lostandfoundhub235@gmail.com')
        token, created = Token.objects.get_or_create(user=user)
        print(f"   Token exists: {not created}")
        print(f"   Token: {token.key[:10]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 5. Match Test
    print("\n5. MATCH TEST")
    user_matches = Match.objects.filter(
        models.Q(lost_item__posted_by=user) | 
        models.Q(found_item__posted_by=user)
    )
    print(f"   User matches: {user_matches.count()}")
    for match in user_matches:
        print(f"     {match.lost_item.item_name} <-> {match.found_item.item_name} ({int(match.confidence_score*100)}%)")
    
    # 6. Email Test
    print("\n6. EMAIL CONFIGURATION TEST")
    from django.conf import settings
    print(f"   Email Backend: {settings.EMAIL_BACKEND}")
    print(f"   Email Host: {settings.EMAIL_HOST}")
    print(f"   Email User: {settings.EMAIL_HOST_USER}")
    print(f"   Password Set: {'yes' if 'your-new-gmail-app-password-here' not in settings.EMAIL_HOST_PASSWORD else 'no'}")
    
    print("\n=== TEST COMPLETE ===")
    print("System Status:")
    print(f"✓ Database: {users.count()} users, {lost_items.count()} lost, {found_items.count()} found")
    print(f"✓ Matches: {matches.count()} total matches")
    print(f"✓ Email: {'Configured' if 'your-new-gmail-app-password-here' not in settings.EMAIL_HOST_PASSWORD else 'Not configured'}")
    
    # Recommendations
    print("\nRecommendations:")
    if user_lost.count() > 0 or user_found.count() > 0:
        print("✓ User has items - Profile should show them")
    if user_matches.count() > 0:
        print("✓ User has matches - Chat should be available")
    
    return {
        'users': users.count(),
        'lost_items': lost_items.count(),
        'found_items': found_items.count(),
        'matches': matches.count(),
        'user_items': user_lost.count() + user_found.count(),
        'user_matches': user_matches.count()
    }

if __name__ == '__main__':
    from django.db import models
    test_system()
