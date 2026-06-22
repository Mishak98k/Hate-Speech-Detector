import React, { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, Zap, Copy, CheckCircle, Info, Save, Download, X } from 'lucide-react'
import { analyzeImage } from '../api/gemini'
import { BadgeLabel } from '../components/BadgeLabel'
import evidenceStorage from '../utils/evidenceStorage'
import performanceTracker from '../utils/performanceTracker'
import { generateSingleAnalysisReport } from '../utils/singleReportGenerator'

export function ImageAnalysis() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [displayConfidence, setDisplayConfidence] = useState(0)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

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

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setImage(file)
    setError(null)
    setResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please upload an image')
      return
    }

    setLoading(true)
    setError(null)

    const startTime = performance.now()

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        try {
          const analysisResult = await analyzeImage(base64)
          const endTime = performance.now()
          const responseTime = endTime - startTime

          setResult(analysisResult)
          setDisplayConfidence(0)

          // Save to evidence
          evidenceStorage.saveEvidence({
            type: 'image',
            text: analysisResult.extractedText || 'No text extracted',
            category: analysisResult.label,
            confidence: analysisResult.confidence,
            reason: analysisResult.reason,
          })

          // Track performance
          performanceTracker.trackAnalysis({
            type: 'image',
            category: analysisResult.label,
            confidence: analysisResult.confidence,
            responseTime: responseTime,
          })
        } catch (err) {
          setError('Failed to analyze image. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(image)
    } catch (err) {
      setError('Failed to process image')
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    const text = `Label: ${result.label}\nConfidence: ${result.confidence}%\nExtracted Text: ${result.extractedText || 'N/A'}\nExplanation: ${result.reason}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadReport = () => {
    if (!result) return
    generateSingleAnalysisReport({
      type: 'Image Analysis',
      label: result.label,
      confidence: result.confidence,
      reason: result.reason,
      imageName: image?.name || 'Uploaded Image',
      timestamp: new Date()
    })
  }

  const handleSaveEvidence = () => {
    if (result) {
      evidenceStorage.saveEvidence({
        type: 'image',
        text: result.extractedText || 'No text extracted',
        category: result.label,
        confidence: result.confidence,
        reason: result.reason,
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
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">Image Analysis</h1>
        <p className="text-[#64748B]">Upload and analyze images for hate speech content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT - Upload Panel */}
        <div className="animate-fade-in-up stagger-child-1">
          <div
            className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)]"
            style={{
              background: 'rgba(18,18,26,0.8)',
            }}
          >
            {/* Upload Zone */}
            {!preview ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="mb-6 p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer relative"
                style={{
                  borderColor: dragActive ? '#6366F1' : 'rgba(99,102,241,0.3)',
                  backgroundColor: dragActive
                    ? 'rgba(99,102,241,0.05)'
                    : 'rgba(99,102,241,0.02)',
                  animation: dragActive ? 'pulse 2s infinite' : 'none',
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: dragActive
                      ? 'linear-gradient(45deg, transparent, rgba(99,102,241,0.1), transparent)'
                      : 'none',
                    animation: dragActive ? 'shimmer 2s infinite' : 'none',
                  }}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <Upload
                    className="w-12 h-12 mb-4"
                    style={{
                      color: dragActive ? '#6366F1' : '#64748B',
                      filter: dragActive ? 'drop-shadow(0 0 8px rgba(99,102,241,0.6))' : 'none',
                    }}
                  />
                  <p className="text-sm font-medium text-[#F1F5F9] text-center">
                    Drag & drop your image here
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="mb-6 relative">
                <div className="relative rounded-xl overflow-hidden border border-[rgba(99,102,241,0.3)] bg-[#0A0A0F] h-64 flex items-center justify-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-transparent to-[rgba(99,102,241,0.1)]"
                  >
                    <span className="px-3 py-1 bg-[#6366F1] text-white text-xs font-medium rounded-full">
                      Ready to Analyze
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#64748B]">
                  {image?.name} • {(image?.size || 0) / 1024 > 1024
                    ? ((image?.size || 0) / (1024 * 1024)).toFixed(2) + ' MB'
                    : ((image?.size || 0) / 1024).toFixed(2) + ' KB'}
                </p>
              </div>
            )}

            {/* Supported Formats */}
            <div className="mb-6 flex flex-wrap gap-2">
              {['JPG', 'PNG', 'WEBP'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    color: '#6366F1',
                  }}
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-sm text-[#FCA5A5]">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              {preview && (
                <button
                  onClick={() => {
                    setPreview(null)
                    setImage(null)
                    setResult(null)
                    setError(null)
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.2)] transition-all font-medium text-sm"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Change Image
                </button>
              )}
              <button
                onClick={handleAnalyze}
                disabled={loading || !image}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analyze Image
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
              <ImageIcon className="w-12 h-12 text-[#64748B] mb-4 opacity-50" />
              <p className="text-[#64748B] text-center">Results will appear here</p>
            </div>
          ) : (
            <div
              className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] animate-scale-up overflow-y-auto max-h-[600px]"
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

              {/* Extracted Text */}
              {result.extractedText && (
                <div className="rounded-xl p-4 mb-6 bg-[#0A0A0F] border border-[rgba(99,102,241,0.2)] font-mono">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#64748B] uppercase">
                      Extracted Text
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.extractedText)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="p-1 hover:bg-[rgba(99,102,241,0.1)] rounded transition-all"
                    >
                      <Copy className="w-3 h-3 text-[#6366F1]" />
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {result.extractedText}
                  </p>
                </div>
              )}

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
                  onClick={handleDownloadReport}
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
    </div>
  )
}

export default ImageAnalysis
