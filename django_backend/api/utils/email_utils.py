"""
Email utilities for Lost & Found Hub
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def send_match_notification_to_owner(match):
    """
    Send HTML email notification to the lost item owner about a potential match
    """
    try:
        lost_item = match.lost_item
        found_item = match.found_item
        
        # Get recipient email
        recipient_email = lost_item.reporter_email or lost_item.posted_by.email
        if not recipient_email:
            logger.warning(f"No email found for lost item owner: {lost_item.id}")
            return False
        
        # Get recipient name
        recipient_name = lost_item.reporter_name or lost_item.posted_by.username or "User"
        
        # Get finder info
        finder_name = found_item.reporter_name or found_item.posted_by.username or "Anonymous"
        finder_contact = found_item.contact or "Available in dashboard"
        
        # Prepare template context
        context = {
            'owner_name': recipient_name,
            'lost_item_name': lost_item.item_name,
            'found_item_name': found_item.item_name,
            'found_item_description': found_item.description,
            'finder_name': finder_name,
            'finder_contact': finder_contact,
            'confidence_score': int(match.confidence_score * 100),
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard" if hasattr(settings, 'FRONTEND_URL') else "http://localhost:5173/dashboard",
            'match_id': match.id,
        }
        
        # Render HTML template
        html_content = render_to_string('emails/match_found_lost_owner.html', context)
        
        # Create plain text version
        text_content = f"""
Hello {recipient_name},

Great news! We found a potential match for your lost item "{lost_item.item_name}".

Found Item Details:
- Item: {found_item.item_name}
- Description: {found_item.description}
- Found by: {finder_name}
- Contact: {finder_contact}
- Match Score: {int(match.confidence_score * 100)}% confidence

Please check your dashboard to view the match and start a conversation with the finder.

Best regards,
Lost & Found Hub Team
        """.strip()
        
        # Create email
        subject = f"🎉 Your Lost Item '{lost_item.item_name}' May Have Been Found!"
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        result = email.send()
        
        if result:
            logger.info(f"Match notification sent to lost item owner: {recipient_email}")
            print(f"[SUCCESS] Email sent to lost item owner: {recipient_email}")
            return True
        else:
            logger.error(f"Failed to send email to lost item owner: {recipient_email}")
            print(f"[ERROR] Failed to send email to lost item owner: {recipient_email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending match notification to owner: {e}")
        print(f"[ERROR] Error sending email to lost item owner: {e}")
        return False

def send_match_notification_to_finder(match):
    """
    Send HTML email notification to the found item finder about a potential match
    """
    try:
        lost_item = match.lost_item
        found_item = match.found_item
        
        # Get recipient email
        recipient_email = found_item.reporter_email or found_item.posted_by.email
        if not recipient_email:
            logger.warning(f"No email found for found item finder: {found_item.id}")
            return False
        
        # Get recipient name
        recipient_name = found_item.reporter_name or found_item.posted_by.username or "User"
        
        # Get owner info
        owner_name = lost_item.reporter_name or lost_item.posted_by.username or "Anonymous"
        owner_contact = lost_item.contact or "Available in dashboard"
        
        # Prepare template context
        context = {
            'finder_name': recipient_name,
            'found_item_name': found_item.item_name,
            'lost_item_name': lost_item.item_name,
            'lost_item_description': lost_item.description,
            'owner_name': owner_name,
            'owner_contact': owner_contact,
            'confidence_score': int(match.confidence_score * 100),
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard" if hasattr(settings, 'FRONTEND_URL') else "http://localhost:5173/dashboard",
            'match_id': match.id,
        }
        
        # Render HTML template
        html_content = render_to_string('emails/match_found_finder.html', context)
        
        # Create plain text version
        text_content = f"""
Hello {recipient_name},

Someone has reported losing an item that matches what you found!

Lost Item Details:
- Item: {lost_item.item_name}
- Description: {lost_item.description}
- Lost by: {owner_name}
- Contact: {owner_contact}
- Match Score: {int(match.confidence_score * 100)}% confidence

Please check your dashboard to view the match and start a conversation with the owner.

Thank you for being awesome and helping reunite people with their lost items!

Best regards,
Lost & Found Hub Team
        """.strip()
        
        # Create email
        subject = f"🔍 Someone is Looking for '{found_item.item_name}' That You Found!"
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        result = email.send()
        
        if result:
            logger.info(f"Match notification sent to finder: {recipient_email}")
            print(f"[SUCCESS] Email sent to finder: {recipient_email}")
            return True
        else:
            logger.error(f"Failed to send email to finder: {recipient_email}")
            print(f"[ERROR] Failed to send email to finder: {recipient_email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending match notification to finder: {e}")
        print(f"[ERROR] Error sending email to finder: {e}")
        return False

def send_match_notifications(match):
    """
    Send match notifications to both the lost item owner and the finder
    """
    print(f"[EMAIL] Sending match notifications for: {match.lost_item.item_name} <-> {match.found_item.item_name}")
    
    # Send to lost item owner
    owner_success = send_match_notification_to_owner(match)
    
    # Send to finder
    finder_success = send_match_notification_to_finder(match)
    
    if owner_success and finder_success:
        print("[SUCCESS] All match notifications sent successfully!")
        return True
    elif owner_success or finder_success:
        print("[WARNING] Some match notifications sent successfully")
        return True
    else:
        print("[ERROR] Failed to send match notifications")
        return False

def send_verification_email(user, verification_token):
    """
    Send email verification email to user
    """
    try:
        from django.template.loader import render_to_string
        from django.core.mail import EmailMultiAlternatives
        
        # Create verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Render HTML template
        html_content = render_to_string('emails/email_verification.html', {
            'user': user,
            'verification_url': verification_url
        })
        
        # Create email
        subject = '🔍 Welcome to Lost & Found Hub - Verify Your Email'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user.email]
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=f"Please verify your email by clicking this link: {verification_url}",
            from_email=from_email,
            to=to_email
        )
        
        # Attach HTML content
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        result = email.send()
        
        if result:
            print(f"[SUCCESS] Verification email sent to {user.email}")
            return True
        else:
            print(f"[ERROR] Failed to send verification email to {user.email}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error sending verification email: {e}")
        return False


def test_email_configuration():
    """
    Test if email configuration is working
    """
    try:
        from django.core.mail import send_mail
        
        result = send_mail(
            subject='🔥 Lost & Found Hub - Email Test',
            message='This is a test email to verify your email configuration is working correctly.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self
            fail_silently=False,
        )
        
        if result:
            print("[SUCCESS] Email configuration test passed!")
            return True
        else:
            print("[ERROR] Email configuration test failed!")
            return False
            
    except Exception as e:
        print(f"[ERROR] Email configuration error: {e}")
        return False
