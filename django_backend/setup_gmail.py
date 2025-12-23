#!/usr/bin/env python
"""
Gmail Setup Helper for Lost & Found Hub
"""
import os
import re

def setup_gmail():
    print("=== GMAIL SETUP HELPER ===")
    print("This script will help you configure Gmail for your Lost & Found Hub")
    print()
    
    # Check current settings
    settings_file = 'lostandfound_backend/settings.py'
    
    if not os.path.exists(settings_file):
        print("[ERROR] settings.py file not found!")
        return
    
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Check if password is still placeholder
    if 'your-new-gmail-app-password-here' in content:
        print("[SETUP] Gmail password not configured yet.")
        print()
        print("STEP 1: Enable 2-Factor Authentication")
        print("1. Go to: https://myaccount.google.com/security")
        print("2. Click on '2-Step Verification'")
        print("3. Follow the setup process with your phone number")
        print()
        print("STEP 2: Generate App Password")
        print("1. Go to: https://myaccount.google.com/apppasswords")
        print("2. Select 'Mail' as the app")
        print("3. Select 'Other (Custom name)' as device")
        print("4. Enter: 'Lost and Found Hub Django'")
        print("5. Click 'Generate'")
        print("6. Copy the 16-character password (format: abcd efgh ijkl mnop)")
        print()
        
        # Get password from user
        app_password = input("Enter your Gmail App Password (16 characters, no spaces): ").strip()
        
        if len(app_password) != 16:
            print("[ERROR] App password should be exactly 16 characters!")
            print("Make sure to remove all spaces from the password.")
            return
        
        # Update settings file
        new_content = content.replace(
            "EMAIL_HOST_PASSWORD = 'your-new-gmail-app-password-here'",
            f"EMAIL_HOST_PASSWORD = '{app_password}'"
        )
        
        with open(settings_file, 'w') as f:
            f.write(new_content)
        
        print("[SUCCESS] Gmail password updated in settings.py!")
        
    else:
        print("[INFO] Gmail password appears to be configured already.")
    
    # Test email configuration
    print("\nTesting email configuration...")
    
    try:
        import django
        django.setup()
        
        from api.utils.email_utils import test_email_configuration
        
        success = test_email_configuration()
        
        if success:
            print("[SUCCESS] Gmail configuration is working!")
            print("You can now send email notifications to users.")
        else:
            print("[ERROR] Gmail configuration test failed.")
            print("Please double-check your app password and try again.")
            
    except Exception as e:
        print(f"[ERROR] Error testing configuration: {e}")
    
    print("\n=== SETUP COMPLETE ===")

if __name__ == '__main__':
    # Setup Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lostandfound_backend.settings')
    
    setup_gmail()
