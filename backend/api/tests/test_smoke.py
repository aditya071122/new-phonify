from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    def test_health_endpoint_is_public(self):
        response = self.client.get(reverse('health-check'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {'status': 'ok'})


class AuthTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='ci_admin',
            password='strong-password-123',
            email='ci@example.com',
        )

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse('auth-login'),
            {'username': self.user.username, 'password': 'wrong-password'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()['detail'], 'Invalid credentials.')

    def test_login_returns_token_for_valid_credentials(self):
        response = self.client.post(
            reverse('auth-login'),
            {'username': self.user.username, 'password': 'strong-password-123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.json())
        self.assertEqual(response.json()['user']['role'], 'Staff')


class PermissionSmokeTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='staff_user',
            password='strong-password-123',
        )
        self.token = Token.objects.create(user=self.user)

    def test_customers_requires_authentication(self):
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customers_list_is_available_with_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/customers/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)
