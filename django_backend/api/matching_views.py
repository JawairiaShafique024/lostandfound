from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q
from .models import Match, ChatMessage
from .serializers import MatchSerializer, ChatMessageSerializer

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return matches for the current user
        return Match.objects.filter(
            Q(lost_item__posted_by=self.request.user) | 
            Q(found_item__posted_by=self.request.user)
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        match = self.get_object()
        if request.user in [match.lost_item.posted_by, match.found_item.posted_by]:
            match.status = 'accepted'
            match.save()
            return Response({'status': 'Match accepted'})
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        match = self.get_object()
        if request.user in [match.lost_item.posted_by, match.found_item.posted_by]:
            match.status = 'rejected'
            match.save()
            return Response({'status': 'Match rejected'})
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        match_id = self.request.query_params.get('match_id')
        if not match_id:
            return ChatMessage.objects.none()

        try:
            match = Match.objects.get(id=match_id)
        except Match.DoesNotExist:
            # If the match doesn't exist, surface an empty queryset
            return ChatMessage.objects.none()

        # Ensure the requesting user is part of the match
        if self.request.user in [match.lost_item.posted_by, match.found_item.posted_by]:
            return ChatMessage.objects.filter(match=match).order_by('timestamp')
        # Not authorized to view these messages
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        match_id = self.request.data.get('match_id')
        if not match_id:
            raise NotFound('match_id is required')

        try:
            match = Match.objects.get(id=match_id)
        except Match.DoesNotExist:
            raise NotFound('Match not found')

        # Check if user is part of this match
        if self.request.user not in [match.lost_item.posted_by, match.found_item.posted_by]:
            raise PermissionDenied("You are not authorized to send messages in this match")

        serializer.save(sender=self.request.user, match=match)
