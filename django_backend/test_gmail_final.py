#!/usr/bin/env python
"""
Final Gmail test - check if emails are actually being sent
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_gmail_final():
    print("=== FINAL GMAIL TEST ===")
    
    print(f"\n[CONFIG] Current Settings:")
    print(f"  Backend: {settings.EMAIL_BACKEND}")
    print(f"  Host: {settings.EMAIL_HOST}")
    print(f"  User: {settings.EMAIL_HOST_USER}")
    print(f"  Password: {'*' * len(settings.EMAIL_HOST_PASSWORD)} ({len(settings.EMAIL_HOST_PASSWORD)} chars)")
    
    if 'your-new-gmail-app-password-here' in settings.EMAIL_HOST_PASSWORD:
        print(f"\n[ERROR] Gmail password not updated!")
        print(f"[ACTION] Please update EMAIL_HOST_PASSWORD in settings.py")
        print(f"[GUIDE] Follow instructions in GMAIL_SETUP_INSTRUCTIONS.md")
        return
    
    print(f"\n[SENDING] Testing actual email delivery...")
    
    try:
        result = send_mail(
            subject='Lost & Found Hub - Gmail Test Successful!',
            message='''
Hello!

This email confirms that your Gmail setup is working correctly.

Your Lost & Found Hub is now ready to send actual email notifications to users when matches are found.

Test Details:
- Infinix Mobile Match Created
- Email notifications enabled
- Users will receive match alerts

Best regards,
Lost & Found Hub System
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['aribaiqbal22@gmail.com'],  # Test with infinix owner
            fail_silently=False,
        )
        
        if result == 1:
            print(f"[SUCCESS] Email sent successfully!")
            print(f"[RECIPIENT] Test email sent to: aribaiqbal22@gmail.com")
            print(f"[STATUS] Gmail is now working for production!")
            print(f"[NEXT] Users will receive actual email notifications")
        else:
            print(f"[FAIL] Email sending failed - result: {result}")
            
    except Exception as e:
        print(f"[ERROR] Gmail Error: {e}")
        
        if "535" in str(e):
            print(f"[SOLUTION] Authentication failed - check app password")
            print(f"[GUIDE] Follow GMAIL_SETUP_INSTRUCTIONS.md")
        else:
            print(f"[SOLUTION] Check internet connection and Gmail settings")

if __name__ == '__main__':
    test_gmail_final()
