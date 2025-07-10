from django.db import models
from django.contrib.auth.models import User

class GradeLevel(models.Model):
    name = models.CharField(max_length=20)

    def __str__(self):
        return self.name
    
class SkillCategory(models.Model):
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name

class Passage(models.Model): 
    title = models.CharField(max_length=255) #passage title
    text = models.TextField() #the text
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, default=1) 
    skill_category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, default=1)  # we'll create ID 1

    def __str__(self):
        return self.title #return title
    
class Question(models.Model):
    passage = models.ForeignKey(Passage, on_delete=models.CASCADE,)
    question_text = models.TextField()
    correct_choice = models.CharField(max_length=1)
    explanation =  models.TextField()
    
    def __str__(self):
        return self.question_text

class AnswerChoice(models.Model):
    question =  models.ForeignKey(Question, on_delete=models.CASCADE,)
    choice_letter = models.CharField(max_length=1)
    choice_text = models.TextField()

    def __str__(self):
        return self.choice_letter
    
class UploadedDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    parsed_text = models.TextField(blank=True, null=True)
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, null=True, blank=True)
    skill_category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, null=True, blank=True)

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

    def __str__(self):
        return f"{self.document.title} - {self.score}/{self.total_questions}"

class UserAnswer(models.Model):
    response = models.ForeignKey(QuizResponse, on_delete=models.CASCADE, related_name='user_answers')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_answer = models.ForeignKey(QuizAnswer, on_delete=models.CASCADE)
    is_correct = models.BooleanField()

    def __str__(self):
        return f"{self.response.user_name or 'Anonymous'} - {self.question.question_text[:30]}"





