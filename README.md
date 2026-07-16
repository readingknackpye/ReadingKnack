# Reading Knack 📚

A full-stack web application for uploading, reading, and quizzing over reading passages. Perfect for students and teachers looking to improve reading comprehension skills.

## Features ✨

- **Document Upload**: Upload .docx files and automatically parse content
- **Reading Interface**: Clean, distraction-free reading experience
- **Interactive Quizzes**: Multiple-choice questions with instant feedback
- **Progress Tracking**: View quiz results and performance analytics
- **Grade Level & Skill Categories**: Organize content by educational standards
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Admin Panel**: Manage documents, questions, and user responses

## Tech Stack 🛠️

### Backend

- **Django 4.2**: Python web framework
- **Django REST Framework**: API development
- **SQLite**: Database (can be easily switched to PostgreSQL)
- **python-docx**: Document parsing
- **CORS Headers**: Cross-origin resource sharing

### Frontend

- **React 19**: JavaScript library for building user interfaces
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **TailwindCSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons

## Quick Start 🚀

### Prerequisites

- Python 3.12 (required — newer versions like 3.13/3.14 aren't yet supported by all dependencies)
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/readingknackpye/ReadingKnack
   cd ReadingKnack
   ```

2. **Create and activate virtual environment**

   ```bash
   python3.12 -m venv .venv       # On Windows: py -3.12 -m venv .venv
   source .venv/bin/activate      # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**

   ```bash
   python3 manage.py migrate
   ```

5. **Set up initial data**

   ```bash
   python3 manage.py setup_initial_data
   ```

6. **Create superuser (optional)**

   ```bash
   python3 manage.py createsuperuser
   ```

7. **Start the development server**
  
   ```bash
   python3 manage.py runserver
   ```

The Django backend will be available at `http://localhost:8000`

### Available Pages

Once the backend is running, these are available in your browser:

- `http://localhost:8000/admin/` — Django admin panel (log in with your superuser)
- `http://localhost:8000/login/` — Login page
- `http://localhost:8000/signup/` — Sign-up page
- `http://localhost:8000/upload/` — Document upload page
- `http://localhost:8000/api/` — Browsable REST API root

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The React frontend will be available at `http://localhost:3000`

## API Endpoints 📡

### Documents

- `GET /api/documents/` - List all documents
- `POST /api/documents/` - Upload new document
- `GET /api/documents/{id}/` - Get document details
- `GET /api/documents/{id}/detail/` - Get document with questions

### Questions

- `GET /api/questions/` - List all questions
- `GET /api/questions/?document_id={id}` - Get questions for document
- `POST /api/questions/` - Create new question

### Quiz

- `POST /api/submit-quiz/` - Submit quiz responses
- `GET /api/responses/` - Get quiz responses

### Metadata

- `GET /api/grade-levels/` - List grade levels
- `GET /api/skill-categories/` - List skill categories

## Usage Guide 📖

### For Teachers

1. **Upload Documents**

   - Navigate to the Upload page
   - Enter a descriptive title
   - Select a .docx file (max 10MB)
   - Choose grade level and skill category (optional)
   - Click "Upload Document"

2. **Create Quiz Questions**

   - Access the Django admin panel at `/admin`
   - Navigate to "Quiz questions" section
   - Add questions for your uploaded documents
   - Create multiple-choice answers with one correct option
   - Add explanations for educational value

3. **Monitor Progress**
   - View quiz responses in the admin panel
   - Track student performance and identify areas for improvement

### For Students

1. **Browse Passages**

   - Visit the Documents page to see all available passages
   - Use filters to find content by grade level or skill category
   - Search for specific topics or titles

2. **Read and Learn**

   - Click on any passage to read the full content
   - Take your time to understand the material
   - Review any associated quiz questions

3. **Take Quizzes**
   - Click "Take Quiz" on any passage
   - Enter your name to track your progress
   - Answer all questions thoughtfully
   - Submit to see your results and review explanations

## Project Structure 📁

```
readingknack-backend/
├── config/                 # Django project settings
├── passages/              # Main Django app
│   ├── models.py          # Database models
│   ├── views.py           # API views and logic
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # URL routing
│   ├── admin.py           # Admin interface
│   └── management/        # Custom management commands
├── media/                 # Uploaded files
├── static/                # Static files
└── requirements.txt       # Python dependencies

frontend/
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/            # Page components
│   ├── api.js            # API service functions
│   ├── App.js            # Main app component
│   └── index.js          # App entry point
├── public/               # Static assets
└── package.json          # Node.js dependencies
```

## Customization 🎨

### Adding New Features

1. **New Models**: Add to `passages/models.py` and run migrations
2. **New API Endpoints**: Create views in `passages/views.py` and add URLs
3. **New Frontend Pages**: Create components in `frontend/src/pages/`
4. **Styling**: Modify Tailwind classes or add custom CSS

### Deployment

#### Backend (Django)

- **Railway**: Easy deployment with automatic database setup
- **Render**: Free tier available with PostgreSQL
- **Heroku**: Classic Django deployment platform
- **DigitalOcean**: Full control with App Platform

#### Frontend (React)

- **Vercel**: Optimized for React with automatic deployments
- **Netlify**: Great for static sites with form handling
- **GitHub Pages**: Free hosting for public repositories

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you have any questions or need help:

1. Check the [Issues](https://github.com/yourusername/readingknack/issues) page
2. Create a new issue with a detailed description
3. Join our community discussions

## Roadmap 🗺️

- [ ] User authentication and profiles
- [ ] AI-powered question generation
- [ ] Advanced analytics and reporting
- [ ] Mobile app development
- [ ] Integration with learning management systems
- [ ] Multi-language support
- [ ] Collaborative features for teachers

---

**Built with ❤️ for better reading comprehension**
​