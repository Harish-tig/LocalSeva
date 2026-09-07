from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from local_user.models import Profile
from local_user.constants import WESTERN_LINE_LOCATIONS, normalize_location, is_valid_location

User = get_user_model()


class WesternLineLocationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Regular customer user
        self.customer = User.objects.create_user(
            username="test_customer",
            email="test_customer@example.com",
            password="Password@123"
        )

        # Service provider user
        self.provider_user = User.objects.create_user(
            username="test_provider",
            email="test_provider@example.com",
            password="Password@123",
            is_service_provider=True
        )
        provider_profile = self.provider_user.profile
        provider_profile.role = "SERVICE"
        provider_profile.location = "Borivali"
        provider_profile.service_locations = ["Borivali", "Kandivali"]
        provider_profile.experience_years = 5
        provider_profile.pricing_type = "FIXED"
        provider_profile.base_price = 500
        provider_profile.categories = ["PLUMBING"]
        provider_profile.save()

    def test_constants_helpers(self):
        """Test normalization and validation helpers"""
        self.assertEqual(normalize_location("borivali"), "Borivali")
        self.assertEqual(normalize_location("Bhayender"), "Bhayandar")
        self.assertEqual(normalize_location("bhayander"), "Bhayandar")
        self.assertEqual(normalize_location("Andheri West"), "Andheri")
        self.assertIsNone(normalize_location("Delhi"))
        self.assertIsNone(normalize_location("Bangalore"))
        self.assertTrue(is_valid_location("Malad"))
        self.assertFalse(is_valid_location("New York"))

    def test_get_supported_locations_endpoint(self):
        """GET /locations/ returns complete Western Line list"""
        url = reverse("locations")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("locations", response.data)
        self.assertEqual(len(response.data["locations"]), len(WESTERN_LINE_LOCATIONS))
        self.assertIn("Borivali", response.data["locations"])
        self.assertIn("Bhayandar", response.data["locations"])
        self.assertIn("Dadar", response.data["locations"])

    def test_user_valid_location_update(self):
        """Normal user can set a valid Western Line location"""
        self.client.force_authenticate(user=self.customer)
        url = reverse("profile")
        response = self.client.put(url, {"location": "Kandivali"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["location"], "Kandivali")

        self.customer.profile.refresh_from_db()
        self.assertEqual(self.customer.profile.location, "Kandivali")

    def test_user_invalid_location_rejected(self):
        """Backend must reject arbitrary/unsupported locations with 400"""
        self.client.force_authenticate(user=self.customer)
        url = reverse("profile")
        response = self.client.put(url, {"location": "Delhi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("location", response.data)

        # Profile location in DB should remain unchanged
        self.customer.profile.refresh_from_db()
        self.assertNotEqual(self.customer.profile.location, "Delhi")

    def test_case_insensitive_and_alias_normalization(self):
        """Lowercase and legacy alias like 'bhayender' are normalized to canonical name"""
        self.client.force_authenticate(user=self.customer)
        url = reverse("profile")

        # Test lowercase
        response = self.client.put(url, {"location": "malad"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["location"], "Malad")

        # Test colloquial alias 'bhayender' -> 'Bhayandar'
        response = self.client.put(url, {"location": "bhayender"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["location"], "Bhayandar")

    def test_provider_service_locations_validation(self):
        """Provider can only specify Western Line locations in service_locations"""
        self.client.force_authenticate(user=self.provider_user)
        url = reverse("profile")

        # Valid service locations list
        valid_payload = {
            "service_locations": ["Borivali", "Kandivali", "Malad"]
        }
        response = self.client.put(url, valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["service_locations"], ["Borivali", "Kandivali", "Malad"])

        # Invalid location inside service_locations
        invalid_payload = {
            "service_locations": ["Borivali", "Pune", "Thane"]
        }
        response = self.client.put(url, invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_locations", response.data)

    def test_providers_filtered_by_location(self):
        """Provider discovery endpoint returns providers matching location"""
        url = reverse("providers")
        response = self.client.get(url, {"location": "Borivali"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        matching = [p for p in response.data if p["username"] == self.provider_user.username]
        self.assertTrue(len(matching) >= 1)
