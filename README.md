# Service Provider Platform API Documentation

A comprehensive REST API for a service provider booking platform built with Django REST Framework.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Models](#models)

---

## Overview

This API enables users to find and book service providers across various categories. Service providers can create profiles, manage bookings, and receive reviews. Regular users can browse providers, make bookings, and leave reviews.

## Features

- **User Management**: Registration, authentication, and profile management
- **Service Provider Profiles**: Detailed profiles with categories, pricing, and availability
- **Booking System**: Create, manage, and track service bookings
- **Review System**: Rate and review completed services
- **Search & Filter**: Find providers by category, location, pricing, and rating
- **Role-Based Access**: Different permissions for users and service providers

## Technology Stack

- **Backend**: Django 4.x, Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL/MySQL/SQLite
- **File Storage**: Django file storage for avatars and images

## Getting Started

### Prerequisites
```bash
Python 3.8+
pip
virtualenv (recommended)
```

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-directory>
```

2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install django djangorestframework djangorestframework-simplejwt django-filter Pillow
```

4. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create superuser
```bash
python manage.py createsuperuser
```

6. Run development server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

---

## Authentication

This API uses JWT (JSON Web Token) authentication. Most endpoints require authentication.

### Obtaining Tokens

**Request:**
```http
POST /api/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Using Tokens

Include the access token in the Authorization header for protected endpoints:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Token Refresh

When the access token expires, use the refresh token to obtain a new one:
```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/
```

---

## 1. Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/register/`  
**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!"
}
```

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 1,
  "username": "john_doe"
}
```

**Error Response (400 Bad Request):**
```json
{
  "username": ["A user with that username already exists."],
  "email": ["user with this email already exists."],
  "password": ["Password fields didn't match."]
}
```

---

### Login
Authenticate and obtain JWT tokens.

**Endpoint:** `POST /api/login/`  
**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 1,
  "username": "john_doe",
  "is_service_provider": false
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 2. Profile Endpoints

### Get User Profile
Retrieve current user's profile information.

**Endpoint:** `GET /api/profile/`  
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "http://localhost:8000/media/profiles/avatar.jpg",
  "role": "USER",
  "bio": "Love finding great service providers!",
  "phone": "+1234567890",
  "location": "New York, NY",
  "created_at": "2024-01-15T10:30:00Z",
  "is_service_provider": false
}
```

---

### Update User Profile
Update current user's profile information.

**Endpoint:** `PUT /api/profile/`  
**Authentication:** Required

**Request Body (all fields optional):**
```json
{
  "bio": "Updated bio text",
  "phone": "+1234567890",
  "location": "Los Angeles, CA"
}
```

**For avatar upload, use multipart/form-data:**
```
Content-Type: multipart/form-data

avatar: [image file]
bio: "Updated bio text"
phone: "+1234567890"
location: "Los Angeles, CA"
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "http://localhost:8000/media/profiles/new_avatar.jpg",
  "role": "USER",
  "bio": "Updated bio text",
  "phone": "+1234567890",
  "location": "Los Angeles, CA",
  "created_at": "2024-01-15T10:30:00Z",
  "is_service_provider": false
}
```

---

### Become Service Provider
Convert user account to service provider status.

**Endpoint:** `POST /api/profile/become-provider/`  
**Authentication:** Required

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "message": "Profile updated to service provider",
  "is_service_provider": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "You are already a service provider"
}
```

---

## 3. Service Provider Profile Endpoints

### Get Service Provider Profile
Retrieve current user's service provider profile.

