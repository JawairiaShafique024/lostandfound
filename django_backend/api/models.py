from django.db import models
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import uuid
import secrets

class LostItem(models.Model):
    item_name = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=300)
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to='lost_items/', blank=True, null=True)
    reporter_name = models.CharField(max_length=150, blank=True)
    reporter_email = models.EmailField(blank=True)
    additional_info = models.TextField(blank=True)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    date_lost = models.DateField()
    contact = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.item_name

class FoundItem(models.Model):
    item_name = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=300)
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to='found_items/', blank=True, null=True)
    reporter_name = models.CharField(max_length=150, blank=True)
    reporter_email = models.EmailField(blank=True)
    additional_info = models.TextField(blank=True)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    date_found = models.DateField()
    contact = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.item_name

class Match(models.Model):
    lost_item = models.ForeignKey(LostItem, on_delete=models.CASCADE, related_name='matches')
    found_item = models.ForeignKey(FoundItem, on_delete=models.CASCADE, related_name='matches')
    match_type = models.CharField(max_length=50, choices=[
        ('image', 'Image Match'),
        ('description', 'Description Match'),
        ('location', 'Location Match'),
        ('combined', 'Combined Match')
    ])
    confidence_score = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Match: {self.lost_item.item_name} <-> {self.found_item.item_name}"

    def send_match_notifications(self):
        """Send email notifications to both users about the match"""
        from .utils.email_utils import send_match_notifications
        
        try:
            # Use the enhanced email utility function
            success = send_match_notifications(self)
            
            if not success:
                # Fallback to console if email fails
                print("[EMAIL] Email notifications failed, falling back to console output...")
                print(f"[MATCH] Match created: {self.lost_item.item_name} <-> {self.found_item.item_name}")
                print(f"[SCORE] Confidence Score: {int(self.confidence_score * 100)}%")
                print(f"[OWNER] Lost item owner: {self.lost_item.reporter_name or self.lost_item.posted_by.username}")
                print(f"[FINDER] Found item finder: {self.found_item.reporter_name or self.found_item.posted_by.username}")
                
        except Exception as e:
            print(f"[ERROR] Error sending match notifications: {e}")
            # Fallback to console if email fails
            print("[EMAIL] Falling back to console output...")
            print(f"[MATCH] Match created: {self.lost_item.item_name} <-> {self.found_item.item_name}")
            print(f"[SCORE] Confidence Score: {int(self.confidence_score * 100)}%")

class ChatMessage(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.username} in {self.match}"

    class Meta:
        ordering = ['timestamp']


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a secure 6-digit numeric code (100000-999999)
            # Ensure uniqueness to satisfy unique constraint
            for _ in range(5):
                candidate = str(secrets.randbelow(900000) + 100000)
                if not PasswordResetCode.objects.filter(code=candidate).exists():
                    self.code = candidate
                    break
            if not self.code:
                # Fallback to UUID hex if we somehow couldn't allocate a code
                self.code = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def is_expired(self):
        # 1 hour validity
        return (timezone.now() - self.created_at).total_seconds() > 3600


class Feedback(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    lost_item = models.ForeignKey(LostItem, on_delete=models.CASCADE, related_name='feedbacks', blank=True, null=True)
    found_item = models.ForeignKey(FoundItem, on_delete=models.CASCADE, related_name='feedbacks', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    rating = models.IntegerField(choices=RATING_CHOICES, blank=True, null=True)
    note = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.lost_item or self.found_item
        return f"Feedback for {target} by {self.created_by or 'anonymous'}"


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.token:
            # Generate a secure token
            self.token = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def is_expired(self):
        # Token expires after 24 hours
        return (timezone.now() - self.created_at).total_seconds() > 86400

    def __str__(self):
        return f"Email verification for {self.user.email} - {'Verified' if self.is_verified else 'Pending'}"
