# note this document was created with the help of Claude

cat > API_DOCUMENTATION.md << 'EOF'
# Service Booking Platform API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
All endpoints (except register, login, service providers list, provider reviews, marketplace products, and product comments) require JWT authentication. Include the token in the header:
```
Authorization: Bearer <your_access_token>
```

---

## Table of Contents
1. [Authentication](#1-authentication)
   - [Register User](#11-register-user)
   - [Login](#12-login)
   
2. [Profile Management](#2-profile-management)
   - [Get/Update Profile](#21-getupdate-profile)
   - [Become Service Provider](#22-become-service-provider)
   
3. [Service Providers](#3-service-providers)
   - [List Service Providers](#31-list-service-providers)
   - [Get Provider Reviews](#32-get-provider-reviews)
   
4. [Bookings](#4-bookings)
   - [Create Booking](#41-create-booking)
   - [List Bookings](#42-list-bookings)
   - [Get/Update Booking](#43-getupdate-booking)
   
5. [Reviews](#5-reviews)
   - [Create Review](#51-create-review)
   
6. [Reports](#6-reports)
   - [Create Report](#61-create-report)
   - [List My Reports](#62-list-my-reports)
   
7. [Marketplace (OLX-like)](#7-marketplace-olx-like)
   - [List Products](#71-list-products)
   - [Create Product](#72-create-product)
   - [Get/Update/Delete Product](#73-getupdatedelete-product)
   - [List Product Comments](#74-list-product-comments)
   - [Create Comment](#75-create-comment)
   - [Delete/Hide Comment](#76-deletehide-comment)
   - [List My Products](#77-list-my-products)
   - [List Comments on My Products](#78-list-comments-on-my-products)

---

## 1. Authentication

### 1.1 Register User
**POST** `/register/`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "password2": "SecurePass123"
}
```

**Required Fields:**
- `username` (string, unique, 50 chars max)
- `email` (string, valid email, unique)
- `password` (string, min 8 chars)
- `password2` (string, must match password)

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "username": "john_doe"
}
```

**Error Response (400 Bad Request):**
```json
{
  "username": ["This field must be unique."],
  "email": ["Enter a valid email address."],
  "password": ["This password is too common."]
}
```

---

### 1.2 Login
**POST** `/login/`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Required Fields:**
- `username` (string)
- `password` (string)

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

## 2. Profile Management

### 2.1 Get/Update Profile
**GET/PUT** `/profile/`

#### GET - Retrieve Profile
**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "http://localhost:8000/media/profiles/avatar.jpg",
  "role": "USER",
  "bio": "I need home services",
  "phone": "+1234567890",
  "location": "New York, NY",
  "experience_years": 0,
  "pricing_type": "",
  "base_price": null,
  "is_available": true,
  "rating": 0.0,
  "total_reviews": 0,
  "created_at": "2023-10-01T12:00:00Z",
  "is_service_provider": false,
  "categories": [],
  "availability": "",
  "description": "",
  "service_locations": [],
  "is_marketplace_seller": false,
  "marketplace_rating": 0.0,
  "marketplace_reviews": 0
}
```

#### PUT - Update Profile
**Request Body (all fields optional):**
```json
{
  "avatar": "<binary_file>",
  "role": "SERVICE",
  "bio": "Professional plumber with 10 years experience",
  "phone": "+1234567890",
  "location": "New York, NY",
  "experience_years": 10,
  "pricing_type": "FIXED",
  "base_price": "500.00",
  "is_available": true,
  "categories": ["PLUMBING", "ELECTRICAL"],
  "availability": "Mon-Fri 9AM-6PM",
  "description": "Licensed plumber specializing in emergency repairs",
  "service_locations": ["Manhattan", "Brooklyn"],
  "is_marketplace_seller": true
}
```

**Note:** When changing role to "SERVICE", these fields become required:
- `experience_years`
- `pricing_type` ("FIXED" or "FLEXIBLE")
- `base_price` (average base/visiting charge)

**Success Response (200 OK):** Same as GET response with updated data

---

### 2.2 Become Service Provider
**POST** `/profile/become-provider/`

**Request Body:** Empty

**Success Response (200 OK):**
```json
{
  "message": "You are now marked as a service provider!",
  "next_step": "Please update your profile to add service provider details:",
  "required_fields": {
    "experience_years": "Required",
    "pricing_type": "Required (FIXED or FLEXIBLE)",
    "base_price": "Required (Average base/visiting charge)",
    "bio": "Recommended to describe your services",
    "phone": "Recommended for clients to contact you",
    "location": "Recommended to show where you provide services",
    "categories": "List of services you provide (JSON array)",
    "service_locations": "Areas you serve (JSON array)"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "You are already a service provider",
  "next_step": "Update your profile to add service provider details"
}
```

---

## 3. Service Providers

### 3.1 List Service Providers
**GET** `/providers/`

**Query Parameters:**
- `id` (int, optional) - Filter by specific provider ID
- `location` (string, optional) - Filter by location
- `min_experience` (int, optional) - Minimum years of experience
- `max_price` (float, optional) - Maximum base price
- `pricing_type` (string, optional) - "FIXED" or "FLEXIBLE"
- `is_available` (boolean, optional) - Availability status
- `search` (string, optional) - Search in username, bio, location, description
- `ordering` (string, optional) - Order by: rating, experience_years, base_price (prepend - for descending)

**Success Response (200 OK):**
```json
[
  {
    "id": 2,
    "username": "plumber_joe",
    "email": "joe@example.com",
    "avatar": "http://localhost:8000/media/profiles/joe.jpg",
    "role": "SERVICE",
    "bio": "Professional plumber with 10 years experience",
    "phone": "+1234567890",
    "location": "New York, NY",
    "experience_years": 10,
    "pricing_type": "FIXED",
    "base_price": "500.00",
    "is_available": true,
    "rating": 4.5,
    "total_reviews": 12,
    "created_at": "2023-10-01T12:00:00Z",
    "is_service_provider": true,
    "categories": ["PLUMBING", "ELECTRICAL"],
    "availability": "Mon-Fri 9AM-6PM",
    "description": "Licensed plumber specializing in emergency repairs",
    "service_locations": ["Manhattan", "Brooklyn"]
  }
]
```

---

### 3.2 Get Provider Reviews
**GET** `/providers/{provider_id}/reviews/`

**URL Parameters:**
- `provider_id` (int, required) - Service provider's profile ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "booking": 1,
    "user": 1,
    "user_name": "john_doe",
    "provider": 2,
    "provider_name": "plumber_joe",
    "rating": 5,
    "comment": "Excellent service! Fixed my leaking pipe quickly.",
    "created_at": "2023-10-05T14:30:00Z"
  }
]
```

---

## 4. Bookings

### 4.1 Create Booking
**POST** `/bookings/create/`

**Request Body:**
```json
{
  "provider_id": 2,
  "description": "Leaking pipe in kitchen sink",
  "address": "123 Main St, New York, NY",
  "scheduled_date": "2023-10-15T10:00:00Z"
}
```

**Required Fields:**
- `provider_id` (int) - Service provider's profile ID
- `description` (string) - Service description
- `address` (string) - Service address
- `scheduled_date` (datetime) - Future date/time

**Success Response (201 Created):**
```json
{
  "id": 1,
  "user": 1,
  "user_name": "john_doe",
  "service_provider": 2,
  "provider_name": "plumber_joe",
  "description": "Leaking pipe in kitchen sink",
  "address": "123 Main St, New York, NY",
  "scheduled_date": "2023-10-15T10:00:00Z",
  "quote_price": null,
  "final_price": null,
  "status": "PENDING",
  "provider_notes": "",
  "user_notes": "",
  "created_at": "2023-10-10T09:00:00Z",
  "updated_at": "2023-10-10T09:00:00Z",
  "quoted_at": null,
  "accepted_at": null,
  "started_at": null,
  "completed_at": null
}
```

---

### 4.2 List Bookings
**GET** `/bookings/`

**Query Parameters:**
- `type` (string, optional) - "user" (default) or "provider"
- `status` (string, optional) - Filter by status

**For Customers (type=user):** Returns bookings made by the user  
**For Service Providers (type=provider):** Returns bookings received by the provider

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": 1,
    "user_name": "john_doe",
    "service_provider": 2,
    "provider_name": "plumber_joe",
    "description": "Leaking pipe in kitchen sink",
    "address": "123 Main St, New York, NY",
    "scheduled_date": "2023-10-15T10:00:00Z",
    "quote_price": "500.00",
    "final_price": null,
    "status": "QUOTE_GIVEN",
    "provider_notes": "Will bring replacement parts",
    "user_notes": "Please call before coming",
    "created_at": "2023-10-10T09:00:00Z",
    "updated_at": "2023-10-11T14:30:00Z",
    "quoted_at": "2023-10-11T14:30:00Z",
    "accepted_at": null,
    "started_at": null,
    "completed_at": null
  }
]
```

---

### 4.3 Get/Update Booking
**GET/PUT** `/bookings/{pk}/`

#### GET - Retrieve Booking
**Success Response (200 OK):** Same as booking object in list

#### PUT - Update Booking

**Who can update what:**
- **Service Provider can:** Give quote, update status, add provider notes
- **Customer can:** Accept quote, update user notes

**Service Provider giving quote:**
```json
{
  "quote_price": "500.00",
  "provider_notes": "Will bring replacement parts"
}
```
*Changes status to "QUOTE_GIVEN"*

**Customer accepting quote:**
```json
{
  "status": "ACCEPTED"
}
```
*Only works if status is "QUOTE_GIVEN"*

**Service Provider starting service:**
```json
{
  "status": "IN_PROGRESS"
}
```
*Only works if status is "ACCEPTED"*

**Service Provider completing service:**
```json
{
  "status": "COMPLETED"
}
```
### NOTE: -> WHEN PROVIDER SETTING STATAUS FROM IN PROGRESS TO COMPLETED. HE CAN UPDATE FINAL PRICE
```json
{
  "final_price": 500,
  "status" : "COMPLETED"
}
```
**This will set the final price. if final_price is not provided the backend will automatically register quoted price as final price**

*Only works if status is "IN_PROGRESS"*

**Service Provider rejecting booking:**
```json
{
  "status": "REJECTED"
}
```
*Only works if status is "PENDING"*

**Success Response (200 OK):** Updated booking object

**Error Response (403 Forbidden):**
```json
{
  "error": "You don't have permission to update this booking"
}
```

---

## 5. Reviews

### 5.1 Create Review
**POST** `/reviews/create/`

**Request Body:**
```json
{
  "booking": 1,
  "provider": 2,
  "rating": 5,
  "comment": "Excellent service! Fixed my leaking pipe quickly."
}
```

**Required Fields:**
- `booking` (int) - Completed booking ID
- `provider` (int) - Service provider's profile ID
- `rating` (int) - 1 to 5
- `comment` (string) - Review text

**Conditions:**
- Booking must be COMPLETED
- User must be the customer who made the booking
- Provider must match the booking's service provider

**Success Response (201 Created):**
```json
{
  "id": 1,
  "booking": 1,
  "user": 1,
  "user_name": "john_doe",
  "provider": 2,
  "provider_name": "plumber_joe",
  "rating": 5,
  "comment": "Excellent service! Fixed my leaking pipe quickly.",
  "created_at": "2023-10-05T14:30:00Z"
}
```

---

## 6. Reports

### 6.1 Create Report
**POST** `/reports/create/`

**Request Body:**
```json
{
  "reported_user": 2,
  "reported_profile_id": 2,
  "booking": 1,
  "report_type": "FRAUD",
  "description": "Charged extra without explanation",
  "evidence_image": "<binary_file>"
}
```

**Required Fields:**
- `reported_user` (int) - User ID being reported
- `report_type` (string) - "FRAUD", "BAD_SERVICE", "UNPROFESSIONAL", "HARASSMENT", "SAFETY", "OTHER"
- `description` (string) - Detailed report description

**Optional Fields:**
- `reported_profile_id` (int) - Required if reporting a service provider
- `booking` (int) - Related booking ID
- `evidence_image` (file) - Image evidence

**Success Response (201 Created):**
```json
{
  "id": 1,
  "reporter": 1,
  "reporter_name": "john_doe",
  "reported_user": 2,
  "reported_user_name": "plumber_joe",
  "reported_profile": 2,
  "booking": 1,
  "report_type": "FRAUD",
  "description": "Charged extra without explanation",
  "evidence_image": "http://localhost:8000/media/reports/evidence.jpg",
  "status": "PENDING",
  "admin_notes": "",
  "created_at": "2023-10-05T14:30:00Z",
  "resolved_at": null
}
```

---

### 6.2 List My Reports
**GET** `/reports/my/`

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "reporter": 1,
    "reporter_name": "john_doe",
    "reported_user": 2,
    "reported_user_name": "plumber_joe",
    "reported_profile": 2,
    "booking": 1,
    "report_type": "FRAUD",
    "description": "Charged extra without explanation",
    "evidence_image": "http://localhost:8000/media/reports/evidence.jpg",
    "status": "PENDING",
    "admin_notes": "",
    "created_at": "2023-10-05T14:30:00Z",
    "resolved_at": null
  }
]
```

---

## 7. Marketplace (OLX-like)

### 7.1 List Products
**GET** `/marketplace/`

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `condition` (string, optional) - Filter by condition
- `city` (string, optional) - Filter by city
- `is_sold` (boolean, optional) - Filter by sold status
- `min_price` (float, optional) - Minimum price
- `max_price` (float, optional) - Maximum price
- `search` (string, optional) - Search in title, description, seller username
- `ordering` (string, optional) - Order by: price, created_at, views

**Categories:** "FURNITURE", "ELECTRONICS", "VEHICLES", "REAL_ESTATE", "HOME_APPLIANCES", "CLOTHING", "BOOKS", "SPORTS", "OTHER"

**Conditions:** "NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "seller": 1,
    "seller_name": "john_doe",
    "seller_avatar": "http://localhost:8000/media/profiles/avatar.jpg",
    "seller_rating": 4.5,
    "title": "Sofa Set - 3 Seater",
    "description": "Hardly used, in excellent condition",
    "category": "FURNITURE",
    "condition": "LIKE_NEW",
    "price": "15000.00",
    "address": "123 Main St, New York",
    "city": "New York",
    "main_image": "http://localhost:8000/media/products/sofa.jpg",
    "image_2": "http://localhost:8000/media/products/sofa2.jpg",
    "image_3": null,
    "contact_phone": "+1234567890",
    "contact_whatsapp": "+1234567890",
    "contact_email": true,
    "is_sold": false,
    "is_active": true,
    "created_at": "2023-10-01T12:00:00Z",
    "updated_at": "2023-10-01T12:00:00Z",
    "views": 45,
    "comment_count": 3
  }
]
```

---

### 7.2 Create Product
**POST** `/marketplace/create/`

**Request Body:**
```json
{
  "title": "Sofa Set - 3 Seater",
  "description": "Hardly used, in excellent condition",
  "category": "FURNITURE",
  "condition": "LIKE_NEW",
  "price": "15000.00",
  "address": "123 Main St, New York",
  "city": "New York",
  "main_image": "<binary_file>",
  "image_2": "<binary_file>",
  "image_3": "<binary_file>",
  "contact_phone": "+1234567890",
  "contact_whatsapp": "+1234567890",
  "contact_email": true
}
```

**Required Fields:**
- `title` (string) - Product title
- `description` (string) - Product description
- `category` (string) - Product category
- `condition` (string) - Product condition
- `price` (decimal) - Product price
- `address` (string) - Pickup address
- `city` (string) - City

**Optional Fields:**
- `main_image`, `image_2`, `image_3` (files) - Product images
- `contact_phone`, `contact_whatsapp` (strings) - Contact numbers
- `contact_email` (boolean) - Allow email contact

**Success Response (201 Created):** Same as product object in list

---

### 7.3 Get/Update/Delete Product
**GET/PUT/DELETE** `/marketplace/{pk}/`

#### GET - Retrieve Product (increments view count)
**Success Response (200 OK):** Same as product object in list

#### PUT - Update Product (seller only)
**Request Body:** Same as create, partial updates allowed

#### DELETE - Delete Product (seller only, soft delete)
**Success Response (200 OK):**
```json
{
  "message": "Product deactivated successfully"
}
```

---

### 7.4 List Product Comments
**GET** `/marketplace/{product_id}/comments/`

**URL Parameters:**
- `product_id` (int, required) - Product ID

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "product": 1,
    "user": 2,
    "user_name": "buyer123",
    "user_avatar": "http://localhost:8000/media/profiles/buyer.jpg",
    "comment": "Interested in this sofa. WhatsApp me at 9876543210",
    "contact_info": "WhatsApp: 9876543210",
    "is_visible": true,
    "created_at": "2023-10-02T10:00:00Z",
    "updated_at": "2023-10-02T10:00:00Z"
  }
]
```

---

### 7.5 Create Comment
**POST** `/marketplace/comments/create/`

**Request Body:**
```json
{
  "product": 1,
  "comment": "Interested in this sofa. WhatsApp me at 9876543210",
  "contact_info": "WhatsApp: 9876543210"
}
```

**Required Fields:**
- `product` (int) - Product ID
- `comment` (string) - Comment text

**Optional Fields:**
- `contact_info` (string) - Contact information

**Success Response (201 Created):**
```json
{
  "id": 1,
  "product": 1,
  "user": 2,
  "user_name": "buyer123",
  "user_avatar": "http://localhost:8000/media/profiles/buyer.jpg",
  "comment": "Interested in this sofa. WhatsApp me at 9876543210",
  "contact_info": "WhatsApp: 9876543210",
  "is_visible": true,
  "created_at": "2023-10-02T10:00:00Z",
  "updated_at": "2023-10-02T10:00:00Z"
}
```

---

### 7.6 Delete/Hide Comment
**DELETE** `/marketplace/comments/{pk}/delete/`

**Who can delete:**
- Comment owner: Can delete their own comment
- Product seller: Can hide inappropriate comments (soft delete)

**Success Response (200 OK):**
```json
{
  "message": "Comment deleted successfully"
}
```
or
```json
{
  "message": "Comment hidden successfully"
}
```

---

### 7.7 List My Products
**GET** `/marketplace/my-products/`

**Success Response (200 OK):** List of products created by the current user

---

### 7.8 List Comments on My Products
**GET** `/marketplace/my-product-comments/`

**Success Response (200 OK):** List of all comments on products owned by the current user

---

## Booking Flow Diagram

```
User (Customer)                  Service Provider
     |                                |
     | 1. POST /bookings/create/      |
     |-------------------------------->|
     |                                |
     | 2. Status: PENDING             |
     |<--------------------------------|
     |                                |
     | 3. PUT quote_price             |
     |<--------------------------------|
     | 4. Status: QUOTE_GIVEN         |
     |                                |
     | 5. PUT status: ACCEPTED        |
     |-------------------------------->|
     | 6. Status: ACCEPTED            |
     |                                |
     | 7. PUT status: IN_PROGRESS     |
     |<--------------------------------|
     | 8. Status: IN_PROGRESS         |
     |                                |
     | 9. PUT status: COMPLETED       |
     |<--------------------------------|
     | 10. Status: COMPLETED          |
     |                                |
     | 11. POST /reviews/create/      |
     |-------------------------------->|
```

---

## Common Error Responses

### 400 Bad Request (Validation Error):
```json
{
  "field_name": ["Error message"],
  "field_name2": ["Another error"]
}
```

### 401 Unauthorized:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden:
```json
{
  "error": "You don't have permission to perform this action"
}
```

### 404 Not Found:
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error:
```json
{
  "error": "Internal server error. Please try again later."
}
```

---

## Frontend Implementation Tips

### 1. Token Management
```javascript
// Store tokens on login
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
localStorage.setItem('user_id', data.user_id);

// Add to request headers
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
};
```

### 2. Handling Token Expiry
Implement auto-refresh logic or redirect to login when receiving 401.

### 3. File Uploads
For image uploads (avatar, product images, evidence), use FormData:

```javascript
const formData = new FormData();
formData.append('avatar', imageFile);
formData.append('bio', 'New bio');

// Headers should NOT include 'Content-Type': 'application/json'
const headers = {
  'Authorization': `Bearer ${token}`
};
```

### 4. Pagination (if implemented later)
Check for pagination keys in response:

```json
{
  "count": 100,
  "next": "http://api.example.com/endpoint/?page=2",
  "previous": null,
  "results": []
}
```

---

## Support
For API support or issues, contact the backend development team.

**Last Updated:** January 2025  
**API Version:** 1.0

EOF

echo "=========================================="
echo "✓ API Documentation Generated Successfully!"
echo "=========================================="
echo ""
echo "File created: API_DOCUMENTATION.md"
echo ""
echo "You can now:"
echo "  1. Share this file with your frontend developers"
echo "  2. Add it to your README.md"
echo "  3. Use it as standalone API documentation"
echo ""
echo "=========================================="
