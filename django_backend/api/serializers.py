from rest_framework import serializers
from django.contrib.auth.models import User
from .models import LostItem, FoundItem, Match, ChatMessage, Feedback

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class LostItemSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    reporter_name = serializers.CharField(allow_blank=True, required=False)
    reporter_email = serializers.EmailField(allow_blank=True, required=False)
    additional_info = serializers.CharField(allow_blank=True, required=False)
    
    class Meta:
        model = LostItem
        fields = ['id', 'item_name', 'description', 'location', 'latitude', 'longitude', 'image',
                 'reporter_name', 'reporter_email', 'additional_info',
                 'posted_by', 'date_lost', 'contact', 'status', 'created_at']

class FoundItemSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    reporter_name = serializers.CharField(allow_blank=True, required=False)
    reporter_email = serializers.EmailField(allow_blank=True, required=False)
    additional_info = serializers.CharField(allow_blank=True, required=False)
    
    class Meta:
        model = FoundItem
        fields = ['id', 'item_name', 'description', 'location', 'latitude', 'longitude', 'image',
                 'reporter_name', 'reporter_email', 'additional_info',
                 'posted_by', 'date_found', 'contact', 'status', 'created_at']

    def validate(self, attrs):
        # Require image for found items
        if self.instance is None and not attrs.get('image'):
            raise serializers.ValidationError({'image': 'Image is required for found items.'})
        return attrs

class MatchSerializer(serializers.ModelSerializer):
    lost_item = LostItemSerializer(read_only=True)
    found_item = FoundItemSerializer(read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'lost_item', 'found_item', 'match_type', 'confidence_score', 
                 'status', 'created_at', 'updated_at']

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message', 'timestamp', 'is_read']


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    code = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return attrs


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'lost_item', 'found_item', 'created_by', 'rating', 'note', 'is_public', 'created_at']
        read_only_fields = ['created_by', 'created_at']