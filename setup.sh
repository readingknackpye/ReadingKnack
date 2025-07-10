#!/bin/bash

echo "🚀 Setting up Reading Knack..."
echo "================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Backend Setup
echo ""
echo "📦 Setting up Django Backend..."
cd readingknack-backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Set up initial data
echo "Setting up initial data..."
python manage.py setup_initial_data

echo "✅ Backend setup complete!"

# Frontend Setup
echo ""
echo "⚛️ Setting up React Frontend..."
cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup complete! To start the application:"
echo ""
echo "1. Start the Django backend:"
echo "   cd readingknack-backend"
echo "   source .venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. Start the React frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open your browser to:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Admin Panel: http://localhost:8000/admin"
echo ""
echo "📚 Happy reading with Reading Knack!" 