**Endpoint:** `GET /api/profile/service-provider/`  
**Authentication:** Required (must be service provider)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "user": 5,
  "username": "jane_plumber",
  "email": "jane@example.com",
  "profile": {
    "id": 5,
    "username": "jane_plumber",
    "email": "jane@example.com",
    "avatar": "http://localhost:8000/media/profiles/jane.jpg",
    "role": "SERVICE",
    "bio": "Professional plumber with 10 years experience",
    "phone": "+1987654321",
    "location": "Chicago, IL",
    "created_at": "2024-01-10T08:00:00Z",
    "is_service_provider": true
  },
  "categories": [
    {
      "id": 1,
      "name": "Plumbing",
      "description": "Plumbing services",
      "icon": "wrench"
    },
    {
      "id": 3,
      "name": "Home Repair",
      "description": "General home repairs",
      "icon": "tools"
    }
  ],
  "description": "Certified plumber specializing in residential and commercial plumbing",
  "experience_years": 10,
  "pricing_type": "HOURLY",
  "base_price": "50.00",
  "hourly_rate": "75.00",
  "is_available": true,
  "rating": 4.8,
  "total_reviews": 47,
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-20T14:30:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Service provider profile not found"
}
```

---

### Create Service Provider Profile
Create a new service provider profile.

**Endpoint:** `POST /api/profile/service-provider/`  
**Authentication:** Required (user must have service provider status)

**Request Body:**
```json
{
  "category_ids": [1, 3],
  "description": "Certified plumber specializing in residential and commercial plumbing",
  "experience_years": 10,
  "pricing_type": "HOURLY",
  "base_price": "50.00",
  "hourly_rate": "75.00",
  "is_available": true
}
```

**Field Descriptions:**
- `category_ids`: Array of category IDs (required)
- `description`: Detailed description of services (required)
- `experience_years`: Years of experience (required, >= 0)
- `pricing_type`: One of: FIXED, HOURLY, PROJECT, FLEXIBLE (required)
- `base_price`: Base service price (required)
- `hourly_rate`: Hourly rate if applicable (optional)
- `is_available`: Availability status (optional, default: true)

**Success Response (201 Created):**
```json
{
  "id": 1,
  "user": 5,
  "username": "jane_plumber",
  "email": "jane@example.com",
  "profile": { "..." },
  "categories": [ "..." ],
  "description": "Certified plumber specializing in residential and commercial plumbing",
  "experience_years": 10,
  "pricing_type": "HOURLY",
  "base_price": "50.00",
  "hourly_rate": "75.00",
  "is_available": true,
  "rating": 0.0,
  "total_reviews": 0,
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "User is not a service provider"
}
```
or
```json
{
  "error": "Service provider profile already exists"
}
```

---

### Update Service Provider Profile
Update existing service provider profile.

**Endpoint:** `PUT /api/profile/service-provider/`  
**Authentication:** Required (must be service provider)

**Request Body (all fields optional):**
```json
{
  "category_ids": [1, 3, 5],
  "description": "Updated description",
  "experience_years": 12,
  "pricing_type": "FIXED",
  "base_price": "60.00",
  "hourly_rate": "85.00",
  "is_available": false
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "user": 5,
  "username": "jane_plumber",
  "email": "jane@example.com",
  "profile": { "..." },
  "categories": [ "..." ],
  "description": "Updated description",
  "experience_years": 12,
  "pricing_type": "FIXED",
  "base_price": "60.00",
  "hourly_rate": "85.00",
  "is_available": false,
  "rating": 4.8,
  "total_reviews": 47,
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-21T11:00:00Z"
}
```

---

## 4. Service Category Endpoints

### List Service Categories
Retrieve all available service categories.

**Endpoint:** `GET /api/categories/`  
**Authentication:** Not required

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Plumbing",
    "description": "Professional plumbing services for homes and businesses",
    "icon": "wrench"
  },
  {
    "id": 2,
    "name": "Electrical",
    "description": "Licensed electricians for all electrical needs",
    "icon": "bolt"
  },
  {
    "id": 3,
    "name": "Home Repair",
    "description": "General home maintenance and repair services",
    "icon": "tools"
  },
  {
    "id": 4,
    "name": "Cleaning",
    "description": "Professional cleaning services",
    "icon": "sparkles"
  }
]
```

---

## 5. Service Provider Listing Endpoints

### List Service Providers
Get a list of service providers with filtering and search capabilities.

**Endpoint:** `GET /api/providers/`  
**Authentication:** Not required

