from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import user_role, get_csrf_token, LogoutView
import student_portal.urls as student_urls
import professor_portal.urls as professor_urls

# router = DefaultRouter()
# router.register(r'user-role', user_role, basename='user_role')
# router.register(r'csrf', get_csrf_token, basename='get_csrf_token')

urlpatterns = [
    # path('', include(router.urls)),
    path('user-role/', user_role.as_view(), name='user_role'),
    path("csrf/", get_csrf_token, name='get_csrf_token'),
    path('student/', include(student_urls)),
    path('professor/', include(professor_urls)),
    path('logout/', LogoutView.as_view(), name='logout')
]
