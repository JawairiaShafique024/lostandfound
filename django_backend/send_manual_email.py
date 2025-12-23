#!/usr/bin/env python
"""
Manually send email for specific match
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from api.models import Match
from api.utils.email_utils import send_match_notifications

def send_manual_emails():
    print("=== SENDING MANUAL EMAILS FOR MATCHES ===")
    
    # Get the infinix hot 10 match
    match = Match.objects.get(id=32)
    print(f"\n[MATCH] Found match: {match.lost_item.item_name} <-> {match.found_item.item_name}")
    print(f"[SCORE] Confidence: {match.confidence_score:.3f}")
    print(f"[LOST OWNER] {match.lost_item.posted_by.username} ({match.lost_item.reporter_email or match.lost_item.posted_by.email})")
    print(f"[FINDER] {match.found_item.posted_by.username} ({match.found_item.reporter_email or match.found_item.posted_by.email})")
    
    # Send emails
    print(f"\n[EMAIL] Sending emails for match {match.id}...")
    success = send_match_notifications(match)
    
    if success:
        print("[SUCCESS] Emails sent successfully!")
    else:
        print("[ERROR] Failed to send emails")
    
    # Also try sending emails for other recent matches
    print(f"\n[EMAIL] Sending emails for other recent matches...")
    recent_matches = Match.objects.filter(id__in=[33, 34]).order_by('-created_at')
    
    for match in recent_matches:
        print(f"\n[MATCH] Sending for: {match.lost_item.item_name} <-> {match.found_item.item_name}")
        success = send_match_notifications(match)
        if success:
            print("[SUCCESS] Emails sent!")
        else:
            print("[ERROR] Failed to send emails")

if __name__ == '__main__':
    send_manual_emails()
