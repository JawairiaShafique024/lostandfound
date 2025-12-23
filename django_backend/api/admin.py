from django.contrib import admin
from django.utils.html import format_html
from .models import LostItem, FoundItem, Match, ChatMessage, PasswordResetCode

@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ['thumb', 'item_name', 'location', 'latitude', 'longitude', 'description', 'additional_info', 'posted_by', 'reporter_name', 'reporter_email', 'contact', 'date_lost', 'status', 'created_at']
    list_filter = ['status', 'date_lost', 'created_at']
    search_fields = ['item_name', 'description', 'location', 'reporter_name', 'reporter_email']
    actions = ['delete_selected']
    list_per_page = 25

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:4px;" />', obj.image.url)
        return '-'
    thumb.short_description = 'Image'

@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    list_display = ['thumb', 'item_name', 'location', 'latitude', 'longitude', 'description', 'additional_info', 'posted_by', 'reporter_name', 'reporter_email', 'contact', 'date_found', 'status', 'created_at']
    list_filter = ['status', 'date_found', 'created_at']
    search_fields = ['item_name', 'description', 'location', 'reporter_name', 'reporter_email']
    actions = ['delete_selected']
    list_per_page = 25

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:4px;" />', obj.image.url)
        return '-'
    thumb.short_description = 'Image'

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'lost_item', 'found_item', 'match_type', 'confidence_score', 'status', 'created_at']
    list_filter = ['match_type', 'status', 'created_at']
    search_fields = ['lost_item__item_name', 'found_item__item_name']
    actions = ['delete_selected']
    list_per_page = 25

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'match', 'sender', 'message_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['message', 'sender__username']
    actions = ['delete_selected']
    list_per_page = 25

    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'


@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'code', 'is_used', 'created_at']
    search_fields = ['user__username', 'user__email', 'code']
    list_filter = ['is_used', 'created_at']
    actions = ['delete_selected']
    list_per_page = 25
