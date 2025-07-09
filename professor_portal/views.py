from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from api.models import Professor, CourseAssignment, Grade, EvaluationGroup, User, EvaluationComponent, Student, Branch
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models import Course, Batch, CourseAssignment
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from api.serializers import BatchSerializer
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from django.contrib.auth.mixins import LoginRequiredMixin
import pandas as pd
from rest_framework.decorators import parser_classes
from rest_framework.parsers import JSONParser
import csv


class professor_dashboard(LoginRequiredMixin,APIView):

    def get(self,request):
        if not hasattr(request.user, 'professor') and not request.user.is_professor:
            return JsonResponse({"error": "User is not a professor."}, status=status.HTTP_401_UNAUTHORIZED)
        professor = Professor.objects.get(user=request.user)
        assignments = CourseAssignment.objects.filter(professor=professor).select_related('course', 'batch')
        dashboard_data = []
        for ca in assignments:
            groups = EvaluationGroup.objects.filter(course_assignment=ca).prefetch_related('components')
            student_scores = {}
    
            for group in groups:
                total_weightage = group.components.aggregate(total_weight=Sum('weightage'))['total_weight']
                # if total_weightage != 100:
                #     return JsonResponse({"error": "User is not a patient."}, status=status.HTTP_401_UNAUTHORIZED)
                    
                for student in Grade.objects.filter(component__in=group.components.all()).values_list('student', flat=True).distinct():
                    student_grades = []
                    for comp in group.components.all():
                        grade = Grade.objects.filter(student_id=student, component=comp).first()
                        if grade:
                            normalized = (grade.score / comp.max_score) * comp.weightage
                            student_grades.append(normalized)
                    if group.best_of_count and len(student_grades) >= group.best_of_count:
                        final = sum(sorted(student_grades, reverse=True)[:group.best_of_count])
                    else:
                        final = sum(student_grades)
                    student_scores.setdefault(student, 0)
                    student_scores[student] += final
    
            if student_scores:
                avg_score = round(sum(student_scores.values()) / len(student_scores), 2)
            else:
                avg_score = 'N/A'
    
            dashboard_data.append({
                'course_id': ca.course.id,
                'course': ca.course.name,
                'batch': ca.batch.name,
                'average_score': avg_score
            })
        return JsonResponse({
            'professor': {
                'professor_id' : professor.user.id,
                'name': professor.name,
                'department': professor.department
            },
            'dashboard_data': dashboard_data
        })

@api_view(['POST'])
def add_course(request):
    # print("Add course request data:", request.data)
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User is not authenticated."}, status=401)
    user = request.user
    if not hasattr(user, 'professor') or not user.is_professor:
        return JsonResponse({"error": "Only professors can add courses."}, status=403)

    course_name = request.data.get('course_name')
    batch_name = request.data.get('batch_name')

    if not course_name or not batch_name:
        # if not course_name:
        #     print(course_name)
        #     print(batch_name)
        #     print("Missing course name.")
        # if not batch_name:
        #     print("Missing batch name.")
        return JsonResponse({"error": "Missing course name or batch ID."}, status=400)

    try:
        print(f"Looking for batch with name: {batch_name}")
        # Assuming Batch has a unique name field
        batch = Batch.objects.get(name=batch_name)
    except Batch.DoesNotExist:
        return JsonResponse({"error": "Batch not found."}, status=404)

    # Create Course
    course = Course.objects.create(name=course_name)

    # Assign Course to Professor for selected Batch
    CourseAssignment.objects.create(course=course, professor=user.professor, batch=batch)

    return JsonResponse({"message": "Course created and assigned successfully."}, status=201)


class BatchListView(APIView):
    def get(self, request):
        batches = Batch.objects.all()
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)
    
