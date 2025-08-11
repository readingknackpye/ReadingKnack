from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import UploadedDocument

class UploadedDocumentForm(forms.ModelForm):
    class Meta:
        model = UploadedDocument
        fields = ['title', 'file']

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text='Required. Enter a valid email address.')
    first_name = forms.CharField(max_length=30, required=True, help_text='Required.')
    last_name = forms.CharField(max_length=30, required=True, help_text='Required.')
    
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'password1', 'password2')
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email address is already in use.')
        return email
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make fields required and add Bootstrap classes
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})
            if field.required:
                field.widget.attrs.update({'required': 'required'})