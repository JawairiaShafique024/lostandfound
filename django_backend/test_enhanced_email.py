#!/usr/bin/env python
"""
Test enhanced email functionality with HTML templates
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.utils.email_utils import test_email_configuration, send_match_notifications
from api.models import Match, LostItem, FoundItem
from django.contrib.auth.models import User

def test_enhanced_email():
    print("=== TESTING ENHANCED EMAIL FUNCTIONALITY ===")
    
    # First test basic email configuration
    print("\n1. Testing basic email configuration...")
    config_test = test_email_configuration()
    
    if not config_test:
        print("[ERROR] Basic email configuration failed. Please check your Gmail settings.")
        return
    
    print("\n2. Testing HTML email templates...")
    
    # Try to find existing matches to test with
    matches = Match.objects.all()
    
    if matches.exists():
        print(f"[EMAIL] Found {matches.count()} existing matches. Testing with first match...")
        match = matches.first()
        
        print(f"[MATCH] Testing match: {match.lost_item.item_name} <-> {match.found_item.item_name}")
        print(f"[SCORE] Confidence: {int(match.confidence_score * 100)}%")
        
        # Test sending notifications
        success = send_match_notifications(match)
        
        if success:
            print("[SUCCESS] Enhanced email notifications sent successfully!")
            print("[EMAIL] Check the following email addresses:")
            
            lost_email = match.lost_item.reporter_email or match.lost_item.posted_by.email
            found_email = match.found_item.reporter_email or match.found_item.posted_by.email
            
            if lost_email:
                print(f"   - Lost item owner: {lost_email}")
            if found_email:
                print(f"   - Found item finder: {found_email}")
                
        else:
            print("[ERROR] Enhanced email notifications failed")
            
    else:
        print("[WARNING] No matches found in database. Creating a test scenario...")
        
        # Create test users if they don't exist
        try:
            owner_user, _ = User.objects.get_or_create(
                username='testowner',
                defaults={'email': 'aribaiqbal22@gmail.com'}
            )
            finder_user, _ = User.objects.get_or_create(
                username='testfinder', 
                defaults={'email': 'lostandfoundhub235@gmail.com'}
            )
            
            # Create test items if they don't exist
            lost_item, _ = LostItem.objects.get_or_create(
                item_name='Test Mobile Phone',
                defaults={
                    'description': 'Black smartphone with cracked screen',
                    'location': 'University Campus',
                    'latitude': 33.6844,
                    'longitude': 73.0479,
                    'posted_by': owner_user,
                    'reporter_name': 'Test Owner',
                    'reporter_email': 'aribaiqbal22@gmail.com',
                    'contact': '+92-300-1234567'
                }
            )
            
            found_item, _ = FoundItem.objects.get_or_create(
                item_name='Mobile Phone',
                defaults={
                    'description': 'Black phone found near library',
                    'location': 'University Library',
                    'latitude': 33.6845,
                    'longitude': 73.0480,
                    'posted_by': finder_user,
                    'reporter_name': 'Test Finder',
                    'reporter_email': 'lostandfoundhub235@gmail.com',
                    'contact': '+92-300-7654321'
                }
            )
            
            # Create test match
            match, created = Match.objects.get_or_create(
                lost_item=lost_item,
                found_item=found_item,
                defaults={
                    'match_type': 'exact',
                    'confidence_score': 0.85
                }
            )
            
            if created:
                print("[SUCCESS] Created test match for email testing")
            else:
                print("[EMAIL] Using existing test match")
                
            print(f"[MATCH] Testing match: {match.lost_item.item_name} <-> {match.found_item.item_name}")
            
            # Test sending notifications
            success = send_match_notifications(match)
            
            if success:
                print("[SUCCESS] Enhanced email notifications sent successfully!")
                print("[EMAIL] Check the following email addresses:")
                print(f"   - Lost item owner: aribaiqbal22@gmail.com")
                print(f"   - Found item finder: lostandfoundhub235@gmail.com")
            else:
                print("[ERROR] Enhanced email notifications failed")
                
        except Exception as e:
            print(f"[ERROR] Error creating test scenario: {e}")
    
    print("\n=== EMAIL TEST COMPLETE ===")
    print("[EMAIL] If emails were sent successfully, you should see beautiful HTML emails in the inboxes!")
    print("[FEATURES] The emails include:")
    print("   - Professional HTML design with gradients and styling")
    print("   - Match confidence scores")
    print("   - Safety tips for meetups")
    print("   - Call-to-action buttons")
    print("   - Responsive design for mobile devices")

if __name__ == '__main__':
    test_enhanced_email()
