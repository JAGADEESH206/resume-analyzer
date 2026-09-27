# AI-Powered Resume Analyzer

A full-stack application that analyzes resumes against job descriptions using OpenAI's gpt-4o-mini model.

## Tech Stack

| Layer     | Technology        |
|-----------|-------------------|
| Frontend  | React (JSX)       |
| Backend   | FastAPI (Python)  |
| AI Model  | OpenAI gpt-4o-mini |
| Validation| Pydantic v2       |

## Project Structure

```
resume-analyzer/
├── backend/
│   ├── main.py              # FastAPI app + OpenAI integration
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variable template
├── frontend/
│   └── ResumeAnalyzer.jsx   # React component
└── README.md
```

## Setup & Run

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the server
python main.py
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### 2. Frontend

Place `ResumeAnalyzer.jsx` in your React project's `src/components/` directory:

```jsx
import ResumeAnalyzer from "./components/ResumeAnalyzer";

function App() {
  return <ResumeAnalyzer />;
}

export default App;
```

Make sure your React dev server runs on port 5173 (Vite default) or update `API_URL` in the component.

## API Specification

### `POST /api/analyze-resume`

**Request Body:**
```json
{
  "resume_text": "John Doe\nSoftware Engineer\n5 years experience...",
  "job_description": "We are seeking a Senior Software Engineer..."
}
```

**Response (200 OK):**
```json
{
  "match_score": 78,
  "improvement_suggestions": [
    {
      "category": "Keywords",
      "suggestion": "Add mentions of 'React' and 'TypeScript' to align with the job description's tech stack requirements."
    },
    {
      "category": "Impact",
      "suggestion": "Quantify your achievements — e.g., 'Reduced API latency by 40%' instead of 'Improved performance'."
    }
  ],
  "summary": "Strong technical background with relevant experience. The resume would benefit from more ATS-friendly keywords and quantifiable achievements."
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "loc": ["body", "resume_text"],
      "msg": "String should have at least 50 characters",
      "type": "string_too_short"
    }
  ]
}
```

## Features

- **Strict Pydantic validation** — min/max length, type checking, custom validators
- **OpenAI JSON mode** — enforces structured output via `response_format`
- **Score gauge visualization** — animated SVG circular progress
- **Categorized suggestions** — Skills, Experience, Keywords, Education, Formatting, Impact
- **Error handling** — graceful handling of API failures with user-friendly messages
- **CORS enabled** — ready for local development with Vite/CRA
