#!/usr/bin/env python
"""
Trigger matching for all existing active items
Run this script to find matches for items that were uploaded before server restart
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import LostItem, FoundItem, Match
from api.views import LostItemViewSet, FoundItemViewSet

def trigger_existing_matches():
    print("=== TRIGGERING MATCHES FOR EXISTING ITEMS ===\n")
    
    # Get all active items
    lost_items = LostItem.objects.filter(status='active')
    found_items = FoundItem.objects.filter(status='active')
    
    print(f"[ITEMS] Found {lost_items.count()} active lost items and {found_items.count()} active found items")
    
    lost_viewset = LostItemViewSet()
    found_viewset = FoundItemViewSet()
    
    matches_created = 0
    
    # Trigger matching for all lost items
    print(f"\n[PROCESSING] Processing {lost_items.count()} lost items...")
    for lost_item in lost_items:
        print(f"\n[LOST ITEM] Processing: '{lost_item.item_name}' (ID: {lost_item.id})")
        before_count = Match.objects.filter(lost_item=lost_item).count()
        lost_viewset.find_matches(lost_item)
        after_count = Match.objects.filter(lost_item=lost_item).count()
        new_matches = after_count - before_count
        if new_matches > 0:
            matches_created += new_matches
            print(f"   [SUCCESS] Created {new_matches} new matches")
        else:
            print(f"   [INFO] No new matches found")
    
    # Trigger matching for all found items
    print(f"\n[PROCESSING] Processing {found_items.count()} found items...")
    for found_item in found_items:
        print(f"\n[FOUND ITEM] Processing: '{found_item.item_name}' (ID: {found_item.id})")
        before_count = Match.objects.filter(found_item=found_item).count()
        # Use FeedbackViewSet which has find_matches method
        from api.views import FeedbackViewSet
        feedback_viewset = FeedbackViewSet()
        feedback_viewset.find_matches(found_item)
        after_count = Match.objects.filter(found_item=found_item).count()
        new_matches = after_count - before_count
        if new_matches > 0:
            matches_created += new_matches
            print(f"   [SUCCESS] Created {new_matches} new matches")
        else:
            print(f"   [INFO] No new matches found")
    
    print(f"\n[COMPLETE] Processing complete!")
    print(f"[TOTAL] Created {matches_created} new matches")
    print(f"[TOTAL] Total matches in database: {Match.objects.count()}")

if __name__ == '__main__':
    trigger_existing_matches()

