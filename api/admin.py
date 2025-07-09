from django.contrib import admin
from .models import *

admin.site.register(Professor)
admin.site.register(Batch)
admin.site.register(Course)
admin.site.register(CourseAssignment)
admin.site.register(Student)
admin.site.register(EvaluationComponent)
admin.site.register(EvaluationGroup)
admin.site.register(Grade)
admin.site.register(Branch)
admin.site.register(User)