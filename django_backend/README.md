# Lost & Found Hub - Django Backend

## Setup Instructions

1. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run Migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

3. **Create Superuser:**
```bash
python manage.py createsuperuser
```

4. **Run Server:**
```bash
python manage.py runserver
```

## API Endpoints

- **Authentication:**
  - POST `/api/users/register/` - User registration
  - POST `/api/users/login/` - User login

- **Lost Items:**
  - GET `/api/lost-items/` - Get all lost items
  - POST `/api/lost-items/` - Create lost item

- **Found Items:**
  - GET `/api/found-items/` - Get all found items
  - POST `/api/found-items/` - Create found item

## Frontend Connection

The React frontend should connect to `http://localhost:8000/api/`
