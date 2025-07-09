# from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from api.models import Student, Grade, CourseAssignment, EvaluationGroup
from django.db.models import Sum
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework import status
from django.views.decorators.csrf import ensure_csrf_cookie
from api.models import User, Student, Branch, Batch

# @login_required
# def redirect_after_login(request):
#     user = request.user
#     if hasattr(user, 'student') or user.is_student:
#         return redirect('student_dashboard')
#     elif hasattr(user, 'professor') or user:
#         return redirect('professor_dashboard')
#     else:
#         return JsonResponse({"error": "User is not a student or professor."}, status=401)


@login_required
def student_dashboard(request):
    student = Student.objects.get(user=request.user)
    assignments = CourseAssignment.objects.filter(batch=student.batch).select_related('course', 'professor')
    grades_list = []
    for ca in assignments:
        groups = EvaluationGroup.objects.filter(course_assignment=ca).prefetch_related('components')
        for group in groups:
            for comp in group.components.all():
                try:
                    grade = Grade.objects.get(student=student, component=comp)
                    grades_list.append({
                        'course': f"{ca.course.name} - {ca.professor or ca.professor.username}",
                        'component': comp.name,
                        'score': grade.score,
                        'max_score': comp.max_score,
                        'weightage': comp.weightage
                    })
                except Grade.DoesNotExist:
                    continue
    return JsonResponse({
        'student': {
            'name': student.user.get_full_name() or student.user.username,
            'roll_number': student.roll_number,
            'branch': student.branch.name if student.branch else '',
            'batch': student.batch.name if student.batch else ''
        },
        'grades': grades_list
    })

class StudentLoginView(APIView):
    @csrf_exempt
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_professor:
            return Response({"error": "This account is not registered as a student"}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)

        return Response({
            "message": "Student login successful",
            "user_type": "student"
        }, status=status.HTTP_200_OK)
    

class StudentRegisterView(APIView):
    @csrf_exempt
    def post(self, request):
        print(request.data)
        # serializer = userSerializer(data=request.data)
        user = User.objects.create_user(
            username=request.data.get("username"),
            password=request.data.get("password"),
            email=request.data.get("email"),
            first_name=request.data.get("first_name", ""),
            last_name=request.data.get("last_name", ""),
            is_student=True,
            is_professor=False,
        )
        if user:
            branch = Branch.objects.filter(name=request.data.get('branch')).exists()
            if not branch:
                print('No Branch!')
                return Response({'error': 'Branch Does Not Exist!'}, status=400)
            batch = Batch.objects.filter(name=request.data.get('batch')).exists()
            if not batch:
                print('No Batch!')
                return Response({'error': 'Batch Does Not Exist!'}, status=400)
            Student.objects.create(
                user=user, 
                roll_number=request.data.get("roll_number", ""),
                branch=Branch.objects.get(name=request.data.get("branch")),
                year=request.data.get("year", 1),
                batch=Batch.objects.get(name=request.data.get("batch", 1))              
                )
            return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)
        return Response({"message": "Student Registration Failed!"}, status=status.HTTP_400_BAD_REQUEST)

class BatchListAPIView(APIView):
    def get(self, request):
        batches = Batch.objects.all().values('id', 'name')
        return Response(list(batches))

class BranchListAPIView(APIView):
    def get(self, request):
        branches = Branch.objects.all().values('id', 'name')
        return Response(list(branches))
