"""
AI-Powered Resume Analyzer - FastAPI Backend (v2)
====================================================
POST /api/analyze-resume
Accepts resume text + job description, returns AI-generated match score
and improvement suggestions via OpenAI's gpt-4o-mini model.

POST /api/analyze-resume-file
Accepts a resume file upload (PDF/DOCX/TXT) + job description.
"""

import io
import os
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from openai import OpenAI
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Environment & App Setup
# ---------------------------------------------------------------------------
load_dotenv()

app = FastAPI(
    title="AI Resume Analyzer",
    description="Analyze resumes against job descriptions using OpenAI",
    version="2.0.0",
)

# CORS — allow common React dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# OpenAI Client
# ---------------------------------------------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY not found. Create a .env file with: OPENAI_API_KEY=sk-..."
    )

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class AnalyzeResumeRequest(BaseModel):
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=50_000,
        description="The full text content of the user's resume.",
    )
    job_description: str = Field(
        ...,
        min_length=50,
        max_length=50_000,
        description="The full text of the job description to match against.",
    )

    @field_validator("resume_text", "job_description")
    @classmethod
    def must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty or whitespace only.")
        return v.strip()


class ImprovementSuggestion(BaseModel):
    category: str = Field(
        ...,
        description="The area of improvement (e.g., 'Skills', 'Experience', 'Keywords').",
    )
    suggestion: str = Field(
        ...,
        description="A specific, actionable suggestion for the candidate.",
    )


class GapAnalysis(BaseModel):
    missing_skills: list[str] = Field(
        default=[],
        description="Key skills from the JD that are missing in the resume.",
    )
    missing_experience: list[str] = Field(
        default=[],
        description="Experience requirements from the JD not evidenced in the resume.",
    )
    missing_keywords: list[str] = Field(
        default=[],
        description="Important ATS keywords from the JD absent in the resume.",
    )


class AnalyzeResumeResponse(BaseModel):
    match_score: int = Field(
        ...,
        ge=1,
        le=100,
        description="Overall match score from 1 to 100.",
    )
    improvement_suggestions: list[ImprovementSuggestion] = Field(
        ...,
        description="List of actionable improvement suggestions.",
    )
    summary: str = Field(
        ...,
        description="A brief AI-generated summary of the analysis.",
    )
    gap_analysis: GapAnalysis = Field(
        ...,
        description="Specific gaps between the resume and job description.",
    )
    is_sufficient: bool = Field(
        ...,
        description="Whether the resume meets the minimum requirements for the role.",
    )


# ---------------------------------------------------------------------------
# File Text Extraction
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using PyPDF2 (no external dependencies)."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from PDF: {str(e)}. Ensure the PDF is not scanned/image-based.",
        )


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from DOCX: {str(e)}",
        )


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode plain text file."""
    try:
        return file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Failed to decode text file. Please use UTF-8 encoding.",
        )


# ---------------------------------------------------------------------------
# System Prompt (Enhanced)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an expert AI Career Advisor and Resume Analyst with deep 
knowledge of ATS (Applicant Tracking Systems), hiring practices, and recruitment.

Your task is to analyze a candidate's resume against a target job description and 
provide a structured, actionable assessment.

## Output Format

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text) 
in the following exact schema:

{
  "match_score": <integer between 1 and 100>,
  "improvement_suggestions": [
    {
      "category": "<one of: Skills, Experience, Keywords, Education, Formatting, Impact, Action>",
      "suggestion": "<specific, actionable advice>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>",
  "gap_analysis": {
    "missing_skills": ["<skill 1>", "<skill 2>"],
    "missing_experience": ["<experience 1>", "<experience 2>"],
    "missing_keywords": ["<keyword 1>", "<keyword 2>"]
  },
  "is_sufficient": <true or false>
}

## Scoring Guidelines

- 90-100: Exceptional match — resume aligns almost perfectly with the JD.
- 75-89:  Strong match — minor gaps that are easily addressable.
- 60-74:  Moderate match — several notable gaps requiring attention.
- 40-59:  Weak match — significant misalignment; major revisions needed.
- 1-39:   Poor match — fundamental mismatch in skills, experience, or domain.

## Sufficiency Criteria

Set `is_sufficient` to `false` if ANY of these are true:
- The resume is missing 2+ core technical skills listed in the JD requirements.
- The resume lacks evidence of the required education level.
- The resume has no relevant projects or experience matching the JD domain.
- The match score is below 50.

## Analysis Criteria

Evaluate the resume against the job description on these dimensions:

1. **Skills Match** — Hard skills, soft skills, and technical competencies mentioned in the JD.
2. **Experience Relevance** — Years of experience, industry alignment, and role similarity.
3. **Keyword Optimization** — ATS-friendly keywords and phrases from the JD present in the resume.
4. **Education & Certifications** — Required or preferred qualifications.
5. **Quantifiable Impact** — Use of metrics, numbers, and achievements vs. generic duty lists.
6. **Formatting & Clarity** — Readability, structure, and professional presentation.

## Rules

- Be honest but constructive. Always provide actionable feedback.
- Provide 4-8 improvement suggestions, prioritized by impact.
- Each suggestion must be specific — reference the actual resume/JD content.
- If the resume is NOT sufficient for the role, clearly state this in the summary
  and provide a "category": "Action" suggestion with concrete next steps.
- If the resume is strong, acknowledge it and suggest refinements.
- Do NOT invent information that isn't in the resume or JD.
- For gap_analysis, list ONLY items explicitly mentioned in the JD but absent in the resume.
"""


