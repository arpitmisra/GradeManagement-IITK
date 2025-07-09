from django import forms
from django.contrib.auth.models import User
from api.models import Professor
class ProfessorRegistrationForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
    name = forms.CharField()
    department = forms.CharField()

    def save(self):
        user = User.objects.create_user(
            username=self.cleaned_data['username'],
            password=self.cleaned_data['password']
        )
        professor = Professor.objects.create(
            user=user,
            name=self.cleaned_data['name'],
            department=self.cleaned_data['department']
        )
        return user
