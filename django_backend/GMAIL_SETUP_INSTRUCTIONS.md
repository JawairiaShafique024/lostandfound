# Gmail Setup Instructions for Lost & Found Hub

## 🚨 IMPORTANT: Users won't get email notifications until you complete these steps!

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the setup process with your phone number

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as device
4. Enter: "Lost and Found Hub Django"
5. Click "Generate"
6. Copy the 16-character password (format: abcd efgh ijkl mnop)

### Step 3: Update Django Settings
1. Open: `django_backend/lostandfound_backend/settings.py`
2. Find line 133: `EMAIL_HOST_PASSWORD = 'your-new-gmail-app-password-here'`
3. Replace `your-new-gmail-app-password-here` with your 16-character password
4. **IMPORTANT:** Remove all spaces from the password!

### Step 4: Test Email
```bash
cd django_backend
python test_gmail_final.py
```

### Step 5: Verify
- Create a new match in your system
- Check if emails are sent to both users
- Users should receive notifications at their email addresses

## 📧 Email Recipients for Infinix Mobile Match:
- **Lost Item Owner:** aribaiqbal22@gmail.com
- **Found Item Owner:** lostandfoundhub235@gmail.com

## 🔧 Alternative Solutions:
If Gmail doesn't work, consider:
1. **SendGrid** (100 free emails/day)
2. **Mailgun** (5000 free emails/month)
3. **Outlook SMTP** (easier than Gmail)

## ✅ Success Indicators:
- No "535 authentication error"
- Users receive actual emails
- Match notifications work properly
