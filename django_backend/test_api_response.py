#!/usr/bin/env python
"""
Test API response format for profile debugging
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.serializers import LostItemSerializer, FoundItemSerializer
from api.models import LostItem, FoundItem
from django.contrib.auth.models import User

def test_api_response():
    print("=== API RESPONSE TEST ===")
    
    # Get a specific user
    user = User.objects.get(username='lostandfoundhub235@gmail.com')
    print(f"Testing for user: {user.username} (ID: {user.id})")
    
    # Get their items
    lost_items = LostItem.objects.filter(posted_by=user)
    found_items = FoundItem.objects.filter(posted_by=user)
    
    print(f"\nUser's Lost Items: {lost_items.count()}")
    for item in lost_items:
        serializer = LostItemSerializer(item)
        data = serializer.data
        print(f"Lost Item: {data['item_name']}")
        print(f"  posted_by: {data['posted_by']}")
        print(f"  posted_by.id: {data['posted_by']['id']}")
        print("---")
    
    print(f"\nUser's Found Items: {found_items.count()}")
    for item in found_items:
        serializer = FoundItemSerializer(item)
        data = serializer.data
        print(f"Found Item: {data['item_name']}")
        print(f"  posted_by: {data['posted_by']}")
        print(f"  posted_by.id: {data['posted_by']['id']}")
        print("---")
    
    # Test all items API response
    print(f"\n=== ALL ITEMS API RESPONSE ===")
    all_lost = LostItem.objects.all()[:3]
    print("Sample Lost Items API Response:")
    for item in all_lost:
        serializer = LostItemSerializer(item)
        data = serializer.data
        print(f"  {data['item_name']} by user ID {data['posted_by']['id']} ({data['posted_by']['username']})")
    
    all_found = FoundItem.objects.all()[:3]
    print("Sample Found Items API Response:")
    for item in all_found:
        serializer = FoundItemSerializer(item)
        data = serializer.data
        print(f"  {data['item_name']} by user ID {data['posted_by']['id']} ({data['posted_by']['username']})")

if __name__ == '__main__':
    test_api_response()
