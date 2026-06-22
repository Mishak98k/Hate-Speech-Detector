import React, { useState, useEffect } from 'react'
import { Copy, CheckCircle, AlertCircle, Info, Zap, Save, Download } from 'lucide-react'
import { analyzeText } from '../api/gemini'
import { BadgeLabel } from '../components/BadgeLabel'
import evidenceStorage from '../utils/evidenceStorage'
import performanceTracker from '../utils/performanceTracker'
import { generateSingleAnalysisReport } from '../utils/singleReportGenerator'

export function TextAnalysis() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('auto')
  const [displayConfidence, setDisplayConfidence] = useState(0)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])

  const languages = ['English', 'Urdu', 'Arabic', 'Auto']

  // Animate confidence counter
  useEffect(() => {
    if (!result) return
    const interval = setInterval(() => {
      setDisplayConfidence((prev) => {
        const next = prev + (result.confidence - prev) * 0.1
        return next > result.confidence - 1 ? result.confidence : next
      })
    }, 30)

    return () => clearInterval(interval)
  }, [result?.confidence])

  // Load history
  useEffect(() => {
    const evidence = evidenceStorage.getEvidence()
    const textAnalyses = evidence.filter((item) => item.type === 'text').slice(-3).reverse()
    setHistory(textAnalyses)
  }, [result])

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const startTime = performance.now()

    try {
      const analysisResult = await analyzeText(text)
      const endTime = performance.now()
      const responseTime = endTime - startTime

      setResult(analysisResult)
      setDisplayConfidence(0)

      // Save to evidence
      evidenceStorage.saveEvidence({
        type: 'text',
        text: text,
        category: analysisResult.label,
        confidence: analysisResult.confidence,
        reason: analysisResult.reason,
      })

      // Track performance
      performanceTracker.trackAnalysis({
        type: 'text',
        category: analysisResult.label,
        confidence: analysisResult.confidence,
        responseTime: responseTime,
      })
    } catch (err) {
      setError('Failed to analyze text. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze()
    }
  }

  const handleCopy = async () => {
    if (!result) return
    const text = `Label: ${result.label}\nConfidence: ${result.confidence}%\nExplanation: ${result.reason}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSaveEvidence = () => {
    if (result) {
      evidenceStorage.saveEvidence({
        type: 'text',
        text: text,
        category: result.label,
        confidence: result.confidence,
        reason: result.reason,
      })
    }
  }

  const handleGenerateReport = () => {
    if (result) {
      generateSingleAnalysisReport({
        type: 'Text Analysis',
        label: result.label,
        confidence: result.confidence,
        reason: result.reason,
        contentPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        timestamp: new Date()
      })
    }
  }

  const categoryColors = {
    HATE_SPEECH: '#EF4444',
    SECTARIAN: '#8B5CF6',
    RACIAL_ABUSE: '#F97316',
    RELIGIOUS_THREAT: '#B91C1C',
    NEUTRAL: '#10B981',
  }

  const getCategoryColor = () => {
    if (!result) return { bg: 'rgba(99,102,241,0.1)', border: '#6366F1', text: '#6366F1' }
    const colors = {
      HATE_SPEECH: { bg: 'rgba(239,68,68,0.1)', border: '#EF4444', text: '#FCA5A5' },
      SECTARIAN: { bg: 'rgba(139,92,246,0.1)', border: '#8B5CF6', text: '#D8B4FE' },
      RACIAL_ABUSE: { bg: 'rgba(249,115,22,0.1)', border: '#F97316', text: '#FED7AA' },
      RELIGIOUS_THREAT: { bg: 'rgba(185,28,28,0.1)', border: '#B91C1C', text: '#FCA5A5' },
      NEUTRAL: { bg: 'rgba(16,185,129,0.1)', border: '#10B981', text: '#A7F3D0' },
    }
    return colors[result.label] || colors.NEUTRAL
  }

  const CircularProgress = ({ percentage }) => {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(99,102,241,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={categoryColors[result?.label] || '#6366F1'}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s ease-out',
              filter: `drop-shadow(0 0 8px ${
                categoryColors[result?.label]
                  ? categoryColors[result?.label] + '80'
                  : 'rgba(99,102,241,0.5)'
              })`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">{Math.round(percentage)}%</p>
            <p className="text-xs text-[#64748B] mt-1">Confidence</p>
          </div>
        </div>
      </div>
    )
  }

  const categoryColor = getCategoryColor()

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">Text Analysis</h1>
        <p className="text-[#64748B]">Detect hate speech and analyze text content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT - Input Panel */}
        <div className="animate-fade-in-up stagger-child-1">
          <div
            className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)]"
            style={{
              background: 'rgba(18,18,26,0.8)',
            }}
          >
            <label className="block text-sm font-semibold text-[#F1F5F9] mb-3">
              Enter Text to Analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your text here... (Ctrl+Enter to analyze)"
              className="w-full h-48 px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] placeholder-[#64748B] resize-none transition-all"
            />
            <div className="mt-2 flex justify-between items-center text-xs text-[#64748B]">
              <p>{text.length} / 5000 characters</p>
              <p className="text-[#6366F1]">💡 Ctrl+Enter</p>
            </div>

            {/* Language Selector */}
            <div className="mt-6">
              <label className="block text-xs font-medium text-[#64748B] mb-2 uppercase">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-sm text-[#FCA5A5]">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setText('')}
                className="flex-1 px-4 py-2 rounded-lg bg-transparent border border-[rgba(99,102,241,0.3)] text-[#6366F1] hover:bg-[rgba(99,102,241,0.1)] transition-all font-medium text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT - Result Panel */}
        <div className="animate-fade-in-up stagger-child-2">
          {!result ? (
            <div
              className="h-full p-8 rounded-xl border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center"
              style={{
                background: 'rgba(18,18,26,0.8)',
              }}
            >
              <AlertCircle className="w-12 h-12 text-[#64748B] mb-4 opacity-50" />
              <p className="text-[#64748B] text-center">Results will appear here</p>
            </div>
          ) : (
            <div
              className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] animate-scale-up"
              style={{
                background: 'rgba(18,18,26,0.8)',
                borderTop: `4px solid ${categoryColor.border}`,
                boxShadow: `0 0 20px ${categoryColor.border}30`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-[#64748B] font-medium uppercase mb-2">
                    Analysis Result
                  </p>
                  <BadgeLabel label={result.label} size="lg" />
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-all"
                  title="Copy result"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <Copy className="w-5 h-5 text-[#6366F1]" />
                  )}
                </button>
              </div>

              {/* Circular Progress */}
              <div className="flex justify-center mb-8">
                <CircularProgress percentage={Math.round(displayConfidence)} />
              </div>

              {/* Reason */}
              <div
                className="rounded-xl p-4 mb-6"
                style={{
                  backgroundColor: categoryColor.bg,
                  borderLeft: `3px solid ${categoryColor.border}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#6366F1]" />
                  <div>
                    <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">
                      Analysis Reason
                    </p>
                    <p className="text-sm" style={{ color: categoryColor.border }}>
                      "{result.reason}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSaveEvidence}
                  className="w-full px-4 py-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[#10B981] text-[#10B981] hover:bg-[rgba(16,185,129,0.2)] transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save to Evidence Log
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[#6366F1] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)] transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Result
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  📄 Download Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div
          className="mt-12 p-8 rounded-xl border border-[rgba(255,255,255,0.08)] animate-fade-in-up stagger-child-3"
          style={{
            background: 'rgba(18,18,26,0.8)',
          }}
        >
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">History (Last 3)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.3)] transition-all"
              >
                <p className="text-xs text-[#64748B] mb-2 truncate">{item.text?.substring(0, 40)}...</p>
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: `${categoryColors[item.category]}20`,
                      color: categoryColors[item.category],
                    }}
                  >
                    {item.category}
                  </span>
                  <p className="text-xs text-[#6366F1] font-medium">{item.confidence}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TextAnalysis