**Query Parameters:**
- `categories`: Filter by category ID (integer)
- `pricing_type`: Filter by pricing type (FIXED, HOURLY, PROJECT, FLEXIBLE)
- `is_available`: Filter by availability (true/false)
- `location`: Filter by location (case-insensitive partial match)
- `category`: Alternative parameter for category filtering (integer)
- `search`: Search in username, description, and location
- `ordering`: Order results by field (e.g., `rating`, `-rating`, `base_price`, `-base_price`, `experience_years`)

**Example Requests:**
```
GET /api/providers/
GET /api/providers/?category=1
GET /api/providers/?location=Chicago
GET /api/providers/?search=plumber
GET /api/providers/?ordering=-rating
GET /api/providers/?category=1&is_available=true&ordering=-rating
```

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": 5,
    "username": "jane_plumber",
    "email": "jane@example.com",
    "profile": {
      "id": 5,
      "username": "jane_plumber",
      "email": "jane@example.com",
      "avatar": "http://localhost:8000/media/profiles/jane.jpg",
      "role": "SERVICE",
      "bio": "Professional plumber with 10 years experience",
      "phone": "+1987654321",
      "location": "Chicago, IL",
      "created_at": "2024-01-10T08:00:00Z",
      "is_service_provider": true
    },
    "categories": [
      {
        "id": 1,
        "name": "Plumbing",
        "description": "Plumbing services",
        "icon": "wrench"
      }
    ],
    "description": "Certified plumber specializing in residential plumbing",
    "experience_years": 10,
    "pricing_type": "HOURLY",
    "base_price": "50.00",
    "hourly_rate": "75.00",
    "is_available": true,
    "rating": 4.8,
    "total_reviews": 47,
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-20T14:30:00Z"
  },
  {
    "id": 2,
    "user": 8,
    "username": "mike_electrician",
    "email": "mike@example.com",
    "profile": { "..." },
    "categories": [ "..." ],
    "description": "Licensed electrician for residential and commercial",
    "experience_years": 15,
    "pricing_type": "FIXED",
    "base_price": "100.00",
    "hourly_rate": null,
    "is_available": true,
    "rating": 4.9,
    "total_reviews": 62,
    "created_at": "2024-01-05T12:00:00Z",
    "updated_at": "2024-01-18T16:45:00Z"
  }
]
```

---

### List Provider Reviews
Get all reviews for a specific service provider.

**Endpoint:** `GET /api/providers/<provider_id>/reviews/`  
**Authentication:** Not required

**Path Parameters:**
- `provider_id`: Integer (service provider ID)

**Example Request:**
```
GET /api/providers/1/reviews/
```

**Success Response (200 OK):**
```json
[
  {
    "id": 15,
    "booking": 42,
    "user": 3,
    "user_name": "john_doe",
    "provider": 1,
    "provider_name": "jane_plumber",
    "rating": 5,
    "comment": "Excellent service! Fixed my leak quickly and professionally.",
    "created_at": "2024-01-18T14:30:00Z"
  },
  {
    "id": 12,
    "booking": 38,
    "user": 7,
    "user_name": "sarah_smith",
    "provider": 1,
    "provider_name": "jane_plumber",
    "rating": 4,
    "comment": "Good work, arrived on time. Would recommend.",
    "created_at": "2024-01-15T11:20:00Z"
  }
]
```

---

## 6. Booking Endpoints

### Create Booking
Create a new service booking request.

**Endpoint:** `POST /api/bookings/create/`  
**Authentication:** Required

**Request Body:**
```json
{
  "service_provider": 1,
  "category": 1,
  "description": "Kitchen sink is leaking and needs immediate repair",
  "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
  "scheduled_date": "2024-01-25T14:00:00Z",
  "duration_hours": 2,
  "total_price": "150.00"
}
```

**Field Descriptions:**
- `service_provider`: Service provider ID (required)
- `category`: Service category ID (required)
- `description`: Detailed description of service needed (required)
- `address`: Service location address (required)
- `scheduled_date`: Desired date/time for service (required, must be in future, ISO 8601 format)
- `duration_hours`: Expected duration in hours (optional)
- `total_price`: Total price for the service (required)

**Success Response (201 Created):**
```json
{
  "id": 42,
  "user": 3,
  "user_name": "john_doe",
  "service_provider": 1,
  "provider_name": "jane_plumber",
  "category": 1,
  "category_name": "Plumbing",
  "description": "Kitchen sink is leaking and needs immediate repair",
  "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
  "scheduled_date": "2024-01-25T14:00:00Z",
  "duration_hours": 2,
  "total_price": "150.00",
  "status": "PENDING",
  "provider_notes": "",
  "user_notes": "",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "scheduled_date": ["Booking date must be in the future"]
}
```
or
```json
{
  "service_provider": ["This provider is not currently available"]
}
```

---

### List Bookings
Retrieve bookings for the current user or service provider.

**Endpoint:** `GET /api/bookings/`  
**Authentication:** Required

**Query Parameters:**
- `type`: Specify booking type
  - `user` (default): Get bookings made by current user
  - `provider`: Get bookings for current user as service provider
- `status`: Filter by booking status (PENDING, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED)

**Example Requests:**
```
GET /api/bookings/
GET /api/bookings/?type=provider
GET /api/bookings/?status=PENDING
GET /api/bookings/?type=provider&status=ACCEPTED
```

**Success Response (200 OK):**
```json
[
  {
    "id": 42,
    "user": 3,
    "user_name": "john_doe",
    "service_provider": 1,
    "provider_name": "jane_plumber",
    "category": 1,
    "category_name": "Plumbing",
    "description": "Kitchen sink is leaking and needs immediate repair",
    "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
    "scheduled_date": "2024-01-25T14:00:00Z",
    "duration_hours": 2,
    "total_price": "150.00",
    "status": "ACCEPTED",
    "provider_notes": "Will bring all necessary tools",
    "user_notes": "Please call when you arrive",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  },
  {
    "id": 38,
    "user": 3,
    "user_name": "john_doe",
    "service_provider": 2,
    "provider_name": "mike_electrician",
    "category": 2,
    "category_name": "Electrical",
    "description": "Install new ceiling fan in bedroom",
    "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
    "scheduled_date": "2024-01-22T10:00:00Z",
    "duration_hours": 3,
    "total_price": "200.00",
    "status": "COMPLETED",
    "provider_notes": "Job completed successfully",
    "user_notes": "Great work, thank you!",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-22T13:30:00Z"
  }
]
```

---

### Get Booking Detail
Retrieve details of a specific booking.

**Endpoint:** `GET /api/bookings/<pk>/`  
**Authentication:** Required (must be booking owner or assigned provider)

**Path Parameters:**
- `pk`: Integer (booking ID)

**Example Request:**
```
GET /api/bookings/42/
```

**Success Response (200 OK):**
```json
{
  "id": 42,
  "user": 3,
  "user_name": "john_doe",
  "service_provider": 1,
  "provider_name": "jane_plumber",
  "category": 1,
  "category_name": "Plumbing",
  "description": "Kitchen sink is leaking and needs immediate repair",
  "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
  "scheduled_date": "2024-01-25T14:00:00Z",
  "duration_hours": 2,
  "total_price": "150.00",
  "status": "ACCEPTED",
  "provider_notes": "Will bring all necessary tools",
  "user_notes": "Please call when you arrive",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

### Update Booking
Update booking status or notes.

**Endpoint:** `PUT /api/bookings/<pk>/`  
**Authentication:** Required (must be booking owner or assigned provider)

**Path Parameters:**
- `pk`: Integer (booking ID)

**Request Body (for service providers):**
```json
{
  "status": "ACCEPTED",
  "provider_notes": "Will bring all necessary tools and arrive 10 minutes early"
}
```

**Valid status values for providers:**
- `ACCEPTED`: Accept the booking
- `REJECTED`: Reject the booking

**Request Body (for users):**
```json
{
  "user_notes": "Please call when you arrive. Gate code is 1234."
}
```

**Success Response (200 OK):**
```json
{
  "id": 42,
  "user": 3,
  "user_name": "john_doe",
  "service_provider": 1,
  "provider_name": "jane_plumber",
  "category": 1,
  "category_name": "Plumbing",
  "description": "Kitchen sink is leaking and needs immediate repair",
  "address": "123 Main Street, Apt 4B, Chicago, IL 60601",
  "scheduled_date": "2024-01-25T14:00:00Z",
  "duration_hours": 2,
  "total_price": "150.00",
  "status": "ACCEPTED",
  "provider_notes": "Will bring all necessary tools and arrive 10 minutes early",
  "user_notes": "Please call when you arrive. Gate code is 1234.",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T16:00:00Z"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "You can only update status if you are the provider"
}
```

---

## 7. Review Endpoints

### Create Review
Create a review for a completed booking.

**Endpoint:** `POST /api/reviews/create/`  
**Authentication:** Required

**Request Body:**
```json
{
  "booking": 38,
  "provider": 2,
  "rating": 5,
  "comment": "Excellent work! Mike was professional, arrived on time, and completed the ceiling fan installation perfectly. Highly recommend!"
}
```

**Field Descriptions:**
- `booking`: Booking ID (required, must be COMPLETED and belong to current user)
- `provider`: Service provider ID (required)
- `rating`: Rating from 1 to 5 (required)
- `comment`: Review text (required)

**Success Response (201 Created):**
```json
{
  "id": 25,
  "booking": 38,
  "user": 3,
  "user_name": "john_doe",
  "provider": 2,
  "provider_name": "mike_electrician",
  "rating": 5,
  "comment": "Excellent work! Mike was professional, arrived on time, and completed the ceiling fan installation perfectly. Highly recommend!",
  "created_at": "2024-01-22T14:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "booking": ["Can only review completed bookings"]
}
```
or
```json
{
  "booking": ["You can only review your own bookings"]
}
```

**Note:** Creating a review automatically updates the service provider's average rating and total review count.

---

## Error Handling

The API uses standard HTTP status codes and returns errors in JSON format.

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

**Validation Errors (400):**
```json
{
  "field_name": ["Error message for this field"],
  "another_field": ["Another error message"]
}
```

**Authentication Errors (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```
or
```json
{
  "detail": "Given token not valid for any token type"
}
```

**Permission Errors (403):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```
or
```json
{
  "error": "You can only update status if you are the provider"
}
```

**Not Found Errors (404):**
```json
{
  "detail": "Not found."
}
```
or
```json
{
  "error": "Service provider profile not found"
}
```

---

## Models

### User Model (UserModel)
```python
{
  "id": "integer",
  "username": "string (unique, max 50 chars)",
  "email": "string (unique email)",
  "is_service_provider": "boolean",
  "is_staff": "boolean",
  "is_active": "boolean"
}
```

### Profile Model
```python
{
  "id": "integer",
  "user": "foreign key to UserModel",
  "avatar": "image file (optional)",
  "role": "string (USER or SERVICE)",
  "bio": "string (max 500 chars)",
  "phone": "string (max 15 chars)",
  "location": "string (max 50 chars)",
  "created_at": "datetime"
}
```

### Service Category Model
```python
{
  "id": "integer",
  "name": "string (max 100 chars)",
  "description": "string",
  "icon": "string (max 50 chars)"
}
```

### Service Provider Model
```python
{
  "id": "integer",
  "user": "foreign key to UserModel (one-to-one)",
  "categories": "many-to-many with ServiceCategory",
  "description": "string",
  "experience_years": "integer (>= 0)",
  "pricing_type": "string (FIXED/HOURLY/PROJECT/FLEXIBLE)",
  "base_price": "decimal (max 10 digits, 2 decimal places)",
  "hourly_rate": "decimal (optional, max 8 digits, 2 decimal places)",
  "is_available": "boolean",
  "rating": "float (0.0 to 5.0)",
  "total_reviews": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Booking Model
```python
{
  "id": "integer",
  "user": "foreign key to UserModel",
  "service_provider": "foreign key to ServiceProvider",
  "category": "foreign key to ServiceCategory",
  "description": "string",
  "address": "string",
  "scheduled_date": "datetime",
  "duration_hours": "integer (optional)",
  "total_price": "decimal (max 10 digits, 2 decimal places)",
  "status": "string (PENDING/ACCEPTED/REJECTED/IN_PROGRESS/COMPLETED/CANCELLED)",
  "provider_notes": "string",
  "user_notes": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```