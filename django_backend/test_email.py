#!/usr/bin/env python
"""
Test actual email sending
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=== TESTING ACTUAL EMAIL SENDING ===")
    print(f"Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Email Host: {settings.EMAIL_HOST}")
    print(f"Email User: {settings.EMAIL_HOST_USER}")
    print(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    try:
        # Test email
        result = send_mail(
            subject='🔥 Test Email from Lost & Found Hub',
            message='''
Hello!

This is a test email from your Lost & Found Hub application.

If you receive this email, your email configuration is working perfectly! 🎉

Best regards,
Lost & Found Hub Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['aribaiqbal676@gmail.com'],  # Send to same email for testing
            fail_silently=False,
        )
        
        if result:
            print("✅ EMAIL SENT SUCCESSFULLY!")
            print("Check your Gmail inbox for the test email.")
        else:
            print("❌ EMAIL SENDING FAILED")
            
    except Exception as e:
        print(f"❌ EMAIL ERROR: {e}")
        print("\nPossible issues:")
        print("1. Gmail App Password might be wrong")
        print("2. 2-Factor Authentication not enabled")
        print("3. Less secure app access disabled")
        print("\nTo fix Gmail issues:")
        print("1. Go to Google Account settings")
        print("2. Enable 2-Factor Authentication")
        print("3. Generate App Password for 'Mail'")
        print("4. Use that App Password in settings.py")

if __name__ == '__main__':
    test_email()
