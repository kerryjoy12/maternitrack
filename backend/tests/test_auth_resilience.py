import pytest
from django.contrib.auth import authenticate, get_user_model

@pytest.mark.django_db
def test_case_insensitive_and_domain_alias_authentication():
    User = get_user_model()
    
    # Create test superuser
    user = User.objects.create_superuser(
        email='neville@itierionursinghome.co.ke',
        full_name='Neville Admin',
        password='#Itierio@254'
    )
    
    # Test case variations
    assert authenticate(username='neville@itierionursinghome.co.ke', password='#Itierio@254') == user
    assert authenticate(username='Neville@itierionursinghome.co.ke', password='#Itierio@254') == user
    assert authenticate(username='NEVILLE@ITIERIONURSINGHOME.CO.KE', password='#Itierio@254') == user
    
    # Test typo and domain variations
    assert authenticate(username='neville@itieronursinghome.co.ke', password='#Itierio@254') == user
    assert authenticate(username='neville@itierionursing.co.ke', password='#Itierio@254') == user
    assert authenticate(username='neville@itieronursing.co.ke', password='#Itierio@254') == user
    assert authenticate(username='neville@gmail.com', password='#Itierio@254') == user
    assert authenticate(username='admin', password='#Itierio@254') == user

@pytest.mark.django_db
def test_other_staff_accounts():
    User = get_user_model()
    agatha = User.objects.create_user(
        email='agatha@itierionursinghome.co.ke',
        full_name='Agatha Nurse',
        role='NURSE',
        password='AgathaPassword123!'
    )
    
    assert authenticate(username='agatha@itierionursinghome.co.ke', password='AgathaPassword123!') == agatha
    assert authenticate(username='Agatha@itieronursinghome.co.ke', password='AgathaPassword123!') == agatha
    assert authenticate(username='agatha@itierionursing.co.ke', password='AgathaPassword123!') == agatha
