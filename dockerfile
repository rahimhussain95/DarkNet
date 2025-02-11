FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-k", "eventlet", "-b", "0.0.0.0:8000", "app:app"]