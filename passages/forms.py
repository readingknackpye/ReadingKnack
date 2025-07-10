from django import forms
from .models import UploadedDocument

class UploadedDocumentForm(forms.ModelForm):
    class Meta:
        model = UploadedDocument
        fields = ['title', 'file']