class ProfessorLoginView(APIView):
    @csrf_exempt
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if not hasattr(user, 'professor') and not user.is_professor:
            return Response({"error": "User is not a professor."}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
    
class ProfessorRegisterView(APIView):
    @csrf_exempt
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        name = request.data.get("first_name") + " " + request.data.get("last_name", "")
        department = request.data.get("department")

        if not username or not password or not name or not department:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=password,
            is_professor=True
        )
        
        Professor.objects.create(
            user=user,
            name=name,
            department=department
        )

        return Response({"message": "Professor registered successfully."}, status=status.HTTP_201_CREATED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_evaluation_component(request):
    # print(request.method)
    # print(request.POST)
    # print(request.data.get('course_id'))
    # print(request.data.get('name'))
    # print(request.data.get('max_score'))
    # print(request.data.get('weightage'))
    # print(request.data.get('group_name'))
    course_id = request.data.get('course_id')
    print(course_id)
    component_name = request.data.get('name')
    print(component_name)
    max_score = request.data.get('max_score')
    print(max_score)
    weightage = request.data.get('weightage')
    print(weightage)
    group_name = request.data.get('group_name')
    print(group_name)
    professor_id = request.data.get('professor_id')
    print(professor_id)
    if not course_id and not component_name and not max_score and not weightage and not group_name:
        return JsonResponse({"error": "Missing required fields."}, status=400)
    try:
        prof=Professor.objects.get(user=professor_id)
        course_assignment = CourseAssignment.objects.get(course=course_id, professor=prof)

        group, created = EvaluationGroup.objects.get_or_create(
        course_assignment=course_assignment,
        name=group_name
        )
        if created:
            group.best_of_count = request.data.get('best_of_count', None)
            group.save()
        EvaluationComponent.objects.create(
        name=component_name,
        max_score=max_score,
        weightage=weightage,
        group=group,
        course_assignment=course_assignment
       )
        return JsonResponse({"message": "Evaluation component added successfully."}, status=201)

    except CourseAssignment.DoesNotExist:
        print('Course Assignment not found !')
        return JsonResponse({"error": "Course assignment not found."}, status=404)
    
    except Exception as e:
        print(f"Error adding evaluation component: {e}")
        return JsonResponse({"error": str(e)} ,status=500)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_evaluation_rule(request):
    course_id = request.data.get('course_id')
    professor_name = request.data.get('professor_name')
    group_name = request.data.get('group_name')
    best_of_count = request.data.get('best_of_count')

    if not course_id or not group_name or best_of_count is None:
        return JsonResponse({"error": "Missing required fields."}, status=400)

    try:
        professor = Professor.objects.get(name=professor_name)
        course_assignment = CourseAssignment.objects.get(course=course_id, professor=professor)
        group = EvaluationGroup.objects.get(course_assignment=course_assignment, name=group_name)
        group.best_of_count = best_of_count
        group.save()
        return JsonResponse({"message": "Evaluation rule set successfully."}, status=200)

    except CourseAssignment.DoesNotExist:
        return JsonResponse({"error": "Course assignment not found."}, status=404)
    
    except EvaluationGroup.DoesNotExist:
        return JsonResponse({"error": "Evaluation group not found."}, status=404)
    
    except Exception as e:
        print(f"Error setting evaluation rule: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    
    if request.method == "POST":
        csv_file = request.FILES.get("csv_file")
        print(csv_file)
        course_id = request.POST.get("course_id")
        print(course_id)
        professor_id = request.POST.get("professor_id")
        print(professor_id)

        if not csv_file:
            print("No CSV File received!")
            return JsonResponse({"error": "No CSV file uploaded"}, status=400)

        try:
            df = pd.read_csv(csv_file)
        except Exception as e:
            return JsonResponse({"error": f"Failed to read CSV: {str(e)}"}, status=400)

        if 'Roll Number' not in df.columns:
            return JsonResponse({"error": "'roll_number' column is required in CSV"}, status=400)

        try:
            course_id = Course.objects.get(id = course_id)
            print(course_id)
            professor_id = Professor.objects.get(user=professor_id)
            print(professor_id)

            course_assignment = CourseAssignment.objects.get(course_id=course_id, professor_id=professor_id)
            print(course_assignment)
        except CourseAssignment.DoesNotExist:
            return JsonResponse({"error": "Course assignment not found"}, status=404)

        # Get all components for this course
        components = EvaluationComponent.objects.filter(course_assignment=course_assignment)
        component_map = {comp.name.strip(): comp for comp in components}
        print(component_map)

        # Validate all columns except roll_number
        csv_components = [col.strip() for col in df.columns if col != 'Roll Number' and col != 'Batch']
        missing = [comp for comp in csv_components if comp not in component_map]
        print(missing)

        if missing:
            return JsonResponse({
                "error": "Missing evaluation components in database",
                "missing": missing
            }, status=400)

        created_count = 0
        for _, row in df.iterrows():
            roll_number = str(row['Roll Number']).strip()
            try:
                student = Student.objects.get(roll_number=roll_number)
            except Student.DoesNotExist:
                print('Student Not Found!')
                continue

            for col in csv_components:
                if pd.isna(row[col]):
                    continue
                score = row[col]
                print(score)
                component = component_map.get(col)
                if component:
                    Grade.objects.update_or_create(
                        student=student,
                        component=component,
                        defaults={'score': float(score)}
                    )
                    created_count += 1

        return JsonResponse({"message": f"Successfully uploaded {created_count} grades."})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_evaluation_structure(request, course_id):
    # course_id = request.data.get('course_id')
    print(course_id)
    assignments = CourseAssignment.objects.filter(course=course_id)
    if not assignments.exists():
        print("No Assignments Found!")
        return Response({'error': 'No assignments found for this course'}, status=400)

    structure = []
    for assignment in assignments:
        groups = EvaluationGroup.objects.filter(course_assignment=assignment)
        for group in groups:
            components = EvaluationComponent.objects.filter(group=group)
            structure.append({
                'batch': assignment.batch.name,
                'group': group.name,
                'components': [
                    {'id': c.id ,'name': c.name, 'weightage': c.weightage, 'max_score': c.max_score}
                    for c in components
                ]
            })

    return Response(structure)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_component_csv(request):
    comp_id = request.POST.get('component_id')
    csv_file = request.FILES.get('csv_file')
    # print(request.FILES['csv_file'])
    prof_id = request.POST.get('professor_id')
    course_id = request.POST.get('course_id')
    batch_id = Batch.objects.get(name=request.POST.get('batch_id'))

    # print("Component ID: ",comp_id)
    # print("Professor ID: ",prof_id)
    # print("Course ID: ",course_id)
    # print("Batch ID: ",batch_id)
    # print("Uploaded CSV: ",csv_file)
    
    try:
        prof_id = Professor.objects.get(user = prof_id)
        course_id = Course.objects.get(id=course_id)
        batch_id = Batch.objects.get(name=batch_id)
        ca = CourseAssignment.objects.get(professor=prof_id, course=course_id, batch=batch_id)
        print(ca)
    
        df = pd.read_csv(csv_file)
        print(df)
        print(df.columns)
        component = EvaluationComponent.objects.get(id=comp_id)
    
        if not component:
            return JsonResponse({'error' : 'Component Does Not Exists! Make sure you have created one.'})
        
        if df.columns[1] != component.name:
            return JsonResponse({'error' : 'Component Names not matched! Please choose the correct component.'})
        
        for _, row in df.iterrows():
            print(_, row)
            try:
                print("Inside TRY Block: ",row.iloc[1])
                student =   Student.objects.get(roll_number=row.iloc[0])
                print(student)
                if not student:
                    return JsonResponse({'error' : 'Student Does Not Exist !'}, status=400)
                Grade.objects.update_or_create(
                    student=student, component=component,
                    defaults={'score': row.iloc[1]}
                )
            
            except Exception as e:
                print(e)
                print(f"Skipping row due to error: {e}")
                continue
    except Exception as e:
        print(e)
        if str(e) == 'undefined' or e == 'undefined':
            return Response({'error' : 'Component Mismatched!'})
        return Response({'error': str(e)})
    
    return JsonResponse({'message': 'Component CSV uploaded'}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_grades(request, course_id, prof_id, batch_id):
    print(course_id)
    print(prof_id)
    print(batch_id)
    course_id = Course.objects.get(id=course_id)
    prof_id = Professor.objects.get(user=prof_id)
    batch_id = Batch.objects.get(name=batch_id)
    ca = CourseAssignment.objects.get(course=course_id, professor=prof_id, batch=batch_id)
    print(ca)
    components = EvaluationComponent.objects.filter(course_assignment=ca)
    print(components)
    component_names = [comp.name for comp in components]
    
    students = Student.objects.filter(batch_id=batch_id).distinct()
    
    grade_data = []
    for student in students:
        grades = Grade.objects.filter(student=student, component__in=components)
        grade_row = {
            "roll_number": student.roll_number,
            "name": student.user.get_full_name(),
        }
        for comp in components:
            score = grades.filter(component=comp).first()
            grade_row[comp.name] = score.score if score else "-"
        grade_data.append(grade_row)

    print(grade_data)
    
    return Response({
        "components": component_names,
        "grades": grade_data
    })

class MissingMarksView(APIView):
    def get(self, request, course_id, batch_id, component_id):
        course = get_object_or_404(Course, id=course_id)
        batch = get_object_or_404(Batch, id=batch_id)
        component = get_object_or_404(EvaluationComponent, id=component_id)

        students = Student.objects.filter(batch=batch)

        missing_students = []
        for student in students:
            # if Grade.objects.filter(student=student, component=component).exists():
                missing_students.append({
                    "id": student.id,
                    "roll_number": student.roll_number,
                    "name": student.user.get_full_name() or student.user.username
                })
        return Response(missing_students)
    
class ManualMarkEntryView(APIView):
    def post(self, request):
        student_id = request.data.get("student_id")
        print(student_id)
        component_id = request.data.get("component_id")
        print(component_id)
        score = request.data.get("score")
        print(score)

        if not student_id or not component_id or score is None:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        student = get_object_or_404(Student, id=student_id)
        component = get_object_or_404(EvaluationComponent, id=component_id)

        # Either update or create grade
        grade, created = Grade.objects.update_or_create(
            student=student,
            component=component,
            defaults={"score": score}
        )

        return Response({
            "message": "Grade saved successfully",
            "created": created
        }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_course(request, course_id):
    prof_id = Professor.objects.get(user=User.objects.get(id=request.data.get("professor_id")))
    course_id = Course.objects.get(id=course_id).id
    batch_id = Batch.objects.get(name=request.data.get("batch_id"))

    try:
        ca = CourseAssignment.objects.get(course=course_id, professor=prof_id, batch=batch_id)

        course = Course.objects.get(id=course_id)

        components = EvaluationComponent.objects.filter(course_assignment=ca)
        Grade.objects.filter(component__in=components).delete()

        EvaluationComponent.objects.filter(course_assignment=ca).delete()
        EvaluationGroup.objects.filter(course_assignment=ca).delete()

        ca.delete()

        course.delete()
        return Response({'message': 'Course and all related grades deleted successfully'}, status=status.HTTP_200_OK)
    except CourseAssignment.DoesNotExist:
        return Response({'error': 'Course assignment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.parsers import MultiPartParser

class BulkStudentRegisterView(APIView):
    parser_classes = [MultiPartParser]

    @csrf_exempt
    def post(self, request):
        csv_file = request.FILES.get('file')
        print(csv_file)
        if not csv_file:
            return Response({"error": "No CSV file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(csv_file)
            print(df)
        except Exception as e:
            print('Failed to read CSV!')
            return Response({"error": f"Failed to read CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        for _, row in df.iterrows():
            try:

                user = User.objects.create_user(
                    username=row.get("username"),
                    password=row.get("password"),
                    email=row.get("email"),
                    first_name=row.get("first_name", ""),
                    last_name=row.get("last_name", ""),
                    is_student=True,
                    is_professor=False,
                )
                print(user)
                if user:
                    branch = Branch.objects.filter(name=row.get('branch')).exists()
                    if not branch:
                        errors.append(f"Branch '{row.get('branch')}' does not exist for username '{row.get('username')}'")
                        continue
                    batch = Batch.objects.filter(name=row.get('batch')).exists()
                    if not batch:
                        errors.append(f"Batch '{row.get('batch')}' does not exist for username '{row.get('username')}'")
                        continue
                    Student.objects.create(
                        user=user, 
                        roll_number=row.get("roll_number", ""),
                        branch=Branch.objects.get(name=row.get('branch')),
                        year=row.get("year", 1),
                        batch=Batch.objects.get(name=row.get("batch", 1))              
                    )
            except Exception as e:
                errors.append(f"Failed to register student '{row.get('username')}': {str(e)}")

        if errors:
            print("There are some errors: ", errors)
            return Response({"message": "Bulk registration completed with errors", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Bulk registration completed successfully"}, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def download_marks_csv(request):
    """
    POST body: {
      course_id, batch_id, prof_id, fields: ["roll_number", ...], roll_order: [roll1, roll2, ...] (optional)
    }
    Returns: CSV file as attachment
    """
    course_id = request.data.get("course_id")
    batch_id = request.data.get("batch_id")
    prof_id = request.data.get("prof_id")
    fields = request.data.get("fields")
    roll_order = request.data.get("roll_order", None)
    if not (course_id and batch_id and prof_id and fields):
        return Response({"error": "Missing required fields."}, status=400)
    try:
        course = Course.objects.get(id=course_id)
        batch = Batch.objects.get(name=batch_id)
        prof = Professor.objects.get(user=prof_id)
        ca = CourseAssignment.objects.get(course=course, professor=prof, batch=batch)
        components = EvaluationComponent.objects.filter(course_assignment=ca)
        students = Student.objects.filter(batch=batch).distinct()
        # Build grade data
        grade_data = []
        for student in students:
            grades = Grade.objects.filter(student=student, component__in=components)
            row = {
                "roll_number": student.roll_number,
                "name": student.user.get_full_name(),
            }
            for comp in components:
                row[comp.name] = grades.filter(component=comp).first().score if grades.filter(component=comp).exists() else "-"
            grade_data.append(row)
        # Only include selected fields
        filtered = [ {f: row.get(f, "") for f in fields} for row in grade_data ]
        # If roll_order is provided, reorder
        if roll_order:
            row_map = {row['roll_number']: row for row in filtered}
            rows = [row_map[rn] for rn in roll_order if rn in row_map]
            # Add any missing at end
            missing = [row for row in filtered if row['roll_number'] not in roll_order]
            rows += missing
        else:
            rows = filtered
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_marks.csv"'
        writer = csv.DictWriter(response, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return response
    except Exception as e:
        return Response({"error": str(e)}, status=500)