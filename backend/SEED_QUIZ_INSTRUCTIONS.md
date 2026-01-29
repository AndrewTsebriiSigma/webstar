# How to Seed Quiz Data

The quiz data needs to be seeded into the database before the quiz system will work.

## Steps:

1. **Activate your virtual environment:**
   ```bash
   cd webstar/backend
   source venv/bin/activate
   ```

2. **Run the seed script:**
   ```bash
   python seed_quiz.py
   ```

3. **Verify it worked:**
   You should see output like:
   ```
   ✅ Seeded quiz 'Discover Your Hidden Skills' with 8 questions
   Quiz ID: 1, Slug: discover-hidden-skills
   ```

## Alternative: Using Python directly

If you don't have a virtual environment, you can run:
```bash
cd webstar/backend
python3 -m pip install -r requirements.txt  # if needed
python3 seed_quiz.py
```

## Troubleshooting

If you get "Quiz already exists", that's fine - it means the data is already seeded.

If you get import errors, make sure you're in the backend directory and have all dependencies installed.
