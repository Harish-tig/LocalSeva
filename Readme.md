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
- [Project Structure & Repositories](#-project-structure--repositories)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Containerization & Docker Deployment](#-containerization--docker-deployment)
- [Configuration & Environment Variables](#-configuration--environment-variables)
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
Customer Request → Provider Acceptance → Service In Progress → Completion → Review
```

### 🛒 Marketplace Module

The marketplace component operates like OLX or Craigslist, enabling users to buy and sell products locally through direct peer-to-peer interactions without platform-mediated transactions.

**How It Works:**
1. **For Sellers:** List products with detailed descriptions and multiple images, set competitive prices, specify product condition and location, receive buyer inquiries through comments and reply directly to them, manage multiple product listings.
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

### 🏗️ Technical Architecture & Cross-Domain Deployment

Built using modern web technologies, LocalSeva is engineered as two **completely decoupled applications**:

- **Frontend Application:** Standalone HTML/CSS/JavaScript client served independently (via Live Server, static hosting, S3, or CDN). Configured via `frontend/js/config.js` with zero-build environment overrides (`localStorage.setItem('LOCALSEVA_API_BASE_URL', ...)`).
- **Backend API Application:** Django REST Framework providing stateless, JWT-authenticated RESTful APIs. Supports both SQLite (local dev) and PostgreSQL (production).
- **Cross-Domain Communication:** High-performance, cross-origin communication with configurable CORS headers (`ALLOWED_ORIGINS` in `.env`), credentials support, and JWT bearer authentication.
- **Authentication & Security:** JWT-based stateless auth (`/login/`, `/register/`, `/token/refresh/`, `/token/verify/`), scoped throttling, input validation, and secure cookie headers in production.

---

## ✨ Features

### 🔧 Service Booking Module

| Feature | Description |
|---------|-------------|
| **User Management** | Complete registration, login, and profile management system |
| **Provider Discovery** | Advanced filtering by location, experience, price range, and ratings |
| **Smart Booking System** | Create detailed service requests with address and scheduling |
| **Direct Booking** | Simplified direct booking flow without complex quotes |
| **Status Tracking** | Real-time booking status: PENDING → ACCEPTED → IN_PROGRESS → COMPLETED |
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
| **Comment & Reply System** | Buyers can comment on products to ask questions, and sellers can post official replies |
| **Seller Dashboard** | Manage all your product listings from a centralized interface |
| **View Tracking** | Track how many users have viewed your products |
| **Contact Integration** | Share phone/WhatsApp for direct buyer-seller communication |

### 🔐 Security & Safety Features

- JWT token-based authentication with refresh mechanism
- Secure password hashing and validation
- Secure 2-step OTP based password reset flow
- API Rate Limiting for auth endpoints (3/min)
- User reporting system for misconduct
- Profile verification indicators
- Review moderation capabilities
- Image upload validation and sanitization
- Redis caching for provider lists (60s) and marketplace (5min)

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
├── API Rate Limiting (DRF Throttling)
├── Redis Caching for performance
├── SQLite Database (Development)
├── PostgreSQL Ready (Production via .env)
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

## 📁 Project Structure & Repositories

> 💡 **Separate Repository Architecture**: The frontend and backend are maintained in **separate Git repositories** to support independent deployments, separate CI/CD pipelines, and different domain hosting:
> - **Backend Repository** (Current Repo): `localseva_backend` + Docker orchestration files
> - **Frontend Repository**: [LocalSeva Frontend Repository](https://github.com/your-username/localseva-frontend) *(standalone client)*

Below is the complete file tree across both repositories:

### ⚙️ Backend Repository (`localseva_backend`)

```
localseva/
├── localseva_backend/                 # Django Backend Application
│   ├── local_user/                    # Core User, Booking & Marketplace App
│   │   ├── models.py                  # UserModel, Profile, Booking, Product, Report models
│   │   ├── serializers.py             # DRF Serializers with field-level validation
│   │   ├── views.py                   # REST API Views & canonical category endpoint
│   │   ├── urls.py                    # Endpoint routing (auth, profile, bookings, mart)
│   │   ├── admin.py                   # Django Admin configurations
│   │   ├── utils.py                   # Email utilities & OTP generation
│   │   └── migrations/                # Database migrations
│   ├── localseva_backend/             # Project Settings & Root Routing
│   │   ├── settings.py                # CORS, JWT, database & security configuration
│   │   ├── urls.py                    # Root URLconf
│   │   ├── wsgi.py                    # WSGI entrypoint for production
│   │   └── asgi.py                    # ASGI entrypoint
│   ├── media/                         # Uploaded media (avatars, product images)
│   ├── static/                        # Backend static assets
│   ├── manage.py                      # Django management CLI
│   └── db.sqlite3                     # Development SQLite database
│
├── Dockerfile                         # Python 3 base image Dockerfile
├── localseva-docker-compose.yaml      # Multi-container orchestration (Backend + Postgres + Redis)
├── localseva_backend.yaml             # Standalone backend service Compose file
├── localseva_postgres.yaml            # Standalone PostgreSQL 16 Compose file
├── localseva_redis.yaml               # Standalone Redis 8.10 Compose file
├── .env.example                       # Detailed template for environment variables
├── .env.docker                        # Environment file for Docker Compose
├── requirements.txt                   # Production Python dependencies
├── API DOCUMENTATION.md               # Complete REST API specification
├── apidocstatic/                      # Interactive static API documentation
│   └── index.html                     # Swagger-style interactive doc viewer
├── .dockerignore                      # Docker build exclusions
└── .gitignore                         # Git ignore patterns (includes frontend/)
```

### 🎨 Frontend Repository (`frontend/`)

```
frontend/                              # Standalone Frontend Application
├── index.html                         # Landing page with video carousel & category filter
├── css/
│   └── main.css                       # Comprehensive design system, dark/light themes & utilities
├── js/
│   ├── config.js                      # Centralized API configuration & runtime domain overrides
│   ├── api.js                         # DRF API client, token management & error extraction
│   ├── main.js                        # Theme toggle, mobile sidebar & strict route protection
│   ├── auth.js                        # Login, signup & password reset forms (handles next param)
│   ├── dashboard.js                   # Bookings management & activity dashboard
│   ├── mart.js                        # Marketplace listings, filters & product upload modal
│   ├── profile.js                     # Profile settings, category chips & provider upgrade
│   ├── services.js                    # Service provider discovery & category filter pills
│   ├── service-detail.js              # Provider detail, direct booking, reviews & reports
│   ├── service-detail-guest.js        # Read-only provider details for unauthenticated guests
│   ├── product-detail.js              # Product gallery, buyer comments & seller replies
│   └── product-detail-guest.js        # Read-only product details for unauthenticated guests
├── html/
│   ├── dashboard.html                 # User bookings & profile activity dashboard
│   ├── login.html                     # Login page with password reset modal
│   ├── signup.html                    # Registration page
│   ├── profile.html                   # User profile settings & provider mode
│   ├── services.html                  # Service discovery and search
│   ├── service-detail.html            # Provider booking, review & report interface
│   ├── service-detail-guest.html      # Guest-accessible provider view
│   ├── mart.html                      # Marketplace product listings
│   ├── product-detail.html            # Product inquiry & comment interface
│   └── product-detail-guest.html      # Guest-accessible product view
└── static/                            # Video slides, category icons & visual assets
```

---

## 📋 Prerequisites

Before setting up LocalSeva, ensure you have the following installed on your system:

### Required Software

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
  - Verify: `python --version` or `python3 --version`
- **pip** - Python package manager (comes with Python)
  - Verify: `pip --version`
- **Redis server** - Required for API caching
  - Verify: `redis-cli ping` (should return PONG)
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
3. Navigate to `frontend` folder
4. Right-click on `index.html`
5. Select **"Open with Live Server"**

✅ **Frontend opens automatically at:** `http://localhost:5500` or `http://127.0.0.1:5500`

**Advantages:**
- Auto-reload on file changes
- Best development experience
- Cross-domain API integration enabled out-of-the-box

#### Method B: Using Python HTTP Server

```bash
# Navigate to frontend directory
cd frontend

# Start simple HTTP server on port 3000
python -m http.server 3000
```

✅ **Frontend is now accessible at:** `http://localhost:3000`

**To stop the server:** Press `Ctrl+C`

#### Method C: Direct File Access

```bash
# Open the HTML file in browser
cd frontend
start index.html       # On Windows
open index.html        # On macOS
xdg-open index.html    # On Linux
```

### ⚙️ Cross-Domain Configuration

1. **Frontend API URL (`frontend/js/config.js`):**
   ```javascript
   // Default is http://127.0.0.1:8000/api/user/
   // To override for a staging or production backend without rebuilding:
   localStorage.setItem('LOCALSEVA_API_BASE_URL', 'https://api.yourdomain.com/api/user/');
   ```

---

## 🐳 Containerization & Docker Deployment

LocalSeva provides enterprise-grade containerization for its backend services, enabling reproducible deployments across development, staging, and production environments.

### 🏗️ Container Architecture

The backend infrastructure consists of three interconnected services:

```
                      ┌─────────────────────────────────────────┐
                      │        Docker Bridge Network            │
                      │            (localseva-net)              │
                      │                                         │
┌────────────────┐    │   ┌─────────────────────────────────┐   │
│ Frontend App   │────┼──▶│ localseva_backend (Port: 8000)  │   │
│ (Any Domain)   │    │   └───────────────┬─────────────────┘   │
└────────────────┘    │                   │                     │
                      │         ┌─────────┴─────────┐           │
                      │         ▼                   ▼           │
                      │   ┌───────────┐       ┌───────────┐     │
                      │   │ postgres  │       │   redis   │     │
                      │   │ (Port 5432│       │ (Port 6379│     │
                      │   │  DB Data) │       │   Cache)  │     │
                      │   └─────┬─────┘       └───────────┘     │
                      │         │                               │
                      └─────────┼───────────────────────────────┘
                                ▼
                   localseva_postgres_data (Persistent Volume)
```

### 📄 Docker Files Overview

| File | Purpose | Description |
|---|---|---|
| **`Dockerfile`** | Backend Image Specification | Uses official `python:3` base, sets up `/app` working directory, caches pip dependencies, copies project files, exposes port `8000`, and launches the Django development/production server. |
| **`localseva-docker-compose.yaml`** | Full-Stack Orchestration | Defines all three services (`backend`, `postgres`, `redis`) connected to the external network `localseva-net` and persistent volume `localseva_postgres_data`. |
| **`localseva_backend.yaml`** | Standalone Backend Compose | Runs only the Django backend container (`localseva_backend:1.1`) mapped to port `8000:8000`, loading environment variables from `.env.docker`. |
| **`localseva_postgres.yaml`** | Standalone PostgreSQL Compose | Runs PostgreSQL 16 on port `5432:5432` with credentials loaded from environment variables and data persisted in `localseva_postgres_data`. |
| **`localseva_redis.yaml`** | Standalone Redis Compose | Runs Redis 8.10 cache server exposed on port `6379:6379` connected to `localseva-net`. |
| **`.env.docker`** | Docker Environment File | Pre-configured environment variables tailored for inter-container communication (e.g., `DB_HOST=postgres`, `REDIS_URL=redis://redis:6379/0`). |
| **`.dockerignore`** | Build Exclusions | Prevents build bloat by excluding `.venv/`, `.git/`, media dumps, local test artifacts, and `__pycache__`. |

---

### 🚀 Running with Docker Compose

Follow these steps to spin up the containerized backend:

#### Step 1: Create the Shared Docker Network and Volume

The Compose configurations use `external: true` for the network and volume so that services can be restarted independently without data loss:

```bash
# Create shared bridge network
docker network create localseva-net

# Create persistent volume for PostgreSQL data
docker volume create localseva_postgres_data
```

#### Step 2: Build the Backend Docker Image

```bash
# Build the backend image with tag localseva_backend:1.1
docker build -t localseva_backend:1.1 .
```

#### Step 3: Launch Services

**Option A — Launch Full Stack (Recommended):**
```bash
# Start backend, postgres, and redis together
docker compose -f localseva-docker-compose.yaml up -d
```

**Option B — Launch Services Independently (Modular):**
```bash
# Start PostgreSQL database
docker compose -f localseva_postgres.yaml up -d

# Start Redis cache
docker compose -f localseva_redis.yaml up -d

# Start Backend API
docker compose -f localseva_backend.yaml up -d
```

#### Step 4: Run Migrations and Create Admin User

```bash
# Apply database migrations inside the backend container
docker exec -it localseva_backend python localseva_backend/manage.py migrate

# Create a Django superuser
docker exec -it localseva_backend python localseva_backend/manage.py createsuperuser
```

#### Step 5: Stop Services

```bash
# Stop all containers
docker compose -f localseva-docker-compose.yaml down
```

---

## ⚙️ Configuration & Environment Variables

### 🔐 Detailed Environment Variables Guide (`.env.example`)

All configurable settings are declared in `.env.example`. Copy this file to `.env` (for local development) or `.env.docker` (for Docker deployment):

```bash
cp .env.example .env
```

| Variable | Type | Default / Example | Description |
|---|---|---|---|
| **`SECRET_KEY`** | string | *random string* | **Required in production.** Cryptographic signing key for Django sessions, password reset hashes, and CSRF protection. In local dev (`DEBUG=True`), falls back to a safe dev key. |
| **`DEBUG`** | boolean | `True` | Set to `True` for development (detailed error traces). Set to `False` in production (enforces secure cookies and generic 500 error pages). |
| **`USE_POSTGRES`** | boolean | `True` or `False` | **Database engine selector.** When `True`, connects to PostgreSQL using the credentials below. When `False`, uses local file-based SQLite (`db.sqlite3`). |
| **`DB_NAME`** | string | `localseva_db` | PostgreSQL database name. Must match `POSTGRES_DB` in Compose. |
| **`DB_USER`** | string | `postgres` | PostgreSQL username. |
| **`DB_PASSWORD`** | string | `your_secure_password` | PostgreSQL user password. |
| **`DB_HOST`** | string | `postgres` or `localhost` | Database host. Use `postgres` inside Docker network, or `localhost`/`127.0.0.1` for local native execution. |
| **`DB_PORT`** | integer | `5432` | PostgreSQL listening port. |
| **`REDIS_URL`** | URI | `redis://redis:6379/0` | Connection string for Redis cache backend. Provider listings and marketplace queries are cached here. Use `redis://localhost:6379/0` if running Redis natively. |
| **`CLOUD_NAME`** | string | *optional* | Cloudinary cloud name for cloud media storage (avatars, product images). |
| **`API_KEY`** | string | *optional* | Cloudinary API key. |
| **`API_SECRET`** | string | *optional* | Cloudinary API secret. |
| **`SMTP_SERVER`** | string | `smtp.gmail.com` | SMTP email server hostname for sending OTP password resets. |
| **`SMTP_PORT`** | integer | `587` | SMTP port (defaults safely to `587` if omitted). |
| **`EMAIL_USE_TLS`** | boolean | `True` | Enable TLS encryption for outgoing email. |
| **`DEFAULT_EMAIL_FROM`**| string | `your-email@gmail.com` | From-address displayed on password reset emails. |
| **`APP_PASS`** | string | *app password* | Google App Password (or SMTP authentication password). |
| **`ALLOWED_ORIGINS`** | string | `http://localhost:3000,http://localhost:5500` | **Cross-Domain CORS Allowlist.** Comma-separated list of origins permitted to make authenticated cross-domain API requests. |
| **`ALLOWED_HOSTS`** | string | `*` or `api.yourdomain.com` | Comma-separated list of allowed host/domain headers that the Django backend can serve. |

---

### 🌐 Frontend Configuration (`frontend/js/config.js`)

Because the frontend is a separate application, its API destination is managed via `frontend/js/config.js`:

```javascript
// Default API Base URL
const defaultApiBase = "http://127.0.0.1:8000/api/user/";

// Runtime override via localStorage (zero-rebuild deployment)
const storedApiBase = localStorage.getItem("LOCALSEVA_API_BASE_URL");

const config = {
  API_BASE_URL: storedApiBase || defaultApiBase,
  CANONICAL_CATEGORIES: [
    "CARPENTRY", "CLEANING", "ELECTRICAL", "FITNESS", "PLUMBING", "TUTORING"
  ],
};
```

**Switching environments in the browser without rebuilding:**
```javascript
// Open DevTools console on the frontend and run:
setApiBaseUrl('https://api.yourproductiondomain.com/api/user/');
// To reset back to default:
localStorage.removeItem('LOCALSEVA_API_BASE_URL');
```

---

## 📱 Application Pages

The frontend application provides a complete, responsive user experience structured across public and protected routes:

### 🌍 Public Pages (No Authentication Required)

| Page | File | URL Path | Description |
|---|---|---|---|
| **Landing / Home** | `index.html` | `/index.html` | Hero video carousel, interactive category filters, top service providers preview, and dark/light mode toggle. |
| **Services Discovery** | `services.html` | `/html/services.html` | Searchable directory of service providers with canonical category pills, location filters, and rating badges. |
| **Service Details (Guest)** | `service-detail-guest.html` | `/html/service-detail-guest.html?id=:id` | Read-only view of a service provider's profile, rates, reviews, and experience. Prompt to log in to book or review. |
| **Marketplace** | `mart.html` | `/html/mart.html` | Peer-to-peer product listings with price filters, condition tags, and search. |
| **Product Details (Guest)** | `product-detail-guest.html` | `/html/product-detail-guest.html?id=:id` | Product photo gallery, description, condition, and public buyer inquiries. |
| **Login** | `login.html` | `/html/login.html` | User login with demo credentials shortcut, forgot password modal, and `next` URL redirect support. |
| **Sign Up** | `signup.html` | `/html/signup.html` | User registration with auto-login token generation. |

### 🔒 Protected Pages (Authentication Required)

| Page | File | URL Path | Description |
|---|---|---|---|
| **User Dashboard** | `dashboard.html` | `/html/dashboard.html` | Customer and provider booking overview, status tracking (`PENDING` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED`), and cancel actions. |
| **User Profile** | `profile.html` | `/html/profile.html` | Profile management, avatar upload, and Service Provider upgrade mode with canonical category multi-select chips. |
| **Service Details (Interactive)** | `service-detail.html` | `/html/service-detail.html?id=:id` | Direct service booking modal with future date-time picker, review submission, and safety reporting form. |
| **Product Details (Interactive)** | `product-detail.html` | `/html/product-detail.html?id=:id` | Product comments system, buyer questions, and direct seller replies. |

### 🛠️ Administration & Documentation

| Interface | URL Path | Description |
|---|---|---|
| **Django Admin Panel** | `http://localhost:8000/admin/` | Full database management, user verification, report moderation, and booking inspection. |
| **Interactive API Docs** | `/apidocstatic/index.html` | Swagger-style interactive API documentation viewer. |

---