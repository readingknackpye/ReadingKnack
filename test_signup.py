#!/usr/bin/env python3
"""
Test script to verify signup functionality
"""
import os
import sys
import django
from django.test import Client
from django.contrib.auth.models import User

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_signup():
    """Test the signup functionality"""
    client = Client()
    
    print("Testing Signup Functionality...")
    print("-" * 40)
    
    # Test 1: Get CSRF token
    print("1. Testing CSRF token retrieval...")
    response = client.get('/auth/register/')
    if response.status_code == 200:
        print("✅ CSRF token endpoint accessible")
    else:
        print(f"❌ CSRF token endpoint failed: {response.status_code}")
        return False
    
    # Test 2: Test user registration
    print("2. Testing user registration...")
    test_user_data = {
        'username': 'testuser123',
        'password': 'testpass123',
        'password2': 'testpass123',
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    # Get CSRF token first
    csrf_response = client.get('/auth/register/')
    csrf_token = csrf_response.cookies.get('csrftoken')
    
    if csrf_token:
        # Test registration with CSRF token
        response = client.post('/auth/register/', 
                             data=test_user_data,
                             HTTP_X_CSRFTOKEN=csrf_token.value)
        
        if response.status_code == 201:
            print("✅ User registration successful!")
            
            # Verify user was created in database
            try:
                user = User.objects.get(username='testuser123')
                print(f"✅ User created in database: {user.username} ({user.email})")
                
                # Clean up test user
                user.delete()
                print("✅ Test user cleaned up")
                return True
                
            except User.DoesNotExist:
                print("❌ User not found in database after registration")
                return False
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
    else:
        print("❌ CSRF token not found")
        return False

def test_database_connection():
    """Test database connection"""
    print("\nTesting Database Connection...")
    print("-" * 40)
    
    try:
        # Try to create a test user
        test_user = User.objects.create_user(
            username='db_test_user',
            email='db_test@example.com',
            password='testpass123'
        )
        print("✅ Database write test successful")
        
        # Try to read the user
        retrieved_user = User.objects.get(username='db_test_user')
        print(f"✅ Database read test successful: {retrieved_user.username}")
        
        # Clean up
        test_user.delete()
        print("✅ Database cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    print("Signup System Test Suite")
    print("=" * 50)
    
    # Test database connection
    db_success = test_database_connection()
    
    if db_success:
        # Test signup functionality
        signup_success = test_signup()
        
        if signup_success:
            print("\n🎉 All tests passed! Signup system is working correctly.")
        else:
            print("\n❌ Signup tests failed. Check the implementation.")
    else:
        print("\n❌ Database tests failed. Check your Supabase connection.")
    
    print("\nTest completed.") 