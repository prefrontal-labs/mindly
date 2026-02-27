You are building "Mindly" — a Duolingo-style competitive exam preparation 
platform for Indian students targeting UPSC, GATE, JEE, CAT, and NEET exams.

## TECH STACK
- Backend: FastAPI (Python 3.11+)
- Database: PostgreSQL with SQLAlchemy (async) + Alembic migrations
- Cache: Redis via Upstash (for caching LLM responses + session data)
- Queue: Celery + Redis broker (for async LLM jobs)
- LLM: GROQ API using llama-3.3-70b-versatile
- Auth: JWT + refresh tokens (stored in HTTP-only cookies)
- Storage: Cloudflare R2 (for PDFs, images)
- Containerization: Docker + docker-compose

## PROJECT STRUCTURE
Create a clean architecture with this folder structure:
mindly-backend/
├── app/
│   ├── api/           # Route handlers
│   ├── agents/        # GROQ-powered AI agents
│   ├── core/          # Config, security, database
│   ├── models/        # SQLAlchemy ORM models
│   ├── schemas/       # Pydantic request/response schemas
│   ├── services/      # Business logic layer
│   ├── tasks/         # Celery background tasks
│   └── utils/         # Helpers (cache, token rotation)
├── alembic/           # DB migrations
├── tests/             # Pytest unit + integration tests
├── docker-compose.yml
├── Dockerfile
└── .env.example

## CORE MODULES TO BUILD

### 1. Authentication
- Register/Login with email + password (bcrypt hashed)
- JWT access token (15 min) + refresh token (7 days)
- Logout with token revocation via Redis blacklist
- Google OAuth2 (optional, add placeholder)

### 2. Student Profile
- Target exam selection (UPSC/GATE/JEE/CAT/NEET)
- Current knowledge level (beginner/intermediate/advanced)
- Available study hours per day
- Target exam date

### 3. AI Study Roadmap Agent (GROQ)
- Input: exam type + level + months available + weak subjects
- Output: week-by-week study plan in structured JSON
- Cache in Redis with 24hr TTL using profile hash as key
- If same profile exists in cache, skip GROQ call entirely
- Run as async Celery task, not blocking the API response
- Pydantic validation on GROQ output with retry on failure

### 4. Spaced Repetition Engine (SM-2 Algorithm)
- Flashcard model: topic, question, answer, difficulty (1-5)
- SM-2 fields: ease_factor, interval, repetitions, next_review_date
- Endpoint: GET /flashcards/due — returns cards due today for student
- Endpoint: POST /flashcards/review — submit rating (1-5), update schedule
- Bulk fetch due cards per subject for the day

### 5. Question & MCQ System
- Question model: stem, 4 options, correct answer, explanation, 
  subject, topic, difficulty, exam_type
- Endpoint: GET /questions/practice — filtered by exam/subject/difficulty
- Endpoint: POST /questions/submit — record attempt, check answer, 
  return explanation
- Track: time_taken, is_correct, confidence_rating (1-5) per attempt

### 6. AI Explanation Agent (GROQ - Live Call)
- Triggered when student answers wrong
- Input: question + student's wrong answer + correct answer
- Output: plain English explanation of why the correct answer is right
- This is a REAL-TIME call (not queued) — must respond in < 3 seconds
- Implement exponential backoff retry (max 2 retries) on GROQ errors

### 7. Metacognitive Calibration Tracker
- After each answer, student rates confidence (1-5)
- Store: confidence_rating alongside is_correct per attempt
- Weekly report endpoint: GET /analytics/calibration
  Returns: calibration score (confidence vs accuracy correlation), 
  overconfident topics, underconfident topics

### 8. Progress & Analytics
- Daily streak tracking (login + study activity)
- XP system: +10 XP correct answer, +5 XP flashcard reviewed, 
  +50 XP daily goal completed
- Leaderboard: top 10 students by XP this week (cached in Redis)
- Subject-wise accuracy breakdown