# ---------------------------------------------------------------------------
# Helper: Call OpenAI API
# ---------------------------------------------------------------------------
def call_openai_analysis(resume_text: str, job_description: str) -> dict:
    """
    Sends the resume and job description to OpenAI's gpt-4o-mini model
    and returns the parsed JSON response.
    """
    user_prompt = f"""Please analyze the following resume against the job description.

=== RESUME ===
{resume_text}

=== JOB DESCRIPTION ===
{job_description}

Provide your analysis in the required JSON format."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content

        import json
        parsed = json.loads(raw_content)
        return parsed

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI returned invalid JSON: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI API error: {str(e)}",
        )


# ---------------------------------------------------------------------------
# API Endpoint: JSON Payload
# ---------------------------------------------------------------------------
@app.post(
    "/api/analyze-resume",
    response_model=AnalyzeResumeResponse,
    summary="Analyze a resume against a job description (text input)",
)
async def analyze_resume(payload: AnalyzeResumeRequest):
    """
    Accepts resume text and job description as JSON, sends them to OpenAI.
    """
    result = call_openai_analysis(
        resume_text=payload.resume_text,
        job_description=payload.job_description,
    )
    validated = AnalyzeResumeResponse(**result)
    return validated


# ---------------------------------------------------------------------------
# API Endpoint: File Upload
# ---------------------------------------------------------------------------
@app.post(
    "/api/analyze-resume-file",
    response_model=AnalyzeResumeResponse,
    summary="Analyze a resume file (PDF/DOCX/TXT) against a job description",
)
async def analyze_resume_file(
    resume_file: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    job_description: str = Form(..., min_length=50, max_length=50_000),
):
    """
    Accepts a resume file upload and job description, extracts text,
    and sends to OpenAI for analysis.
    """
    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".txt"}
    file_ext = os.path.splitext(resume_file.filename or "")[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed: .pdf, .docx, .txt",
        )

    # Read and extract text
    file_bytes = await resume_file.read()
    max_size = 10 * 1024 * 1024  # 10 MB
    if len(file_bytes) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")

    if file_ext == ".pdf":
        resume_text = extract_text_from_pdf(file_bytes)
    elif file_ext == ".docx":
        resume_text = extract_text_from_docx(file_bytes)
    else:
        resume_text = extract_text_from_txt(file_bytes)

    if len(resume_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Extracted text is too short. Please upload a valid resume document.",
        )

    # Analyze
    result = call_openai_analysis(
        resume_text=resume_text,
        job_description=job_description.strip(),
    )
    validated = AnalyzeResumeResponse(**result)
    return validated


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "resume-analyzer"}


# ---------------------------------------------------------------------------
# Run (for development)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
