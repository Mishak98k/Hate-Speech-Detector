import React, { useState } from 'react'
import { ResultCard } from './ResultCard'
import { analyzeText } from '../api/gemini'
import { Zap } from 'lucide-react'

export const TabText = ({ onShowToast, onUpdateStats }) => {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const analysisResult = await analyzeText(text)
      setResult(analysisResult)
      onUpdateStats?.({
        total: 1,
        hate: analysisResult.label !== 'NEUTRAL' ? 1 : 0,
        neutral: analysisResult.label === 'NEUTRAL' ? 1 : 0,
      })
    } catch (err) {
      setError('Failed to analyze text. Please try again.')
      onShowToast?.({ type: 'error', message: 'Analysis failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <label className="block text-sm font-semibold gradient-text mb-3">
          Enter Text to Analyze
        </label>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste text here... (Press Ctrl+Enter to analyze)"
            className="w-full min-h-[140px] px-4 py-3 rounded-xl glass-morphism focus-ring resize-none text-[#F1F5F9] placeholder-[#64748B]"
            style={{
              borderColor: 'rgba(99,102,241,0.3)',
              borderWidth: '1px'
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-[#64748B]">
            {text.length} characters
          </div>
        </div>
        <p className="mt-2 text-xs text-[#64748B]">💡 Tip: Press Ctrl+Enter to analyze quickly</p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Analyzing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Analyze Text
          </>
        )}
      </button>

      {error && (
        <div className="glass-morphism rounded-xl p-4 border-l-4 border-[#EF4444] animate-fade-in-up">
          <p className="text-sm text-[#FCA5A5]">{error}</p>
        </div>
      )}

      {result && <ResultCard result={result} onCopy={() => onShowToast?.({ type: 'success', message: 'Copied to clipboard!' })} />}
    </div>
  )
}
