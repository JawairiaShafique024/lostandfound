from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .matching_views import MatchViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'lost-items', views.LostItemViewSet)
router.register(r'found-items', views.FoundItemViewSet)
router.register(r'matches', MatchViewSet)
router.register(r'chat-messages', ChatMessageViewSet)
router.register(r'feedbacks', views.FeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
