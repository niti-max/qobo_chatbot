# Qobo Hybrid Chatbot (MERN)

Production-ready hybrid chatbot built from scratch.

## Hybrid Response Flow

1. FAQ scraper crawls qobo.dev and stores only structured FAQ-like Q&A entries in MongoDB.
2. Chat API receives a user question.
3. API searches MongoDB FAQ with text score.
4. If match score is above threshold, returns predefined answer.
5. If no qualified match, calls Gemini API and returns AI-generated answer.

## Project Structure

```
backend/
  controllers/
  models/
  routes/
  services/
  scraper/
  utils/
  server.js

frontend/
  components/
  pages/
  services/
  App.js
```

## Backend Setup

1. Go to backend folder:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Update `.env` values:
   - `MONGO_URI`
   - `GEMINI_API_KEY`
5. Run scraper (populate FAQs first):
   - `npm run scrape`
6. Start backend server:
   - `npm run dev`

Backend default URL: `http://localhost:5000`

## Frontend Setup

1. Open new terminal and go to frontend folder:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Start frontend:
   - `npm run dev`

Frontend default URL: `http://localhost:5173`

## API Endpoint

POST `http://localhost:5000/api/chat`

Request body:

```json
{
  "message": "How does Qobo work?"
}
```

Response examples:

```json
{
  "answer": "Predefined answer from FAQ",
  "source": "qobo.dev",
  "type": "predefined",
  "sourceUrl": "https://qobo.dev/..."
}
```

```json
{
  "answer": "AI-generated answer",
  "source": "gemini",
  "type": "ai-generated"
}
```
