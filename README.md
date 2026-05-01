# BidiiElimu

**BidiiElimu** is a comprehensive, multi-tenant SaaS School Management Platform designed to streamline administrative tasks, enhance communication between teachers, students, and parents, and provide robust analytics and grading systems.

## Features

- **Role-Based Access Control (RBAC):** Dedicated portals and secure access for Super Admins, School Admins, Teachers, Students, and Parents.
- **Academic Management:** Comprehensive tools for managing classes, subjects, exams, grading, and generating report cards.
- **Attendance Tracking:** Easy attendance marking and reporting.
- **Financial Management:** Track fee payments, balances, and financial reporting.
- **Communication Hub:** Built-in messaging and notifications to keep stakeholders informed.
- **Analytics Dashboard:** Real-time insights into school performance, student demographics, and financial health.
- **Audit Logging:** System-wide tracking of critical administrative actions.

## Technology Stack

- **Backend:** Python, Django 6, Django REST Framework, Celery, Redis, PostgreSQL/SQLite.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand (State Management), React Query.
- **Mobile/Native:** Capacitor (Android).

## Project Structure

- `/backend/` - Django REST API codebase, settings, models, and celery workers.
- `/frontend/` - React SPA (Single Page Application) built with Vite and Tailwind.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis (for caching and celery workers, optional for basic dev)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up the Python virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend will typically run on `http://localhost:5173/`.

## API Documentation
Once the backend is running, the interactive Swagger UI API documentation can be accessed at:
- `http://localhost:8000/api/schema/swagger-ui/`
