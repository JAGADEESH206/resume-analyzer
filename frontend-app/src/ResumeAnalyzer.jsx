import { useState, useRef } from "react";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_URL = "http://localhost:8000";

// ---------------------------------------------------------------------------
// Score Helpers
// ---------------------------------------------------------------------------
function getScoreColor(score) {
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreGradient(score) {
  if (score >= 75) return "linear-gradient(135deg, #10b981, #059669)";
  if (score >= 60) return "linear-gradient(135deg, #f59e0b, #d97706)";
  if (score >= 40) return "linear-gradient(135deg, #f97316, #ea580c)";
  return "linear-gradient(135deg, #ef4444, #dc2626)";
}

function getScoreLabel(score) {
  if (score >= 90) return "Exceptional Match";
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Moderate Match";
  if (score >= 40) return "Weak Match";
  return "Poor Match";
}

// ---------------------------------------------------------------------------
// File Upload Component
// ---------------------------------------------------------------------------
function FileUpload({ file, onFileSelect, onFileClear, disabled }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelect(droppedFile);
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) onFileSelect(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    const icons = { pdf: "📕", docx: "📘", txt: "📄" };
    return icons[ext] || "📎";
  };

  if (file) {
    return (
      <div className="file-upload file-upload-filled">
        <div className="file-info">
          <span className="file-icon">{getFileIcon(file.name)}</span>
          <div className="file-details">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
          <button
            type="button"
            onClick={onFileClear}
            className="file-clear"
            disabled={disabled}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`file-upload file-upload-empty ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <div className="file-upload-prompt">
        <span className="file-upload-icon">📁</span>
        <p>
          <strong>Click to upload</strong> or drag & drop
        </p>
        <span className="file-upload-hint">PDF, DOCX, or TXT (max 10 MB)</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Gauge Component
// ---------------------------------------------------------------------------
function ScoreGauge({ score }) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-gauge">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="54" fill="none" stroke="#f3f4f6" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
        <text x="80" y="75" textAnchor="middle" fontSize="36" fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="12" fill="#9ca3af">
          out of 100
        </text>
      </svg>
      <div className="score-badge" style={{ background: getScoreGradient(score) }}>
        {getScoreLabel(score)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion Card Component
// ---------------------------------------------------------------------------
function SuggestionCard({ suggestion, index }) {
  const icons = {
    Skills: "🛠",
    Experience: "💼",
    Keywords: "🔑",
    Education: "🎓",
    Formatting: "📄",
    Impact: "📊",
    Action: "⚡",
  };

  const isAction = suggestion.category === "Action";

  return (
    <div className={`suggestion-card ${isAction ? "suggestion-action" : ""}`}>
      <div className="suggestion-header">
        <span className="suggestion-icon">{icons[suggestion.category] || "💡"}</span>
        <span className="suggestion-category">{suggestion.category}</span>
        <span className="suggestion-number">#{index + 1}</span>
      </div>
      <p className="suggestion-text">{suggestion.suggestion}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gap Analysis Component
// ---------------------------------------------------------------------------
function GapAnalysis({ gap }) {
  const hasGaps =
    gap.missing_skills.length > 0 ||
    gap.missing_experience.length > 0 ||
    gap.missing_keywords.length > 0;

  if (!hasGaps) {
    return (
      <div className="gap-section gap-section-good">
        <h3>✅ Gap Analysis</h3>
        <p className="no-gaps">Excellent! No significant gaps detected between your resume and the job description.</p>
      </div>
    );
  }

  return (
    <div className="gap-section">
      <h3>🔍 Gap Analysis</h3>
      <div className="gap-grid">
        {gap.missing_skills.length > 0 && (
          <div className="gap-category">
            <h4>Missing Skills</h4>
            <ul>
              {gap.missing_skills.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {gap.missing_experience.length > 0 && (
          <div className="gap-category">
            <h4>Missing Experience</h4>
            <ul>
              {gap.missing_experience.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {gap.missing_keywords.length > 0 && (
          <div className="gap-category">
            <h4>Missing Keywords</h4>
            <ul>
              {gap.missing_keywords.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [inputMode, setInputMode] = useState("file"); // "file" or "text"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileSelect = (file) => {
    setResumeFile(file);
    setResumeText(""); // Clear text when file is selected
  };

  const handleFileClear = () => {
    setResumeFile(null);
  };

  const handleModeSwitch = (mode) => {
    setInputMode(mode);
    if (mode === "text") {
      setResumeFile(null);
    } else {
      setResumeText("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (inputMode === "text" && resumeText.trim().length < 50) {
      setError("Resume text must be at least 50 characters.");
      return;
    }
    if (inputMode === "file" && !resumeFile) {
      setError("Please upload a resume file.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError("Job description must be at least 50 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;

      if (inputMode === "file") {
        const formData = new FormData();
        formData.append("resume_file", resumeFile);
        formData.append("job_description", jobDescription.trim());

        response = await fetch(`${API_URL}/api/analyze-resume-file`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${API_URL}/api/analyze-resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: resumeText.trim(),
            job_description: jobDescription.trim(),
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const detail = errData?.detail;
        const message = Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail || `Server error: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResumeText("");
    setJobDescription("");
    setResumeFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="resume-analyzer">
      {/* ---- Header ---- */}
      <header className="analyzer-header">
        <div className="header-icon">🤖</div>
        <h1>AI Resume Analyzer</h1>
        <p>
          Upload your resume and paste a job description. Our AI will evaluate
          your match, identify gaps, and provide actionable feedback.
        </p>
      </header>

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="analyzer-form">
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${inputMode === "file" ? "active" : ""}`}
            onClick={() => handleModeSwitch("file")}
          >
            📁 Upload File
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "text" ? "active" : ""}`}
            onClick={() => handleModeSwitch("text")}
          >
            ✏️ Paste Text
          </button>
        </div>

        {/* Resume Input */}
        <div className="form-group">
          <label>Your Resume</label>
          {inputMode === "file" ? (
            <FileUpload
              file={resumeFile}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              disabled={loading}
            />
          ) : (
            <div className="textarea-wrapper">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                rows={10}
                disabled={loading}
              />
              <span className="char-count">{resumeText.length} characters</span>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="form-group">
          <label htmlFor="job-description">Job Description</label>
          <div className="textarea-wrapper">
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={10}
              disabled={loading}
            />
            <span className="char-count">{jobDescription.length} characters</span>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <span className="spinner" /> Analyzing...
              </>
            ) : (
              <>
                <span>🔍</span> Analyze Resume
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {/* ---- Error ---- */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* ---- Results ---- */}
      {result && (
        <div className="results-section">
          <h2>Analysis Results</h2>

          {/* Sufficiency Banner */}
          {!result.is_sufficient && (
            <div className="insufficiency-banner">
              <span className="insufficiency-icon">⚠️</span>
              <div>
                <strong>Resume Not Sufficient</strong>
                <p>
                  Your resume does not currently meet the minimum requirements for this role.
                  Review the gap analysis and suggestions below to improve your application.
                </p>
              </div>
            </div>
          )}

          {/* Score */}
          <div className="score-section">
            <ScoreGauge score={result.match_score} />
          </div>

          {/* Summary */}
          <div className="summary-section">
            <h3>Summary</h3>
            <p>{result.summary}</p>
          </div>

          {/* Gap Analysis */}
          <GapAnalysis gap={result.gap_analysis} />

          {/* Suggestions */}
          <div className="suggestions-section">
            <h3>Improvement Suggestions</h3>
            <div className="suggestions-list">
              {result.improvement_suggestions.map((s, i) => (
                <SuggestionCard key={i} suggestion={s} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Styles ---- */}
      <style>{`
        * { box-sizing: border-box; }

        .resume-analyzer {
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1f2937;
        }

        /* Header */
        .analyzer-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .header-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .analyzer-header h1 {
          font-size: 2.2rem;
          margin: 0 0 0.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .analyzer-header p {
          color: #6b7280;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Mode Toggle */
        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 10px;
        }
        .mode-btn {
          flex: 1;
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-btn.active {
          background: #fff;
          color: #6366f1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Form */
        .analyzer-form {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .form-group {
          margin-bottom: 1.25rem;
          position: relative;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #374151;
        }

        /* Textarea */
        .textarea-wrapper {
          position: relative;
        }
        .textarea-wrapper textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .textarea-wrapper textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .textarea-wrapper textarea:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }
        .char-count {
          position: absolute;
          right: 10px;
          bottom: 10px;
          font-size: 0.75rem;
          color: #9ca3af;
          background: rgba(255,255,255,0.9);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* File Upload */
        .file-upload {
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .file-upload-empty:hover {
          border-color: #6366f1;
          background: #f5f3ff;
        }
        .file-upload-empty.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .file-upload-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .file-upload-icon {
          font-size: 2rem;
        }
        .file-upload-prompt p {
          margin: 0;
          color: #374151;
        }
        .file-upload-hint {
          font-size: 0.8rem;
          color: #9ca3af;
        }
        .file-upload-filled {
          border-style: solid;
          border-color: #10b981;
          background: #f0fdf4;
          padding: 1rem;
        }
        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .file-icon {
          font-size: 1.5rem;
        }
        .file-details {
          flex: 1;
          text-align: left;
        }
        .file-name {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
          color: #374151;
          word-break: break-all;
        }
        .file-size {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .file-clear {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #9ca3af;
          padding: 0.25rem;
        }
        .file-clear:hover {
          color: #ef4444;
        }

        /* Buttons */
        .form-actions {
          display: flex;
          gap: 0.75rem;
        }
        .btn-primary {
          flex: 1;
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.1s;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          padding: 0.85rem 1.5rem;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .error-banner {
          margin-top: 1rem;
          padding: 1rem 1.25rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b91c1c;
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .error-icon {
          flex-shrink: 0;
        }

        /* Results */
        .results-section {
          margin-top: 2rem;
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .results-section h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        /* Insufficiency Banner */
        .insufficiency-banner {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }
        .insufficiency-icon {
          font-size: 1.25rem;
        }
        .insufficiency-banner strong {
          color: #92400e;
        }
        .insufficiency-banner p {
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          color: #78350f;
          line-height: 1.4;
        }

        /* Score Gauge */
        .score-section {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .score-gauge {
          text-align: center;
        }
        .score-badge {
          display: inline-block;
          margin-top: 0.75rem;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
        }

        /* Summary */
        .summary-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .summary-section h3 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #374151;
        }
        .summary-section p {
          margin: 0;
          line-height: 1.6;
          color: #4b5563;
        }

        /* Gap Analysis */
        .gap-section {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .gap-section-good {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .gap-section h3 {
          margin: 0 0 0.75rem;
          font-size: 1rem;
          color: #374151;
        }
        .gap-grid {
          display: grid;
          gap: 1rem;
        }
        .gap-category h4 {
          margin: 0 0 0.4rem;
          font-size: 0.85rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .gap-category ul {
          margin: 0;
          padding-left: 1.25rem;
        }
        .gap-category li {
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        .no-gaps {
          margin: 0;
          color: #065f46;
          font-size: 0.95rem;
        }

        /* Suggestions */
        .suggestions-section h3 {
          font-size: 1rem;
          color: #374151;
          margin-bottom: 0.75rem;
        }
        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .suggestion-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          transition: box-shadow 0.2s;
        }
        .suggestion-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .suggestion-action {
          border-color: #f59e0b;
          background: #fffbeb;
        }
        .suggestion-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .suggestion-icon {
          font-size: 1.2rem;
        }
        .suggestion-category {
          font-weight: 700;
          font-size: 0.8rem;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .suggestion-action .suggestion-category {
          color: #d97706;
        }
        .suggestion-number {
          margin-left: auto;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        .suggestion-text {
          margin: 0;
          line-height: 1.55;
          color: #4b5563;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
