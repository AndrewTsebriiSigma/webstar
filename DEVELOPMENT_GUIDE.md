# WebStar V1 - Development Guide

This guide provides comprehensive instructions for setting up and running the WebStar V1 project in development mode.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Servers](#running-the-servers)
5. [Development Workflow](#development-workflow)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Project Structure](#project-structure)
8. [Environment Variables](#environment-variables)
9. [API Testing](#api-testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Python 3.11+** - Backend runtime
  - Check version: `python --version` or `python3 --version`
  - Download: https://www.python.org/downloads/

- **Node.js 18+** - Frontend runtime
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm** (comes with Node.js) - Package manager for frontend
  - Check version: `npm --version`

- **pip** (comes with Python) - Package manager for backend
  - Check version: `pip --version` or `pip3 --version`

### Optional but Recommended

- **Git** - Version control
- **VS Code** or your preferred IDE
- **PostgreSQL** (for production-like testing, optional)

---

## ⚡ Quick Start

For experienced developers who want to get started immediately:

```bash
# 1. Clone the repository (if not already done)
cd webstar

# 2. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ENV_EXAMPLE.txt .env
# Edit .env file with your settings (at minimum, set SECRET_KEY)

# 3. Frontend Setup
cd ../frontend
npm install
cp ENV_EXAMPLE.txt .env.local
# Edit .env.local file (defaults should work for local development)

# 4. Start Backend (Terminal 1)
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. Start Frontend (Terminal 2)
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📚 Detailed Setup

### Step 1: Backend Setup

#### 1.1 Navigate to Backend Directory

```bash
cd webstar/backend
```

#### 1.2 Create Virtual Environment

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt when activated.

#### 1.3 Install Dependencies

```bash
pip install -r requirements.txt
```

This installs all required Python packages including:
- FastAPI
- SQLModel
- Uvicorn
- Pydantic
- JWT libraries
- And more...

#### 1.4 Configure Environment Variables

```bash
# Copy the example environment file
cp ENV_EXAMPLE.txt .env

# Edit .env file (use your preferred editor)
# Minimum required changes:
# 1. Set SECRET_KEY (generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))")
# 2. Verify DATABASE_URL (default SQLite is fine for development)
# 3. Verify CORS_ORIGINS includes http://localhost:3000
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as the `SECRET_KEY` value in your `.env` file.

**Example .env file (minimal for development):**
```env
ENVIRONMENT=development
SECRET_KEY=your-generated-secret-key-here
DATABASE_URL=sqlite:///./webstar.db
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
BASE_URL=http://localhost:8000
```

#### 1.5 Verify Backend Installation

```bash
# Test that the app can be imported
python -c "from app.main import app; print('✓ Backend setup successful')"
```

If you see the success message, your backend is configured correctly!

---

### Step 2: Frontend Setup

#### 2.1 Navigate to Frontend Directory

```bash
cd webstar/frontend
```

#### 2.2 Install Dependencies

```bash
npm install
```

This installs all required Node.js packages including:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios
- And more...

#### 2.3 Configure Environment Variables

```bash
# Copy the example environment file
cp ENV_EXAMPLE.txt .env.local

# Edit .env.local file (use your preferred editor)
# Default values should work for local development
```

**Example .env.local file (minimal for development):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=WebStar
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2.4 Verify Frontend Installation

```bash
# Check that dependencies installed correctly
npm list --depth=0
```

If you see no errors, your frontend is configured correctly!

---

## 🚀 Running the Servers

### Method 1: Manual (Recommended for Development)

You'll need **two terminal windows/tabs** - one for backend, one for frontend.

#### Terminal 1: Backend Server

```bash
cd webstar/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**What you'll see:**
```
INFO:     Will watch for changes in these directories: ['/path/to/webstar/backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Backend is running!** Keep this terminal open.

**Test it:** Open http://localhost:8000/docs in your browser to see the API documentation.

#### Terminal 2: Frontend Server

```bash
cd webstar/frontend
npm run dev
```

**What you'll see:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ **Frontend is running!** Keep this terminal open.

**Test it:** Open http://localhost:3000 in your browser.

---

### Method 2: Using Helper Scripts (Coming Soon)

For convenience, you can create helper scripts to start both servers simultaneously.

---

## 💻 Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `webstar/backend/app/`
   - Uvicorn with `--reload` flag automatically restarts the server when you save changes
   - Check the terminal for any errors

2. **Frontend Changes:**
   - Edit files in `webstar/frontend/src/`
   - Next.js hot-reloads automatically when you save changes
   - Check the browser console and terminal for any errors

### Database Changes

The backend uses SQLModel which automatically creates tables on first run. If you modify models:

```bash
# The database will be recreated on next server start
# For SQLite, you can delete webstar.db to start fresh:
rm backend/webstar.db  # macOS/Linux
# or manually delete the file on Windows
```

⚠️ **Note:** This will delete all data. For production, use proper migrations.

### API Testing

While developing, you can test your API endpoints using:

1. **Interactive API Docs (Swagger UI):**
   - Open http://localhost:8000/docs
   - Test endpoints directly in the browser

2. **Alternative API Docs (ReDoc):**
   - Open http://localhost:8000/redoc

3. **Command Line (curl):**
   ```bash
   # Example: Health check
   curl http://localhost:8000/health
   
   # Example: Register a user
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","username":"testuser"}'
   ```

---

## 🐛 Common Issues & Solutions

### Port Already in Use

**Error:** `Address already in use` or `Port 3000/8000 is already in use`

**Solution:**
```bash
# macOS/Linux: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# macOS/Linux: Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Windows (PowerShell):
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Backend: Module Not Found

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
- Make sure you're in the `backend` directory
- Ensure virtual environment is activated (`venv` should appear in prompt)
- Reinstall dependencies: `pip install -r requirements.txt`

### Backend: Database Errors

**Error:** Database connection or table errors

**Solution:**
```bash
# Delete the database file and restart the server
rm backend/webstar.db  # macOS/Linux
# Database will be recreated automatically
```

### Frontend: Module Not Found

**Error:** `Module not found: Can't resolve '...'`

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json  # macOS/Linux
# or delete these folders manually on Windows
npm install
```

### Frontend: API Connection Errors

**Error:** `Network Error` or `Cannot connect to backend`

**Solution:**
1. Verify backend is running on http://localhost:8000
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Restart the frontend server after changing `.env.local`
4. Check CORS settings in backend `.env` file

### Python Version Issues

**Error:** `Python 3.11+ required`

**Solution:**
- Install Python 3.11 or newer
- Use `python3` command instead of `python` if needed
- Verify: `python3 --version`

### Node Version Issues

**Error:** `Node.js 18+ required`

**Solution:**
- Install Node.js 18 or newer
- Use `nvm` (Node Version Manager) to manage versions:
  ```bash
  nvm install 18
  nvm use 18
  ```

---

## 📁 Project Structure

```
webstar/
├── backend/                 # FastAPI Backend
│   ├── app/                 # Main application code
│   │   ├── core/            # Configuration & security
│   │   │   ├── config.py    # Settings loader
│   │   │   └── security.py  # JWT & password hashing
│   │   ├── db/              # Database
│   │   │   ├── base.py      # DB connection & session
│   │   │   └── models.py    # SQLModel models
│   │   ├── deps/            # FastAPI dependencies
│   │   │   └── auth.py      # Authentication dependencies
│   │   ├── routers/         # API endpoints
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── profile.py   # Profile routes
│   │   │   ├── portfolio.py # Portfolio routes
│   │   │   └── ...          # More routers
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py          # FastAPI app instance
│   ├── uploads/             # File uploads (development)
│   ├── .env                 # Environment variables (create from ENV_EXAMPLE.txt)
│   ├── requirements.txt     # Python dependencies
│   └── webstar.db           # SQLite database (created automatically)
│
├── frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── auth/        # Auth pages
│   │   │   ├── onboarding/  # Onboarding flow
│   │   │   └── [username]/  # Profile pages
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   └── lib/             # Utilities & API client
│   │       ├── api.ts       # Axios API client
│   │       └── types.ts     # TypeScript types
│   ├── public/              # Static assets
│   ├── .env.local           # Environment variables (create from ENV_EXAMPLE.txt)
│   └── package.json         # Node.js dependencies
│
└── README.md                # Project overview
└── DEVELOPMENT_GUIDE.md     # This file
```

---

## 🔐 Environment Variables

### Backend (.env)

**Required:**
- `SECRET_KEY` - JWT signing key (generate with Python secrets module)
- `DATABASE_URL` - Database connection string
- `CORS_ORIGINS` - Allowed frontend origins

**Optional:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `AWS_*` - For S3 file storage (production)
- Various other configuration options

See `backend/ENV_EXAMPLE.txt` for all options.

### Frontend (.env.local)

**Required:**
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Optional:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - For Google OAuth
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Application URL

See `frontend/ENV_EXAMPLE.txt` for all options.

⚠️ **Important:** 
- Frontend env vars must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- Restart servers after changing environment variables
- Never commit `.env` or `.env.local` files to version control

---

## 🧪 API Testing

### Using Swagger UI (Recommended)

1. Start the backend server
2. Open http://localhost:8000/docs
3. Click "Authorize" and enter your JWT token (if needed)
4. Try endpoints directly in the browser

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "username": "testuser"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'

# Get profile (with token)
curl http://localhost:8000/api/profiles/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman/Insomnia

1. Import the OpenAPI spec from http://localhost:8000/openapi.json
2. Set up environment variables for base URL
3. Use the "Authorize" button to set JWT tokens

---

## 🔍 Troubleshooting

### Server Won't Start

1. **Check port availability:**
   ```bash
   # See what's using the port
   lsof -i :8000  # macOS/Linux
   netstat -ano | findstr :8000  # Windows
   ```

2. **Check logs:**
   - Backend: Look at terminal output for error messages
   - Frontend: Check browser console and terminal output

3. **Verify dependencies:**
   ```bash
   # Backend
   pip list
   
   # Frontend
   npm list --depth=0
   ```

### Database Issues

1. **Reset database:**
   ```bash
   rm backend/webstar.db
   # Restart backend server to recreate
   ```

2. **Check database file permissions:**
   ```bash
   ls -la backend/webstar.db
   ```

### Build Errors

1. **Clear caches:**
   ```bash
   # Frontend
   cd frontend
   rm -rf .next node_modules
   npm install
   
   # Backend
   cd backend
   rm -rf __pycache__ .venv
   pip install -r requirements.txt
   ```

### Performance Issues

1. **Backend slow:**
   - Check if database file is corrupted
   - Verify virtual environment is activated
   - Check for infinite loops in code

2. **Frontend slow:**
   - Clear browser cache
   - Check for console errors
   - Verify Next.js is in development mode (not production build)

---

## 📝 Development Tips

1. **Use Hot Reload:** Both servers support hot reload. Just save files and see changes instantly.

2. **Check API Docs:** Always refer to http://localhost:8000/docs when working with API endpoints.

3. **Browser DevTools:** Use browser DevTools (F12) to inspect network requests and console errors.

4. **Terminal Logs:** Keep an eye on both terminal windows for error messages.

5. **Git Workflow:** Commit working code frequently. Use meaningful commit messages.

6. **Environment Variables:** Never commit `.env` files. Use `.env.example` files as templates.

7. **Database:** For development, SQLite is fine. For production, use PostgreSQL.

8. **Testing:** Test your changes in the browser immediately after making them.

---

## 🎓 Next Steps

Once you have the development environment running:

1. **Explore the Codebase:**
   - Read `README.md` for project overview
   - Check API docs at http://localhost:8000/docs
   - Browse the code structure

2. **Create Your Account:**
   - Go to http://localhost:3000
   - Register a new account
   - Complete the onboarding flow
   - Build your profile

3. **Start Developing:**
   - Pick a feature to work on
   - Make changes
   - Test thoroughly
   - Commit your work

---

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. Check the terminal output for error messages
2. Review the browser console for frontend errors
3. Check API docs for endpoint details
4. Review this guide's troubleshooting section
5. Check the main README.md for additional context

---

## ✅ Quick Checklist

Before starting development, ensure:

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Backend virtual environment created and activated
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend `.env` file created and configured
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env.local` file created and configured
- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Can access http://localhost:8000/docs in browser

---

**Happy Coding! 🚀**

