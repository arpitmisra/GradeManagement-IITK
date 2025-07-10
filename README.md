# Grade Management System – IIT Kanpur

This is a custom-built **Grade Management System** developed for professors at IIT Kanpur to manage course evaluation components, student marks, and flexible grading policies (like "best of N" quizzes). It supports **professor and student dashboards**, with role-based functionality and secure authentication.


## Technology Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React.js
- **Database**: PostgreSQL (for development)
- **Auth**: Cookie(or Session)-based login with Django's built-in User model
  

## Repository Structure
GRADEMNGMNTSYS/               ← Project's root directory
│
├── api/                      ← Django app with models, views, routings, APIs
│
├── frontend/                 ← React frontend (for both Professor and Students)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── professor_portal/         ← Professor Specific APIs (backend)
├── student_portal/           ← Student Specific APIs (backend)
│
├── gradeMngmntSys/           ← Django project root (settings.py, urls.py, etc.)
│
├── db.sqlite3
└── manage.py


## Features

### Professors:
- Register/Login
- Assign themselves to courses and batches
- Define evaluation components (quizzes, midsem, endsem)
- Set weightages and "best-of" rules
- Bulk Upload grades for all evaluation components (in any order of roll numbers)
- Upload grades separately for each evaluation component
- Bulk and Individual Manual Registration of students from Professor's side
- Manual Updation of scores separately for each evaluation component
- Download a CSV with any custom format, and upload a CSV with a custom order of roll_numbers to download the CSV in that particular format
- View batch-wise average scores
- Delete course assignments

### Students:
- Register/Login
- View their final scores for each enrolled course along with batch and professor

---

### How to Run Locally (for Professor)

## 1. Setup Backend

# Prerequisites:
- Python 3.10+
- pip

# Steps:

# Clone the repository
git clone https://github.com/arpitmisra/GradeManagement-IITK.git
---
cd GradeManagement-IITK/gradeMngmntSys

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (for admin login)
python manage.py createsuperuser

# Run the backend server (inside folder's root directory)
python manage.py runserver

This will start the Backend server at http://localhost:8000


## 2. Setup Frontend
Prerequisites:
Node.js + npm

---

# Steps:
# In a new terminal
cd ../react-frontend
npm install
npm start

This will start the React app on: **http://localhost:3000**

---

## 3. Quick Test
Log in as superuser at http://localhost:8000/admin/ and verify models.

Register a new professor at http://localhost:3000/register/professor/

Assign course and batch, define evaluation structure.

Register a student and view their final score in http://localhost:3000/student/dashboard/
