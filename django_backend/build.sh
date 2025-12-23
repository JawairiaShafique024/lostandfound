  #!/usr/bin/env bash

set -o errexit  # exit on error

pip install -r requirements.txt

cd django_backend/lostandfound_backend

python manage.py collectstatic --no-input
python manage.py migrate
