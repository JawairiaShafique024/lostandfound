from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import LostItem, FoundItem, Match, ChatMessage, PasswordResetCode, Feedback
from .serializers import (
    UserSerializer, LostItemSerializer, FoundItemSerializer,
    MatchSerializer, ChatMessageSerializer, FeedbackSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
)
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from difflib import SequenceMatcher
import math
from PIL import Image
try:
    import imagehash
except ImportError:
    imagehash = None

# Import our enhanced ML models
try:
    from .ml_models import ml_service
except ImportError:
    ml_service = None
import logging

logger = logging.getLogger(__name__)

def safe_ml_call(func_name, *args, **kwargs):
    """Safely call ML service functions with fallback"""
    if ml_service is None:
        # Fallback to improved basic matching
        if func_name == 'calculate_text_similarity':
            from difflib import SequenceMatcher
            text1, text2 = args[0].lower().strip(), args[1].lower().strip()
            
            # Exact match gets highest score
            if text1 == text2:
                return 1.0
            
            # Check if one text contains the other (partial match)
            if text1 in text2 or text2 in text1:
                return 0.8
            
            # Check for common keywords
            words1 = set(text1.split())
            words2 = set(text2.split())
            common_words = words1.intersection(words2)
            
            if common_words:
                # Calculate Jaccard similarity for word overlap
                jaccard = len(common_words) / len(words1.union(words2))
                # Combine with sequence matching
                sequence_match = SequenceMatcher(None, text1, text2).ratio()
                return max(jaccard * 0.7 + sequence_match * 0.3, sequence_match)
            
            # Fallback to basic sequence matching
            return SequenceMatcher(None, text1, text2).ratio()
        elif func_name == 'calculate_image_similarity':
            return 0.5  # Default similarity
        elif func_name == 'calculate_text_to_image_similarity':
            return 0.0  # No text-to-image without ML
        elif func_name == 'extract_colors_advanced':
            return set()  # No colors without ML
        elif func_name == 'calculate_location_similarity':
            # Basic location similarity
            import math
            lat1, lng1, lat2, lng2 = args
            distance = math.sqrt((lat1-lat2)**2 + (lng1-lng2)**2)
            return max(0.0, 1.0 - (distance / 0.1))  # Simple distance
        elif func_name == 'calculate_date_similarity':
            return 0.5  # Default date similarity
        else:
            return 0.0
    
    try:
        func = getattr(ml_service, func_name)
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"ML service error in {func_name}: {e}")
        return 0.0

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not username or not email or not password:
            return Response({'error': 'Username, email and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create user but don't activate yet
        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False  # User needs to verify email first
        user.save()
        
        # Create email verification record
        from .models import EmailVerification
        from .utils.email_utils import send_verification_email
        
        verification = EmailVerification.objects.create(user=user)
        
        # Send verification email
        email_sent = send_verification_email(user, verification.token)
        
        if email_sent:
            return Response({
                'message': 'Registration successful! Please check your email to verify your account.',
                'email_sent': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active
                }
            }, status=status.HTTP_201_CREATED)
        else:
            # If email fails, still create user but warn them
            return Response({
                'message': 'Registration successful, but email verification failed. Please contact support.',
                'email_sent': False,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active
                }
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_email(self, request):
        """Verify user email with token"""
        token = request.data.get('token')
        
        if not token:
            return Response({'error': 'Verification token is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import EmailVerification
            from django.utils import timezone
            
            verification = EmailVerification.objects.get(token=token, is_verified=False)
            
            # Check if token is expired
            if verification.is_expired():
                return Response({'error': 'Verification token has expired. Please request a new one.'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Mark as verified
            verification.is_verified = True
            verification.verified_at = timezone.now()
            verification.save()
            
            # Activate user account
            user = verification.user
            user.is_active = True
            user.save()
            
            # Create auth token for immediate login
            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Email verified successfully! Your account is now active.',
                'verified': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active
                }
            }, status=status.HTTP_200_OK)
            
        except EmailVerification.DoesNotExist:
            return Response({'error': 'Invalid or already used verification token'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Verification failed: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def resend_verification(self, request):
        """Resend verification email"""
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email, is_active=False)
            from .models import EmailVerification
            from .utils.email_utils import send_verification_email
            
            # Create new verification token
            verification = EmailVerification.objects.create(user=user)
            
            # Send verification email
            email_sent = send_verification_email(user, verification.token)
            
            if email_sent:
                return Response({
                    'message': 'Verification email sent successfully!',
                    'email_sent': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'Failed to send verification email. Please try again later.',
                    'email_sent': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({'error': 'No unverified account found with this email'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Failed to resend verification: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not reveal account existence
            return Response({'status': 'If the email exists, a reset code has been sent.'})

        reset = PasswordResetCode.objects.create(user=user)
        try:
            send_mail(
                subject='Password Reset Code',
                message=f'Your password reset code is: {reset.code}\nThis code expires in 1 hour.',
                from_email=None,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            pass
        # Always return generic status; do NOT include code in response
        return Response({'status': 'If the email exists, a reset code has been sent.'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        try:
            reset = PasswordResetCode.objects.get(code=code, is_used=False)
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'Invalid or used code'}, status=status.HTTP_400_BAD_REQUEST)
        if reset.is_expired():
            return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

        user = reset.user
        user.set_password(new_password)
        user.save()
        reset.is_used = True
        reset.save()

        # Optionally issue a fresh token for immediate login
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'status': 'Password reset successful', 'token': token.key})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return Response({'error': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not old_password or not new_password or not confirm_password:
            return Response({'error': 'All password fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New password and confirmation do not match'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Re-issue the token so the client remains authenticated with new credentials
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'status': 'Password changed successfully', 'token': token.key})

class LostItemViewSet(viewsets.ModelViewSet):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer

    def get_queryset(self):
        """Return all lost items, but for profile filtering is done on frontend"""
        return LostItem.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(posted_by=self.request.user)
        # Trigger matching after creating lost item
        print(f"[SEARCH] Lost item created: {instance.item_name} - Starting match search...")
        self.find_matches(instance)
        print(f"[COMPLETE] Match search completed for: {instance.item_name}")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def find_matches_for_item(self, request, pk=None):
        """Manually trigger matching for an existing lost item"""
        lost_item = self.get_object()
        
        # Check if user owns this item
        if lost_item.posted_by != request.user:
            return Response({'error': 'You can only find matches for your own items'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        print(f"[MANUAL MATCH] User {request.user.username} triggered matching for lost item: {lost_item.item_name}")
        self.find_matches(lost_item)
        
        # Count new matches created
        from .models import Match
        new_matches = Match.objects.filter(lost_item=lost_item).count()
        
        return Response({
            'status': 'Matching completed',
            'item_name': lost_item.item_name,
            'matches_found': new_matches
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update item status when user finds/closes the item"""
        lost_item = self.get_object()
        
        # Check if user owns this item
        if lost_item.posted_by != request.user:
            return Response({'error': 'You can only update your own items'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        feedback = request.data.get('feedback', '')
        
        if new_status not in ['active', 'found', 'inactive']:
            return Response({'error': 'Invalid status'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = lost_item.status
        lost_item.status = new_status
        lost_item.save()
        
        # Log status change with feedback
        print(f"[STATUS CHANGE] Lost item '{lost_item.item_name}' changed from '{old_status}' to '{new_status}'")
        if feedback:
            print(f"[USER FEEDBACK] {feedback}")
        
        # If item is marked as found, update all related matches to completed
        if new_status == 'found':
            from .models import Match
            related_matches = Match.objects.filter(lost_item=lost_item, status__in=['pending', 'accepted'])
            updated_matches_count = related_matches.update(status='completed')
            print(f"[MATCH UPDATE] Updated {updated_matches_count} matches to completed status for found item: {lost_item.item_name}")
        
        response_data = {
            'status': 'Status updated successfully',
            'old_status': old_status,
            'new_status': new_status,
            'item_name': lost_item.item_name
        }
        
        if feedback:
            response_data['feedback_received'] = feedback
        
        # Auto-save feedback if provided
        if feedback:
            try:
                Feedback.objects.create(lost_item=lost_item, created_by=request.user, note=feedback, is_public=True)
            except Exception:
                pass
        return Response(response_data)

    def _extract_colors(self, text):
        """Extract known color words from a given text."""
        if not text:
            return set()
        colors = {
            'black','white','red','green','blue','yellow','pink','purple','orange','brown',
            'gray','grey','gold','silver','maroon','navy','beige','teal','cyan','magenta','violet'
        }
        words = {w.strip('.,!?:;()[]{}"\'-').lower() for w in text.split()}
        return {w for w in words if w in colors}

    def find_matches(self, lost_item):
        """Find potential matches for a lost item"""
        found_items = FoundItem.objects.filter(status='active')
        print(f"[SEARCH] Searching matches for lost item: {lost_item.item_name}")
        print(f"[COUNT] Found {found_items.count()} active found items to compare")
        
        for found_item in found_items:
            # Skip if already matched
            if Match.objects.filter(lost_item=lost_item, found_item=found_item).exists():
                continue
            
            confidence_score = self.calculate_match_score(lost_item, found_item)
            print(f"[COMPARE] Comparing '{lost_item.item_name}' vs '{found_item.item_name}' - Score: {confidence_score}")
            
            # OPTIMIZED BALANCED THRESHOLDS for different scenarios
            # More reasonable thresholds to allow legitimate matches
            if lost_item.image and found_item.image:
                # IMAGE_TO_IMAGE: High threshold - both have images so expect good accuracy
                threshold = 0.65
            elif not lost_item.image and found_item.image:
                # TEXT_TO_IMAGE: Moderate threshold - text-to-image matching
                threshold = 0.45
            else:
                # TEXT_ONLY: Lower threshold - text-only matching
                threshold = 0.40
            print(f"[THRESHOLD] Threshold: {threshold}, Score: {confidence_score}")
            if confidence_score >= threshold:
                match_type = self.determine_match_type(lost_item, found_item, confidence_score)
                
                match = Match.objects.create(
                    lost_item=lost_item,
                    found_item=found_item,
                    match_type=match_type,
                    confidence_score=confidence_score
                )
                print(f"[SUCCESS] MATCH CREATED! ID: {match.id}, Score: {confidence_score}")
                
                # Send email notifications
                print("[EMAIL] Sending email notifications...")
                match.send_match_notifications()
            else:
                print(f"[FAIL] No match - Score {confidence_score} below threshold {threshold}")

    def calculate_match_score(self, lost_item, found_item):
        """
        ENHANCED HIGH-ACCURACY Calculate match confidence score between 0 and 1
        Optimized weights for maximum accuracy in both scenarios:
        1. Lost+Found both have images
        2. Lost has text only, Found has image
        """
        from .item_categories import are_items_compatible
        
        # === CATEGORY COMPATIBILITY CHECK (CRITICAL FILTER) ===
        is_compatible, category_score, lost_cat, found_cat = are_items_compatible(lost_item, found_item)
        
        print(f"[CATEGORY] Lost: '{lost_item.item_name}' -> {lost_cat}")
        print(f"[CATEGORY] Found: '{found_item.item_name}' -> {found_cat}")
        print(f"[CATEGORY] Compatible: {is_compatible}, Score: {category_score}")
        
        # If items are not compatible, return very low score
        if not is_compatible:
            print(f"[CATEGORY] Items not compatible - rejecting match")
            return 0.0
        
        # If compatibility score is too low, apply moderate penalty (but still allow matching)
        # Removed strict rejection - allow matches even with lower compatibility scores
        score = 0.0
        weights_used = []
        scenario = ""
        
        logger.info(f"Calculating HIGH-ACCURACY match score between lost: {lost_item.item_name} and found: {found_item.item_name}")
        
        # === SCENARIO DETECTION AND OPTIMIZED SCORING ===
        if lost_item.image and found_item.image:
            # SCENARIO 1: Both have images - HIGHEST ACCURACY EXPECTED
            scenario = "IMAGE_TO_IMAGE"
            print(f"[SCENARIO] {scenario} - Both items have images")
            
            # Image similarity is CRITICAL in this scenario
            try:
                image_score = safe_ml_call('calculate_image_similarity',
                    lost_item.image.path, 
                    found_item.image.path
                )
                score += image_score * 0.55  # 55% weight - INCREASED for higher accuracy
                weights_used.append(f"Image: {image_score:.3f} * 0.55")
                logger.info(f"Image similarity score: {image_score}")
                
                # If image score is very low, heavily penalize
                if image_score < 0.3:
                    print(f"[PENALTY] Low image similarity {image_score} - applying penalty")
                    score *= 0.5  # Cut score in half
            except Exception as e:
                logger.error(f"Image similarity failed: {e}")
                return 0.1  # Very low score if image comparison fails
        
        elif not lost_item.image and found_item.image:
            # SCENARIO 2: Text-to-Image matching - MAGIC SCENARIO
            scenario = "TEXT_TO_IMAGE"
            print(f"[SCENARIO] {scenario} - Lost has text, Found has image")
            
            # Text-to-image is CRITICAL in this scenario
            try:
                lost_text = f"{lost_item.item_name} {lost_item.description}"
                text_to_image_score = safe_ml_call('calculate_text_to_image_similarity',
                    lost_text, 
                    found_item.image.path
                )
                score += text_to_image_score * 0.50  # 50% weight - INCREASED for accuracy
                weights_used.append(f"Text-to-Image: {text_to_image_score:.3f} * 0.50")
                logger.info(f"Text-to-image similarity score: {text_to_image_score}")
                
                # If text-to-image score is very low, apply moderate penalty
                if text_to_image_score < 0.3:
                    print(f"[PENALTY] Low text-to-image similarity {text_to_image_score} - applying penalty")
                    score *= 0.6  # Reduce score moderately
            except Exception as e:
                logger.error(f"Text-to-image similarity failed: {e}")
                return 0.1  # Very low score if text-to-image fails
        
        else:
            # SCENARIO 3: Text-only matching
            scenario = "TEXT_ONLY"
            print(f"[SCENARIO] {scenario} - Text-based matching")
        
        # === ENHANCED TEXT SIMILARITY (Sentence-BERT) ===
        text_score_total = 0.0
        text_components = 0
        
        # Description similarity - CRITICAL
        if lost_item.description and found_item.description:
            desc_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.description, 
                found_item.description
            )
            text_score_total += desc_similarity * 0.30  # 30% weight
            text_components += 1
            weights_used.append(f"Description: {desc_similarity:.3f} * 0.30")
            logger.info(f"Description similarity score: {desc_similarity}")
        
        # Item name similarity - CRITICAL  
        if lost_item.item_name and found_item.item_name:
            name_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.item_name,
                found_item.item_name
            )
            text_score_total += name_similarity * 0.25  # 25% weight
            text_components += 1
            weights_used.append(f"Name: {name_similarity:.3f} * 0.25")
            logger.info(f"Name similarity score: {name_similarity}")
        
        score += text_score_total
        
        # === LOCATION PROXIMITY (Enhanced with stricter matching) ===
        if (lost_item.latitude and lost_item.longitude and 
            found_item.latitude and found_item.longitude):
            location_score = safe_ml_call('calculate_location_similarity',
                lost_item.latitude, lost_item.longitude,
                found_item.latitude, found_item.longitude
            )
            score += location_score * 0.12  # 12% weight - slightly reduced
            weights_used.append(f"Location: {location_score:.3f} * 0.12")
            logger.info(f"Location similarity score: {location_score}")
        
        # === DATE PROXIMITY (Enhanced) ===
        if hasattr(lost_item, 'date_lost') and hasattr(found_item, 'date_found'):
            date_score = safe_ml_call('calculate_date_similarity',
                lost_item.date_lost, 
                found_item.date_found
            )
            score += date_score * 0.08  # 8% weight - slightly reduced
            weights_used.append(f"Date: {date_score:.3f} * 0.08")
            logger.info(f"Date similarity score: {date_score}")
        
        # === COLOR CONSISTENCY CHECK (STRICT FILTER) ===
        lost_colors = safe_ml_call('extract_colors_advanced',f"{lost_item.item_name} {lost_item.description}")
        found_colors = safe_ml_call('extract_colors_advanced',f"{found_item.item_name} {found_item.description}")
        if lost_colors and found_colors:
            if lost_colors.isdisjoint(found_colors):
                # Different prominent colors -> STRICT PENALTY
                logger.info(f"Color mismatch: {lost_colors} vs {found_colors}")
                print(f"[STRICT FILTER] Color mismatch detected - heavily penalizing")
                score *= 0.3  # Reduce score to 30%
            else:
                # Same color mentioned -> generous bonus
                color_bonus = len(lost_colors.intersection(found_colors)) * 0.08
                score += min(color_bonus, 0.20)  # Max 20% bonus - INCREASED
                weights_used.append(f"Color Bonus: +{min(color_bonus, 0.20):.3f}")
                logger.info(f"Color match bonus: {color_bonus}")
        
        # === ADDITIONAL INFO SIMILARITY ===
        if lost_item.additional_info and found_item.additional_info:
            additional_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.additional_info,
                found_item.additional_info
            )
            score += additional_similarity * 0.05  # 5% weight
            weights_used.append(f"Additional: {additional_similarity:.3f} * 0.05")
            logger.info(f"Additional info similarity score: {additional_similarity}")
        
        # === CATEGORY CONFIDENCE BOOST ===
        score += category_score * 0.15  # 15% weight for category compatibility
        weights_used.append(f"Category: {category_score:.3f} * 0.15")
        
        final_score = min(score, 1.0)  # Cap at 1.0
        
        print(f"[{scenario}] Weights used: {weights_used}")
        print(f"[{scenario}] Final match score: {final_score:.4f}")
        logger.info(f"Final HIGH-ACCURACY match score: {final_score}")
        
        return final_score

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance

    def determine_match_type(self, lost_item, found_item, score):
        """Determine the type of match based on score components"""
        if score >= 0.9:
            return 'combined'
        elif score >= 0.8:
            return 'description'
        elif score >= 0.6:
            return 'location'
        else:
            return 'image'

class FoundItemViewSet(viewsets.ModelViewSet):
    queryset = FoundItem.objects.all()
    serializer_class = FoundItemSerializer

    def get_queryset(self):
        """Return all found items, but for profile filtering is done on frontend"""
        return FoundItem.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(posted_by=self.request.user)
        # Trigger matching after creating found item
        print(f"[SEARCH] Found item created: {instance.item_name} - Starting match search...")
        self.find_matches(instance)
        print(f"[COMPLETE] Match search completed for: {instance.item_name}")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def find_matches_for_item(self, request, pk=None):
        """Manually trigger matching for an existing found item"""
        found_item = self.get_object()
        
        # Check if user owns this item
        if found_item.posted_by != request.user:
            return Response({'error': 'You can only find matches for your own items'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        print(f"[MANUAL MATCH] User {request.user.username} triggered matching for found item: {found_item.item_name}")
        self.find_matches(found_item)
        
        # Count new matches created
        from .models import Match
        new_matches = Match.objects.filter(found_item=found_item).count()
        
        return Response({
            'status': 'Matching completed',
            'item_name': found_item.item_name,
            'matches_found': new_matches
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update item status when user returns/closes the item"""
        found_item = self.get_object()
        
        # Check if user owns this item
        if found_item.posted_by != request.user:
            return Response({'error': 'You can only update your own items'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        feedback = request.data.get('feedback', '')
        
        if new_status not in ['active', 'returned', 'inactive']:
            return Response({'error': 'Invalid status. Use: active, returned, inactive'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = found_item.status
        found_item.status = new_status
        found_item.save()
        
        # Log status change with feedback
        print(f"[STATUS CHANGE] Found item '{found_item.item_name}' changed from '{old_status}' to '{new_status}'")
        if feedback:
            print(f"[USER FEEDBACK] {feedback}")
        
        # If item is marked as returned, update all related matches to completed
        if new_status == 'returned':
            from .models import Match
            related_matches = Match.objects.filter(found_item=found_item, status__in=['pending', 'accepted'])
            updated_matches_count = related_matches.update(status='completed')
            print(f"[MATCH UPDATE] Updated {updated_matches_count} matches to completed status for returned item: {found_item.item_name}")
        
        response_data = {
            'status': 'Status updated successfully',
            'old_status': old_status,
            'new_status': new_status,
            'item_name': found_item.item_name
        }
        
        if feedback:
            response_data['feedback_received'] = feedback
        
        # Auto-save feedback if provided
        if feedback:
            try:
                Feedback.objects.create(found_item=found_item, created_by=request.user, note=feedback, is_public=True)
            except Exception:
                pass
        return Response(response_data)

    def find_matches(self, found_item):
        """Find potential matches for a found item"""
        lost_items = LostItem.objects.filter(status='active')
        print(f"[SEARCH] Searching matches for found item: {found_item.item_name}")
        print(f"[COUNT] Found {lost_items.count()} active lost items to compare")
        
        for lost_item in lost_items:
            # Skip if already matched
            if Match.objects.filter(lost_item=lost_item, found_item=found_item).exists():
                continue
            
            confidence_score = self.calculate_match_score(lost_item, found_item)
            print(f"[COMPARE] Comparing found '{found_item.item_name}' vs lost '{lost_item.item_name}' - Score: {confidence_score}")
            
            # OPTIMIZED BALANCED THRESHOLDS for different scenarios  
            # More reasonable thresholds to allow legitimate matches
            if lost_item.image and found_item.image:
                # IMAGE_TO_IMAGE: High threshold - both have images so expect good accuracy
                threshold = 0.65
            elif not lost_item.image and found_item.image:
                # TEXT_TO_IMAGE: Moderate threshold - text-to-image matching
                threshold = 0.45
            else:
                # TEXT_ONLY: Lower threshold - text-only matching
                threshold = 0.40
            
            print(f"[THRESHOLD] Threshold: {threshold}, Score: {confidence_score}")
            if confidence_score >= threshold:
                match_type = self.determine_match_type(lost_item, found_item, confidence_score)
                
                match = Match.objects.create(
                    lost_item=lost_item,
                    found_item=found_item,
                    match_type=match_type,
                    confidence_score=confidence_score
                )
                print(f"[SUCCESS] MATCH CREATED! ID: {match.id}, Score: {confidence_score}")
                
                # Send email notifications
                print("[EMAIL] Sending email notifications...")
                match.send_match_notifications()
            else:
                print(f"[FAIL] No match - Score {confidence_score} below threshold {threshold}")

    def calculate_match_score(self, lost_item, found_item):
        """
        ENHANCED HIGH-ACCURACY Calculate match confidence score between 0 and 1
        Uses optimized weights for maximum accuracy in both scenarios (FoundItemViewSet version)
        """
        from .item_categories import are_items_compatible
        
        # === CATEGORY COMPATIBILITY CHECK (CRITICAL FILTER) ===
        is_compatible, category_score, lost_cat, found_cat = are_items_compatible(lost_item, found_item)
        
        print(f"[CATEGORY] Lost: '{lost_item.item_name}' -> {lost_cat}")
        print(f"[CATEGORY] Found: '{found_item.item_name}' -> {found_cat}")
        print(f"[CATEGORY] Compatible: {is_compatible}, Score: {category_score}")
        
        # If items are not compatible, return very low score
        if not is_compatible:
            print(f"[CATEGORY] Items not compatible - rejecting match")
            return 0.0
        
        # If compatibility score is too low, apply moderate penalty (but still allow matching)
        # Removed strict rejection - allow matches even with lower compatibility scores
        score = 0.0
        weights_used = []
        scenario = ""
        
        logger.info(f"[FoundItem] Calculating HIGH-ACCURACY match score between lost: {lost_item.item_name} and found: {found_item.item_name}")
        
        # === SCENARIO DETECTION AND OPTIMIZED SCORING ===
        if lost_item.image and found_item.image:
            # SCENARIO 1: Both have images - HIGHEST ACCURACY EXPECTED
            scenario = "IMAGE_TO_IMAGE"
            print(f"[FoundItem][SCENARIO] {scenario} - Both items have images")
            
            # Image similarity is CRITICAL in this scenario
            try:
                image_score = safe_ml_call('calculate_image_similarity',
                    lost_item.image.path, 
                    found_item.image.path
                )
                score += image_score * 0.55  # 55% weight - INCREASED for higher accuracy
                weights_used.append(f"Image: {image_score:.3f} * 0.55")
                logger.info(f"[FoundItem] Image similarity score: {image_score}")
                
                # If image score is very low, heavily penalize
                if image_score < 0.3:
                    print(f"[FoundItem][PENALTY] Low image similarity {image_score} - applying penalty")
                    score *= 0.5  # Cut score in half
            except Exception as e:
                logger.error(f"[FoundItem] Image similarity failed: {e}")
                return 0.1  # Very low score if image comparison fails
        
        elif not lost_item.image and found_item.image:
            # SCENARIO 2: Text-to-Image matching - MAGIC SCENARIO
            scenario = "TEXT_TO_IMAGE"
            print(f"[FoundItem][SCENARIO] {scenario} - Lost has text, Found has image")
            
            # Text-to-image is CRITICAL in this scenario
            try:
                lost_text = f"{lost_item.item_name} {lost_item.description}"
                text_to_image_score = safe_ml_call('calculate_text_to_image_similarity',
                    lost_text, 
                    found_item.image.path
                )
                score += text_to_image_score * 0.50  # 50% weight - INCREASED for accuracy
                weights_used.append(f"Text-to-Image: {text_to_image_score:.3f} * 0.50")
                logger.info(f"[FoundItem] Text-to-image similarity score: {text_to_image_score}")
                
                # If text-to-image score is very low, apply moderate penalty
                if text_to_image_score < 0.3:
                    print(f"[FoundItem][PENALTY] Low text-to-image similarity {text_to_image_score} - applying penalty")
                    score *= 0.6  # Reduce score moderately
            except Exception as e:
                logger.error(f"[FoundItem] Text-to-image similarity failed: {e}")
                return 0.1  # Very low score if text-to-image fails
        
        else:
            # SCENARIO 3: Text-only matching
            scenario = "TEXT_ONLY"
            print(f"[FoundItem][SCENARIO] {scenario} - Text-based matching")
        
        # === ENHANCED TEXT SIMILARITY (Sentence-BERT) ===
        text_score_total = 0.0
        text_components = 0
        
        # Description similarity - CRITICAL
        if lost_item.description and found_item.description:
            desc_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.description, 
                found_item.description
            )
            text_score_total += desc_similarity * 0.30  # 30% weight
            text_components += 1
            weights_used.append(f"Description: {desc_similarity:.3f} * 0.30")
            logger.info(f"[FoundItem] Description similarity score: {desc_similarity}")
        
        # Item name similarity - CRITICAL  
        if lost_item.item_name and found_item.item_name:
            name_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.item_name,
                found_item.item_name
            )
            text_score_total += name_similarity * 0.25  # 25% weight
            text_components += 1
            weights_used.append(f"Name: {name_similarity:.3f} * 0.25")
            logger.info(f"[FoundItem] Name similarity score: {name_similarity}")
        
        score += text_score_total

        # === COLOR CONSISTENCY CHECK (STRICT FILTER) ===
        lost_colors = safe_ml_call('extract_colors_advanced',f"{lost_item.item_name} {lost_item.description}")
        found_colors = safe_ml_call('extract_colors_advanced',f"{found_item.item_name} {found_item.description}")
        if lost_colors and found_colors:
            if lost_colors.isdisjoint(found_colors):
                # Different prominent colors -> STRICT PENALTY
                logger.info(f"[FoundItem] Color mismatch: {lost_colors} vs {found_colors}")
                print(f"[FoundItem][STRICT FILTER] Color mismatch detected - heavily penalizing")
                score *= 0.3  # Reduce score to 30%
            else:
                # Same color mentioned -> generous bonus
                color_bonus = len(lost_colors.intersection(found_colors)) * 0.08
                score += min(color_bonus, 0.20)  # Max 20% bonus - INCREASED
                weights_used.append(f"Color Bonus: +{min(color_bonus, 0.20):.3f}")
                logger.info(f"[FoundItem] Color match bonus: {color_bonus}")
        
        # === LOCATION PROXIMITY (Enhanced with stricter matching) ===
        if (lost_item.latitude and lost_item.longitude and 
            found_item.latitude and found_item.longitude):
            location_score = safe_ml_call('calculate_location_similarity',
                lost_item.latitude, lost_item.longitude,
                found_item.latitude, found_item.longitude
            )
            score += location_score * 0.12  # 12% weight - slightly reduced
            weights_used.append(f"Location: {location_score:.3f} * 0.12")
            logger.info(f"[FoundItem] Location similarity score: {location_score}")
        
        # === DATE PROXIMITY (Enhanced) ===
        if hasattr(lost_item, 'date_lost') and hasattr(found_item, 'date_found'):
            date_score = safe_ml_call('calculate_date_similarity',
                lost_item.date_lost, 
                found_item.date_found
            )
            score += date_score * 0.08  # 8% weight - slightly reduced
            weights_used.append(f"Date: {date_score:.3f} * 0.08")
            logger.info(f"[FoundItem] Date similarity score: {date_score}")
        
        # === ADDITIONAL INFO SIMILARITY ===
        if lost_item.additional_info and found_item.additional_info:
            additional_similarity = safe_ml_call('calculate_text_similarity',
                lost_item.additional_info,
                found_item.additional_info
            )
            score += additional_similarity * 0.05  # 5% weight
            weights_used.append(f"Additional: {additional_similarity:.3f} * 0.05")
            logger.info(f"[FoundItem] Additional info similarity score: {additional_similarity}")
        
        # === CATEGORY CONFIDENCE BOOST ===
        score += category_score * 0.15  # 15% weight for category compatibility
        weights_used.append(f"Category: {category_score:.3f} * 0.15")
        
        final_score = min(score, 1.0)  # Cap at 1.0
        
        print(f"[FoundItem][{scenario}] Weights used: {weights_used}")
        print(f"[FoundItem][{scenario}] Final match score: {final_score:.4f}")
        logger.info(f"[FoundItem] Final HIGH-ACCURACY match score: {final_score}")
        
        return final_score

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance

    def determine_match_type(self, lost_item, found_item, score):
        """Determine the type of match based on score components"""
        if score >= 0.9:
            return 'combined'
        elif score >= 0.8:
            return 'description'
        elif score >= 0.6:
            return 'location'
        else:
            return 'image'


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.filter(is_public=True).order_by('-created_at')
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def _extract_colors(self, text):
        """Extract known color words from a given text."""
        if not text:
            return set()
        colors = {
            'black','white','red','green','blue','yellow','pink','purple','orange','brown',
            'gray','grey','gold','silver','maroon','navy','beige','teal','cyan','magenta','violet'
        }
        words = {w.strip('.,!?:;()[]{}"\'-').lower() for w in text.split()}
        return {w for w in words if w in colors}
