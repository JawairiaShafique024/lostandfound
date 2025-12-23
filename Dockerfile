# ---------- Stage 1: React Build ----------
FROM node:20 AS react-build

WORKDIR /app

# Copy React dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . ./

# Build React (Vite build folder is 'dist')
RUN npm run build

# ---------- Stage 2: Django Backend ----------
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (for some Python packages)
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*



# Copy Django requirements and install
COPY django_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 

# Copy Django project
COPY django_backend/ .

# Copy React build into Django static folder
COPY --from=react-build /app/dist ./static

# Collect static files
RUN python manage.py collectstatic --no-input

# Expose port
EXPOSE 8000

# Start Django with Gunicorn
CMD ["gunicorn", "lostandfound_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
