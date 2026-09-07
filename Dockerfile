# Dockerfile for LocalSeva

#Base Image 
FROM python:3

#wrking directory
WORKDIR /app

#set up requirements
COPY requirements.txt .

#install dependencies
RUN pip install --no-cache-dir -r requirements.txt

#copy project files
COPY . .

#expose port
EXPOSE 8000

#cmd to run the application
CMD ["python", "localseva_backend/manage.py", "runserver", "0.0.0.0:8000"]