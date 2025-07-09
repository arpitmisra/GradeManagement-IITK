from django.urls import path
from .views import professor_dashboard,ProfessorLoginView, add_course, BatchListView, ProfessorRegisterView, add_evaluation_component, set_evaluation_rule, upload_csv, get_evaluation_structure, upload_component_csv, get_course_grades, MissingMarksView, ManualMarkEntryView, BulkStudentRegisterView, delete_course, download_marks_csv

urlpatterns = [
    path('dashboard/', professor_dashboard.as_view(), name='professor_dashboard'),
    path('login/', ProfessorLoginView.as_view(), name='professor_login'),
    path('register/', ProfessorRegisterView.as_view(), name='professor_register'),
    path('batches/', BatchListView.as_view()),  # returns all batch names and IDs
    path('add_course/', add_course, name='add_course'),
    path('add-evaluation-component/', add_evaluation_component, name='add_evaluation_component'),
    path('set-evaluation-rule/', set_evaluation_rule, name='set_evaluation_rule'),
    path('upload-csv/', upload_csv, name='upload_csv'),
    path('evaluation-structure/<int:course_id>/', get_evaluation_structure),
    path('upload-component-csv/' , upload_component_csv, name='component csv upload'),
    path('course-grades/<int:course_id>/<int:prof_id>/<str:batch_id>', get_course_grades, name='table view'),
    path('manual-entry/missing/<course_id>/<batch_id>/<component_id>/', MissingMarksView.as_view(), name='missing-marks'),
    path('manual-entry/', ManualMarkEntryView.as_view(), name='manual-entry'),
    path('bulk_upload/', BulkStudentRegisterView.as_view(), name='bulk-student-registration'),
    path('delete_course/<int:course_id>/', delete_course, name='delete_course'),
    path('download-marks-csv/', download_marks_csv, name='download_marks_csv'),
]
