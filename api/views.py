from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from .models import *
from rest_framework.views import APIView
from django.contrib.auth import logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from rest_framework import status


class user_role(APIView):
    """
    View to determine the role of the user (student or professor).
    """
    @login_required
    def get(self, request):
        if hasattr(request.user, 'student') or request.user.is_student:
            return Response({'role': 'student'})
        elif hasattr(request.user, 'professor') or request.user.is_professor:
            return Response({'role': 'professor'})
        else:
            return Response({'error': 'User role not found'}, status=404)


@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE')})

class LogoutView(APIView):
    def post(self, request):
        user = request.user
        print("Logout Request User:", user)
        if user.is_authenticated:
            print("User is authenticated:", user.username)
            print("User ID:", user.id)
            logout(request)
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        return Response({"error": "User not authenticated."}, status=status.HTTP_400_BAD_REQUEST)