from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class GradeLevel(models.Model):
    name = models.CharField(max_length=20)

    def __str__(self):
        return self.name
    
class SkillCategory(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name

class Profile(models.Model):
    ROLE_TEACHER = 'teacher'
    ROLE_STUDENT = 'student'
    ROLE_PARENT = 'parent'
    ROLE_ADMIN = 'admin'   

    ROLE_CHOICES = [
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_STUDENT, 'Student'),
        (ROLE_PARENT, 'Parent'),
        (ROLE_ADMIN, 'Admin'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_STUDENT)

    email_verified = models.BooleanField(default=False)
    teacher_approved = models.BooleanField(default=False)
    
    # Student specific
    grade = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # Teacher specific
    class_size = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # Parent specific
    relationship = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
    
class ParentLink(models.Model):
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="children_links",
        limit_choices_to={"profile__role": "parent"},
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="parent_links",
        limit_choices_to={"profile__role": "student"},
    )
    relationship = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ("parent", "student")
        
    def __str__(self):
        return f"{self.parent.username} -> {self.student.username}"

class Classroom(models.Model):
    name = models.CharField(max_length=255)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classrooms')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Topic(models.Model):
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
    
class UploadedDocument(models.Model):
    PROGRAM_STANDARD = 'standard'
    PROGRAM_SHSAT = 'shsat'
    PROGRAM_SAT = 'sat'
    PROGRAM_CHOICES = [
        (PROGRAM_STANDARD, 'Standard Reading'),
        (PROGRAM_SHSAT, 'SHSAT'),
        (PROGRAM_SAT, 'SAT Reading & Writing'),
    ]

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Easy'),
        (DIFFICULTY_MEDIUM, 'Medium'),
        (DIFFICULTY_HARD, 'Hard'),
    ]

    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    parsed_text = models.TextField(blank=True, null=True)
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, null=True, blank=True)
    skill_category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, null=True, blank=True)
    program = models.CharField(
        max_length=20, choices=PROGRAM_CHOICES, default=PROGRAM_STANDARD, blank=True
    )
    difficulty = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, blank=True
    )
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True)
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.title

class QuizQuestion(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    explanation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document.title} - {self.question_text[:50]}..."

class QuizAnswer(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='answers')
    choice_letter = models.CharField(max_length=1)  # A, B, C, D
    choice_text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.question.question_text[:30]} - {self.choice_letter}"

class QuizResponse(models.Model):
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=100, blank=True, null=True)  # For anonymous users
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0, help_text="Time taken in seconds")

    def __str__(self):
        return f"{self.document.title} - {self.score}/{self.total_questions}"

class UserAnswer(models.Model):
    response = models.ForeignKey(QuizResponse, on_delete=models.CASCADE, related_name='user_answers')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_answer = models.ForeignKey(QuizAnswer, on_delete=models.CASCADE)
    is_correct = models.BooleanField()

    def __str__(self):
        return f"{self.response.user_name or 'Anonymous'} - {self.question.question_text[:30]}"





