from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import UploadedDocument

class UploadedDocumentForm(forms.ModelForm):
    class Meta:
        model = UploadedDocument
        fields = ['title', 'file']

