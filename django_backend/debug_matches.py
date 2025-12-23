#!/usr/bin/env python
"""
Debug matches and user relationships
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import Match, LostItem, FoundItem
from django.contrib.auth.models import User

def debug_matches():
    print("=== MATCHES DEBUG ===")
    
    # Check all users
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for user in users:
        print(f"User: {user.username} (ID: {user.id}, Email: {user.email})")
    
    print("\n=== MATCHES ===")
    matches = Match.objects.all()
    print(f"Total matches: {matches.count()}")
    
    for match in matches:
        print(f"\nMatch ID: {match.id}")
        print(f"  Lost Item: {match.lost_item.item_name}")
        print(f"    Posted by: {match.lost_item.posted_by.username} (ID: {match.lost_item.posted_by.id})")
        print(f"    Email: {match.lost_item.posted_by.email}")
        print(f"  Found Item: {match.found_item.item_name}")
        print(f"    Posted by: {match.found_item.posted_by.username} (ID: {match.found_item.posted_by.id})")
        print(f"    Email: {match.found_item.posted_by.email}")
        print(f"  Status: {match.status}")
        print(f"  Confidence: {int(match.confidence_score * 100)}%")
        print("---")
    
    print("\n=== LOST ITEMS ===")
    lost_items = LostItem.objects.all()
    for item in lost_items:
        print(f"Lost: {item.item_name} by {item.posted_by.username}")
    
    print("\n=== FOUND ITEMS ===")
    found_items = FoundItem.objects.all()
    for item in found_items:
        print(f"Found: {item.item_name} by {item.posted_by.username}")

if __name__ == '__main__':
    debug_matches()