### 9. Gamification
- Streak model: current_streak, longest_streak, last_active_date
- Badges: "7-day streak", "First 100 questions", "GATE Master" etc.
- Daily goal: configurable target (e.g., 20 questions/day)

### 10. GROQ Integration Layer (Critical - Build This Carefully)
- Create a GroqClient wrapper class in app/utils/groq_client.py
- API key rotation: support up to 5 keys, round-robin via Redis counter
- Rate limit handling: catch 429 errors, wait and retry with next key
- Response caching: before every GROQ call, check Redis cache first
- Cache key format: MD5 hash of (prompt + model_name)
- Cache TTL: 24 hours for roadmaps, 1 hour for explanations
- Structured output: always request JSON from GROQ, 
  validate with Pydantic, retry once if invalid

## API DESIGN RULES
- All endpoints return: {success: bool, data: {}, message: str, errors: []}
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 422, 429, 500)
- Pagination on all list endpoints: ?page=1&limit=20
- Filtering on questions: ?exam=GATE&subject=DSA&difficulty=medium
- Request logging middleware: log method, path, status, duration, user_id
- Rate limiting: 100 req/min per user using Redis sliding window

## DATABASE MODELS
Build SQLAlchemy async models for:
- users (id, email, password_hash, name, created_at, is_active)
- student_profiles (user_id, exam_type, level, study_hours, target_date)
- flashcards (id, topic, question, answer, subject, exam_type, difficulty)
- flashcard_progress (user_id, flashcard_id, ease_factor, interval, 
  repetitions, next_review_date)
- questions (id, stem, option_a/b/c/d, correct_option, explanation, 
  subject, topic, difficulty, exam_type)
- question_attempts (user_id, question_id, selected_option, is_correct, 
  confidence_rating, time_taken, attempted_at)
- study_roadmaps (user_id, exam_type, roadmap_json, generated_at)
- user_progress (user_id, xp, current_streak, longest_streak, 
  last_active_date)
- badges (id, name, description, criteria_json)
- user_badges (user_id, badge_id, earned_at)

## SECURITY REQUIREMENTS
- Never expose password hashes in any response
- Validate all inputs with Pydantic (strict mode)
- SQL injection protection via SQLAlchemy ORM only (no raw SQL)
- CORS: allow only frontend domain
- Secrets via environment variables only (never hardcode)
- Add helmet-equivalent security headers middleware

## PERFORMANCE REQUIREMENTS
- All DB queries must be async (use asyncpg driver)
- GROQ calls must never block the main thread (use background tasks)
- Heavy endpoints (roadmap generation) return 202 Accepted immediately,
  process in Celery, notify via WebSocket or polling endpoint
- Target: < 200ms response time for non-LLM endpoints

## ERROR HANDLING
- Global exception handler for all unhandled errors
- Custom exceptions: GroqRateLimitError, CacheError, InvalidExamType
- Never return raw stack traces to client in production
- Log full errors server-side with structured logging (loguru)

## ENVIRONMENT VARIABLES NEEDED (.env.example)
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
CLOUDFLARE_R2_BUCKET=...
ENVIRONMENT=development

## TESTING
- Write pytest tests for: auth flow, SM-2 algorithm, GROQ caching layer,
  question submission, XP calculation
- Use pytest-asyncio for async tests
- Mock GROQ API calls in tests (never hit real API in tests)
- Aim for >80% coverage on services layer

## DELIVERABLES IN ORDER
1. Project scaffold + docker-compose.yml
2. Database models + first Alembic migration
3. Auth module (register, login, refresh, logout)
4. Student profile module
5. GROQ client wrapper with caching + key rotation
6. Spaced repetition engine
7. Question system + attempt tracking
8. AI roadmap agent (async/queued)
9. AI explanation agent (real-time)
10. Progress, XP, streaks, gamification
11. Analytics + calibration tracker
12. Tests for all modules

Start with Step 1. After each step, confirm before moving to the next.