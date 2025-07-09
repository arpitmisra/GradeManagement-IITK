from django.urls import path
from . import views
from .views import BatchListAPIView, BranchListAPIView

urlpatterns = [
    path('dashboard/', views.student_dashboard, name='student_dashboard'),
    path('login/', views.StudentLoginView.as_view(), name='student_login'),
    path('register/', views.StudentRegisterView.as_view(), name='student_register'),
    path('batches/', BatchListAPIView.as_view(), name='batches'),
    path('branches/', BranchListAPIView.as_view(), name='branches'),
]