from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    is_student = models.BooleanField(default=False, help_text="Designates whether this user is a student.")
    is_professor = models.BooleanField(default=False, help_text="Designates whether this user is a professor.")

class Professor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} - {self.department}"

class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    roll_number = models.CharField(max_length=20, unique=True)
    branch = models.ForeignKey('Branch', on_delete=models.CASCADE, help_text="e.g. Computer Science, Electronics")
    year = models.PositiveIntegerField(help_text="Year of study, e.g. 1 for first year")
    batch = models.ForeignKey('Batch', on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username

class Branch(models.Model): 
    name = models.CharField(max_length=100, unique=True, help_text="e.g. Computer Science, Electronics")

    def __str__(self):
        return self.name

class Batch(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="e.g. A1'CSE-24, B2'CSE-23")

    def __str__(self):
        return f"{self.name}"

class Course(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class CourseAssignment(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.course.name} - {self.batch.name} by {self.professor.name}"

class EvaluationGroup(models.Model):
    """
    Groups components like quizzes or assignments. Each group can have a best_of_count rule.
    """
    course_assignment = models.ForeignKey(CourseAssignment, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="e.g. Quizzes, Assignments")
    best_of_count = models.PositiveIntegerField(null=True, blank=True, help_text="Consider best N scores")

    def __str__(self):
        return f"{self.name} ({self.course_assignment})"

class EvaluationComponent(models.Model):
    group = models.ForeignKey(EvaluationGroup, on_delete=models.CASCADE, related_name='components')
    name = models.CharField(max_length=100)
    weightage = models.FloatField(help_text="Weightage towards total score out of 100")
    max_score = models.FloatField(help_text="Maximum marks for this component")
    course_assignment = models.ForeignKey(CourseAssignment, on_delete=models.CASCADE, related_name='course_assignment', null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.group.course_assignment.course.name})"

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    component = models.ForeignKey(EvaluationComponent, on_delete=models.CASCADE)
    score = models.FloatField()

    def __str__(self):
        return f"{self.student.user.username} - {self.component.name}: {self.score}"
