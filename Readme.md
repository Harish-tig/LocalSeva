# 🏠 LocalSeva - Service Booking & Marketplace Platform

> A comprehensive full-stack web application that seamlessly combines professional service booking with an OLX-style marketplace, creating a unified platform for connecting local service providers with customers and enabling peer-to-peer product trading.

[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.14-red.svg)](https://www.django-rest-framework.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)](https://www.javascript.com/)

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Configuration](#-configuration)
- [Application Pages](#-application-pages)

---

## 📖 Project Description

**LocalSeva** is a sophisticated dual-purpose platform designed to revolutionize how people access local services and trade products within their community. The project addresses two major market needs through a single, integrated solution:

### 🔧 Service Booking Module

The service booking component functions similarly to platforms like UrbanClap or TaskRabbit, providing a professional marketplace for home and professional services. It bridges the gap between customers seeking reliable service providers and skilled professionals looking for work opportunities.

**How It Works:**
1. **For Customers:** Browse verified service providers, compare ratings and prices, create service requests with specific requirements, receive competitive quotes, track service progress in real-time, and leave reviews after completion.
2. **For Service Providers:** Create professional profiles showcasing skills and experience, receive booking requests from customers, provide custom quotes based on job requirements, manage multiple bookings with status tracking, build reputation through customer reviews.

**Booking Workflow:**
```
Customer Request → Provider Quote → Customer Acceptance → Service In Progress → Completion → Review
```

### 🛒 Marketplace Module

The marketplace component operates like OLX or Craigslist, enabling users to buy and sell products locally through direct peer-to-peer interactions without platform-mediated transactions.

**How It Works:**
1. **For Sellers:** List products with detailed descriptions and multiple images, set competitive prices, specify product condition and location, receive buyer inquiries through comments, manage multiple product listings.
2. **For Buyers:** Browse products by categories and filters, view detailed product information and images, contact sellers directly through the comment system, negotiate prices and arrange meetings, track products of interest.

### 🎯 Core Value Proposition

**LocalSeva** stands out by offering:

- **Unified Platform Experience:** Single account for both booking services and trading products
- **Trust & Safety:** Review system, rating mechanism, and reporting tools ensure community safety
- **Local Focus:** Emphasis on connecting people within the same geographical area
- **Direct Communication:** No middleman fees - buyers and sellers communicate directly
- **Comprehensive Profiles:** Users build reputation across both service and marketplace activities
- **Real-time Tracking:** Live status updates for service bookings
- **Mobile-Responsive:** Seamless experience across all devices

### 🌟 Use Cases

**Service Booking:**
- Home repairs (plumbing, electrical, carpentry)
- Appliance servicing (AC, refrigerator, washing machine)
- Cleaning and maintenance services
- Painting and renovation work
- Pest control services
- And many more professional services

**Marketplace:**
- Selling used furniture and appliances
- Trading electronics and gadgets
- Listing vehicles for sale
- Renting or selling real estate
- Selling books, clothing, and sports equipment
- General household items

### 🏗️ Technical Architecture

Built using modern web technologies, LocalSeva employs a robust architecture:

- **Frontend:** Vanilla JavaScript with responsive design for universal compatibility
- **Backend:** Django REST Framework providing scalable RESTful APIs
- **Authentication:** JWT-based secure authentication system
- **Database:** SQLite (development) with easy PostgreSQL upgrade path (production)
- **File Management:** Integrated media handling for avatars and product images
- **Security:** CORS protection, token-based auth, input validation, and XSS prevention

---

## ✨ Features

### 🔧 Service Booking Module

| Feature | Description |
|---------|-------------|
| **User Management** | Complete registration, login, and profile management system |
| **Provider Discovery** | Advanced filtering by location, experience, price range, and ratings |
| **Smart Booking System** | Create detailed service requests with address and scheduling |
| **Quote Management** | Receive and compare multiple quotes from different providers |
| **Status Tracking** | Real-time booking status: PENDING → QUOTE_GIVEN → ACCEPTED → IN_PROGRESS → COMPLETED |
| **Review System** | Rate and review providers after service completion (1-5 stars) |
| **Provider Profiles** | Detailed profiles with experience, specializations, and pricing |
| **Safety Reporting** | Report fraudulent providers, bad service, or safety concerns |

### 🛒 Marketplace Module

| Feature | Description |
|---------|-------------|
| **Product Listings** | Upload products with title, description, and up to 3 images |
| **Category System** | Organized categories: Furniture, Electronics, Vehicles, Real Estate, etc. |
| **Condition Tags** | Mark items as New, Like New, Good, Fair, or Poor condition |
| **Search & Filter** | Advanced filtering by category, price range, condition, and location |
| **Comment System** | Buyers can comment on products to ask questions or express interest |
| **Seller Dashboard** | Manage all your product listings from a centralized interface |
| **View Tracking** | Track how many users have viewed your products |
| **Contact Integration** | Share phone/WhatsApp for direct buyer-seller communication |

### 🔐 Security & Safety Features

- JWT token-based authentication with refresh mechanism
- Secure password hashing and validation
- User reporting system for misconduct
- Profile verification indicators
- Review moderation capabilities
- Image upload validation and sanitization

---

## 🛠️ Tech Stack

### Frontend Technologies

```
HTML5 + CSS3 + Vanilla JavaScript
├── Responsive Design (Mobile-first approach)
├── Client-side Form Validation
├── Fetch API for HTTP requests
├── LocalStorage for JWT token management
└── Dynamic DOM manipulation
```

### Backend Technologies

```
Django 4.2 + Django REST Framework 3.14
├── JWT Authentication (djangorestframework-simplejwt)
├── SQLite Database (Development)
├── PostgreSQL Ready (Production)
├── CORS Headers (django-cors-headers)
├── File Upload Support
├── RESTful API Design
└── Django Admin Panel
```

### Key Python Packages

- `django==4.2`
- `djangorestframework==3.14`
- `djangorestframework-simplejwt`
- `django-cors-headers`
- `Pillow` (Image processing)
- `python-decouple` (Environment variables)

---

## 📁 Project Structure

```
LocalSeva/
├── localseva_backend/                 # Django Backend Application
│   ├── local_user/                    # User Authentication App
│   │   ├── models.py                  # User, Profile, Booking, Product models
│   │   ├── serializers.py             # DRF Serializers
│   │   ├── views.py                   # API Views
│   │   ├── urls.py                    # App URL routing
│   │   └── admin.py                   # Admin configurations
│   │   #other files like signals,apps,utils,helpers etc
│   ├── localseva_backend/             # Main Django Project
│   │   ├── settings.py                # Project settings & configuration
│   │   ├── urls.py                    # Main URL routing
│   │   ├── wsgi.py                    # WSGI configuration
│   │   └── asgi.py                    # ASGI configuration
│   │
│   ├── media/                         # User uploaded files
│   │   ├── avatars/                   # User profile pictures
│   │   └── products/                  # Product images
│   │
│   ├── static/                        # Static files
│   │   ├── css/                       # Stylesheets
│   │   ├── js/                        # JavaScript files
│   │   └── images/                    # Static images
│   │
│   ├── db.sqlite3                     # SQLite database
│   ├── manage.py                      # Django management script
│   └── requirements.txt               # Python dependencies
│
├── localseva_frontend/                # Frontend Application
│   ├── index.html                     # Landing/Home page
│   ├── signup.html                    # Registration & Login page
│   ├── profile.html                   # User profile management
│   │
│   ├── services.html                  # Browse service providers
│   ├── service-detail.html            # Provider details & booking
│   ├── my-services.html               # User's service bookings dashboard
│   │
│   ├── shop.html                      # Marketplace product listings
│   ├── product-detail.html            # Product details & comments
│   ├── add-item.html                  # Create new product listing
│   ├── my-products.html               # Seller's product dashboard
│   ├── my-product-comments.html       # Comments on seller's products
│   ├── my-activity.html               # All user activity overview
│   │
│   ├── css/                           # Stylesheets
│   │   ├── style.css                  # Main stylesheet
│   │   ├── responsive.css             # Mobile responsive styles
│   │   └── components.css             # Reusable components
│   │
│   ├── js/                            # JavaScript modules
│   │   ├── auth.js                    # Authentication logic
│   │   ├── api.js                     # API communication
│   │   ├── utils.js                   # Utility functions
│   │   └── main.js                    # Main application logic
│   │
│   └── assets/                        # Static assets
│       ├── images/                    # Images, logos, icons
│       └── icons/                     # SVG icons
│
├── .gitignore                         # Git ignore rules
├── README.md                          # This file
└── LICENSE                            # MIT License
```

---

## 📋 Prerequisites

Before setting up LocalSeva, ensure you have the following installed on your system:

### Required Software

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
  - Verify: `python --version` or `python3 --version`
- **pip** - Python package manager (comes with Python)
  - Verify: `pip --version`
- **Git** - Version control system - [Download Git](https://git-scm.com/)
  - Verify: `git --version`

### Recommended Software

- **Code Editor** - [Visual Studio Code](https://code.visualstudio.com/) (recommended)
  - Extensions: Live Server, Python, ESLint
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge
  - For testing and development

### Optional Tools

- **Postman** - For API testing - [Download Postman](https://www.postman.com/)
- **DB Browser for SQLite** - For database inspection - [Download](https://sqlitebrowser.org/)

---

## 🚀 Installation & Setup

Follow these steps to set up LocalSeva on your local machine:

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Harish-tig/TCSC_HACKATHON_2.0.git

# Navigate to project directory
cd LocalSeva
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory

```bash
cd localseva_backend
```

#### 2.2 Create Virtual Environment

**On Windows:**
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate
```

**On macOS/Linux:**
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate
```

✅ You should see `(.venv)` in your terminal prompt indicating the virtual environment is active.

#### 2.3 Install Python Dependencies

```bash
# Upgrade pip to latest version
pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt
```

**Expected packages to be installed:**
- Django
- djangorestframework
- djangorestframework-simplejwt
- django-cors-headers
- Pillow
- python-decouple

#### 2.4 Configure Database

```bash
# Run migrations to create database tables
python manage.py makemigration
#followed by
python manage.py migrate
```

This will create the `db.sqlite3` database file with all necessary tables.

#### 2.5 Create Superuser (Optional but Recommended)

```bash
# Create admin account for Django admin panel
python manage.py createsuperuser
```

Follow the prompts to enter:
- Username (e.g., admin)
- Email address (optional)
- Password (enter twice for confirmation)

#### 2.6 Create Media Directory

```bash
# Create directory for file uploads
mkdir media

# On Linux/macOS, set appropriate permissions
chmod 755 media
```

**On Windows:** The directory is created automatically; no chmod needed.

#### 2.7 Collect Static Files (Optional)

```bash
# Collect all static files
python manage.py collectstatic
```

Type 'yes' when prompted.

---

## 🎬 Running the Application

### Start the Backend Server

Ensure you're in the `localseva_backend` directory with virtual environment activated:

```bash
# Start Django development server
python manage.py runserver
```

You should see output like:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
January 15, 2025 - 10:30:00
Django version 4.2, using settings 'localseva_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

✅ **Backend API is now running at:** `http://localhost:8000`

**Test the backend:**
- Visit `http://localhost:8000/admin/` - Django admin panel

### Start the Frontend

Open a **new terminal window/tab** (keep the backend running) and choose one of the following methods:

#### Method A: Using VS Code Live Server (Recommended)

1. Open VS Code
2. Install **Live Server** extension if not already installed
3. Navigate to `localseva_frontend` folder
4. Right-click on `index.html`
5. Select **"Open with Live Server"**

✅ **Frontend opens automatically at:** `http://localhost:5500` or `http://127.0.0.1:5500`

**Advantages:**
- Auto-reload on file changes
- Best development experience
- No CORS issues

#### Method B: Using Python HTTP Server

```bash
# Navigate to frontend directory
cd localseva_frontend

# Start simple HTTP server on port 3000
python -m http.server 3000
```

✅ **Frontend is now accessible at:** `http://localhost:3000`

**To stop the server:** Press `Ctrl+C`

#### Method C: Direct File Access

```bash
# Simply open the HTML file in browser
cd localseva_frontend
start index.html       # On Windows
open index.html        # On macOS
xdg-open index.html    # On Linux
```

⚠️ **Warning:** This method may cause CORS errors when making API requests. Use Method A or B for development.

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend App** | http://localhost:3000 or http://localhost:5500 | Main user interface |
| **Backend API** | http://localhost:8000/api/ | REST API endpoints |
| **Admin Panel** | http://localhost:8000/admin/ | Django administration |
| **API Browsable** | http://localhost:8000/api/bookings/ | DRF browsable API |

---

## ⚙️ Configuration

### Backend Configuration

#### 1. CORS Settings

Ensure CORS is properly configured in `localseva_backend/localseva_backend/settings.py`:

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

#### 2. Media Files Configuration

Verify in `settings.py`:

```python
# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

And in `localseva_backend/localseva_backend/urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your URL patterns
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

#### 3. JWT Settings

JWT configuration in `settings.py`:

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

#### 4. Database Configuration

**Development (SQLite - Default):**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Production (PostgreSQL - Optional):**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'localseva',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Frontend Configuration

#### API Base URL

If your backend runs on a different port, update the API URL in frontend JavaScript files:

```javascript
// In js/api.js or js/config.js
const API_BASE_URL = 'http://localhost:8000/api/';
```

#### Authentication Token Storage

Tokens are stored in browser's localStorage:

```javascript
// After successful login
localStorage.setItem('access_token', response.access);
localStorage.setItem('refresh_token', response.refresh);
localStorage.setItem('user_id', response.user_id);
```

### Environment Variables (Optional)

For better security, create a `.env` file in `localseva_backend/`:

```env
# .env file
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500

# Database (for PostgreSQL)
DB_NAME=localseva
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Email (Optional - for future features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Install python-decouple:**
```bash
pip install python-decouple
```

**Use in settings.py:**
```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
```

---

## 📱 Application Pages

### Public Pages (No Authentication Required)

| Page | File | Route | Description |
|------|------|-------|-------------|
| **Landing Page** | `index.html` | `/` | Homepage with service categories and marketplace preview |
| **Sign Up/Login** | `signup.html` | `/signup` | User registration and authentication |
| **Browse Services** | `services.html` | `/services` | List of all service providers with filters |
| **Service Details** | `service-detail.html` | `/service-detail` | Individual provider profile and booking form |
| **Marketplace** | `shop.html` | `/shop` | Browse all products for sale |
| **Product Details** | `product-detail.html` | `/product-detail` | Product information and buyer comments |

### Private Pages (Authentication Required)

| Page | File | Route | Description |
|------|------|-------|-------------|
| **User Profile** | `profile.html` | `/profile` | View and edit profile, become a service provider |
| **My Services** | `my-services.html` | `/my-services` | View bookings as customer or provider |
| **My Activity** | `my-activity.html` | `/my-activity` | Complete activity overview (bookings + products) |
| **Add Product** | `add-item.html` | `/add-item` | Create new marketplace product listing |
| **My Products** | `my-products.html` | `/my-products` | Manage your product listings |
| **Product Comments** | `my-product-comments.html` | `/my-product-comments` | View and respond to buyer inquiries |

### Admin Panel

| Page | URL | Description |
|------|-----|-------------|
| **Django Admin** | `/admin/` | Full database management interface |

---