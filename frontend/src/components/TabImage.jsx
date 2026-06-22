import React, { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Zap } from 'lucide-react'
import { ResultCard } from './ResultCard'
import { analyzeImage } from '../api/gemini'

export const TabImage = ({ onShowToast, onUpdateStats }) => {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
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

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        try {
          const analysisResult = await analyzeImage(base64)
          setResult(analysisResult)
          onUpdateStats?.({
            total: 1,
            hate: analysisResult.label !== 'NEUTRAL' ? 1 : 0,
            neutral: analysisResult.label === 'NEUTRAL' ? 1 : 0,
          })
        } catch (err) {
          setError('Failed to analyze image. Please try again.')
          onShowToast?.({ type: 'error', message: 'Analysis failed' })
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(image)
    } catch (err) {
      setError('Failed to process image')
      setLoading(false)
      onShowToast?.({ type: 'error', message: 'Image processing failed' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 cursor-pointer group ${
          dragActive
            ? 'border-[#6366F1] bg-[rgba(99,102,241,0.1)]'
            : 'border-[rgba(255,255,255,0.1)] hover:border-[#6366F1]'
        }`}
        style={dragActive ? {
          background: 'radial-gradient(circle at center, rgba(99,102,241,0.15), transparent)',
        } : {}}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-80 max-w-full rounded-xl border border-[rgba(99,102,241,0.3)]"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full text-xs font-semibold text-white">
                  ✓ Ready to Analyze
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setImage(null)
                setPreview(null)
                setResult(null)
              }}
              className="btn-ghost w-full"
            >
              Change Image
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="p-4 rounded-full bg-[rgba(99,102,241,0.1)] w-fit mx-auto mb-4 group-hover:animate-glow">
              <ImageIcon className="w-8 h-8 text-[#6366F1]" />
            </div>
            <p className="text-[#F1F5F9] font-semibold mb-2">
              Drag and drop your image here
            </p>
            <p className="gradient-text text-sm mb-6">
              or click to select from your device
            </p>
            <p className="text-xs text-[#64748B] mb-6">
              📸 JPG, PNG, WEBP • Max 5MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !image}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Analyzing Image...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Analyze Image
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
