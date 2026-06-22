import React, { useEffect, useState } from 'react'
import { Copy, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { BadgeLabel, getConfidenceBarColor } from './BadgeLabel'

export const ResultCard = ({ result, onCopy }) => {
  const [copied, setCopied] = useState(false)
  const [displayConfidence, setDisplayConfidence] = useState(0)

  useEffect(() => {
    // Animate confidence counter
    const interval = setInterval(() => {
      setDisplayConfidence((prev) => {
        const next = prev + (result.confidence - prev) * 0.1
        return next > result.confidence - 1 ? result.confidence : next
      })
    }, 30)

    return () => clearInterval(interval)
  }, [result.confidence])

  const handleCopy = async () => {
    const text = `Label: ${result.label}\nConfidence: ${result.confidence}%\nExplanation: ${result.reason}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getCategoryColor = () => {
    const colors = {
      HATE_SPEECH: { bg: 'rgba(239,68,68,0.1)', border: '#EF4444', icon: AlertCircle },
      SECTARIAN: { bg: 'rgba(139,92,246,0.1)', border: '#8B5CF6', icon: AlertCircle },
      RACIAL_ABUSE: { bg: 'rgba(249,115,22,0.1)', border: '#F97316', icon: AlertCircle },
      RELIGIOUS_THREAT: { bg: 'rgba(185,28,28,0.1)', border: '#B91C1C', icon: AlertCircle },
      NEUTRAL: { bg: 'rgba(16,185,129,0.1)', border: '#10B981', icon: CheckCircle },
    }
    return colors[result.label] || colors.NEUTRAL
  }

  const categoryColor = getCategoryColor()

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
            stroke={
              result.label === 'HATE_SPEECH' ? '#EF4444' :
              result.label === 'SECTARIAN' ? '#8B5CF6' :
              result.label === 'RACIAL_ABUSE' ? '#F97316' :
              result.label === 'RELIGIOUS_THREAT' ? '#B91C1C' :
              '#10B981'
            }
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s ease-out',
              filter: `drop-shadow(0 0 8px ${
                result.label === 'HATE_SPEECH' ? 'rgba(239,68,68,0.5)' :
                result.label === 'SECTARIAN' ? 'rgba(139,92,246,0.5)' :
                result.label === 'RACIAL_ABUSE' ? 'rgba(249,115,22,0.5)' :
                result.label === 'RELIGIOUS_THREAT' ? 'rgba(185,28,28,0.5)' :
                'rgba(16,185,129,0.5)'
              })`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">{Math.round(displayConfidence)}%</p>
            <p className="text-xs text-[#64748B] mt-1">Confidence</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="glass-morphism rounded-2xl p-6 sm:p-8 border-t-4 animate-scale-up overflow-hidden relative"
      style={{
        borderTopColor: categoryColor.border,
        boxShadow: `0 0 30px ${categoryColor.border}40`
      }}
    >
      {/* Background gradient accent */}
      <div 
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: categoryColor.border }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide mb-2">Analysis Result</p>
            <BadgeLabel label={result.label} size="lg" />
          </div>
          <button
            onClick={handleCopy}
            className="p-3 rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-all duration-300 ml-4"
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
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: categoryColor.bg, borderLeft: `3px solid ${categoryColor.border}` }}>
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: categoryColor.border }} />
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Analysis Reason</p>
              <p className="text-sm italic" style={{ color: categoryColor.border }}>"{result.reason}"</p>
            </div>
          </div>
        </div>

        {/* Extracted Text */}
        {result.extracted_text && (
          <div className="rounded-xl p-4 bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.2)]">
            <h4 className="font-bold text-xs text-[#6366F1] uppercase tracking-wide mb-3">📝 Extracted Text</h4>
            <p className="text-sm text-[#D1D5DB] font-mono line-clamp-4 break-words">"{result.extracted_text}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
