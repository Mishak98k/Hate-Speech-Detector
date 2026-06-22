import React, { useState, useEffect } from 'react'
import { Zap, Loader } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { analyzeText } from '../api/gemini'
import evidenceStorage from '../utils/evidenceStorage'
import { generateSingleItemPDF } from '../utils/generateSingleItemPDF'

export function DatasetMonitor() {
  const [posts, setPosts] = useState([])
  const [analysisResults, setAnalysisResults] = useState({})
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [analyzingIds, setAnalyzingIds] = useState({})
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedHateType, setSelectedHateType] = useState('all_hate')
  const [postLimit, setPostLimit] = useState(10)

  // Hate speech categories (5 classes as per the project)
  const HATE_CATEGORIES = [
    { value: 'all_hate', label: 'All Hate Speech' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'racial_abuse', label: 'Racial Abuse' },
    { value: 'sectarian', label: 'Sectarian' },
    { value: 'religious_threat', label: 'Religious Threat' }
  ]

  // Load hate speech posts on mount
  useEffect(() => {
    fetchDatasetPosts()
  }, [selectedPlatform, selectedHateType, postLimit])

  const fetchDatasetPosts = async () => {
    setLoadingPosts(true)
    setError(null)
    setPosts([])
    setAnalysisResults({})
    setAnalyzingIds({})

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dataset/hate-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform === 'all' ? null : selectedPlatform,
          category: selectedHateType,
          limit: postLimit
        })
      })
      
      if (!response.ok) throw new Error('Failed to fetch dataset posts')
      
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError('Failed to load hate speech datasets. Please try again.')
      console.error(err)
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleAnalyzePost = async (post) => {
    if (analysisResults[post.id]) return

    setAnalyzingIds((prev) => ({ ...prev, [post.id]: true }))

    try {
      const result = await analyzeText(post.text || post.content)
      setAnalysisResults((prev) => ({ ...prev, [post.id]: result }))

      // Save to evidence
      evidenceStorage.saveEvidence({
        type: 'social',
        text: post.text || post.content,
        category: result.label,
        confidence: result.confidence,
        reason: result.reason,
      })
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setAnalyzingIds((prev) => ({ ...prev, [post.id]: false }))
    }
  }

  const handleDownloadPostReport = (post, analysisResult) => {
    if (!analysisResult) return
    
    // Handle different timestamp formats
    let timestamp = new Date().toISOString()
    if (post.created_utc) {
      timestamp = new Date(post.created_utc * 1000).toISOString()
    } else if (post.timestamp) {
      if (typeof post.timestamp === 'string' && !post.timestamp.includes('T')) {
        timestamp = new Date(post.timestamp).toISOString()
      } else {
        timestamp = new Date(post.timestamp).toISOString()
      }
    }
    
    const item = {
      id: post.id,
      timestamp: timestamp,
      type: 'social',
      category: analysisResult.label,
      confidence: analysisResult.confidence,
      reason: analysisResult.reason,
      platform: post.platform || 'Unknown',
    }
    
    generateSingleItemPDF(item)
  }

  const getFilteredPosts = () => {
    let filtered = posts

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(p => p.platform === selectedPlatform)
    }

    // Analysis filter
    if (filter === 'hate') {
      return filtered.filter(
        (post) =>
          analysisResults[post.id] &&
          analysisResults[post.id].label !== 'NEUTRAL'
      )
    }
    if (filter === 'neutral') {
      return filtered.filter(
        (post) =>
          analysisResults[post.id] &&
          analysisResults[post.id].label === 'NEUTRAL'
      )
    }
    return filtered
  }

  const filteredPosts = getFilteredPosts()
  const platformCounts = {
    all: posts.length,
    Twitter: posts.filter(p => p.platform === 'Twitter').length,
    Instagram: posts.filter(p => p.platform === 'Instagram').length,
    Facebook: posts.filter(p => p.platform === 'Facebook').length,
    Reddit: posts.filter(p => p.platform === 'Reddit').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#0D0D14] to-[#1A1A25] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hate Speech Datasets</h1>
          <p className="text-[#A0AEC0]">
            Pre-collected hate speech posts for analysis and model training
          </p>
        </div>

        {/* Controls Bar */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 animate-fade-in-up stagger-child-1"
          style={{
            background: 'rgba(18,18,26,0.8)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="Twitter">Twitter</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Reddit">Reddit</option>
              </select>
            </div>

            {/* Hate Speech Type Filter */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
                Hate Speech Type
              </label>
              <select
                value={selectedHateType}
                onChange={(e) => setSelectedHateType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm"
              >
                {HATE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Limit */}
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
                Post Limit {selectedPlatform === 'all' ? '(max 2000)' : '(max 500)'}
              </label>
              <input
                type="number"
                min="1"
                max={selectedPlatform === 'all' ? 2000 : 500}
                value={postLimit}
                onChange={(e) => {
                  const maxLimit = selectedPlatform === 'all' ? 2000 : 500
                  setPostLimit(Math.min(maxLimit, parseInt(e.target.value) || 10))
                }}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm"
              />
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={fetchDatasetPosts}
                disabled={loadingPosts}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {loadingPosts ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Load Datasets
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>

        {/* Filter & Sort Bar */}
        {posts.length > 0 && (
          <div
            className="p-4 rounded-lg border border-[rgba(255,255,255,0.08)] mb-6 flex flex-wrap items-center gap-4 animate-fade-in-up stagger-child-2"
            style={{
              background: 'rgba(18,18,26,0.5)',
            }}
          >
            <div className="flex gap-2">
              {['all', 'hate', 'neutral'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[rgba(99,102,241,0.1)] text-[#A0AEC0] hover:bg-[rgba(99,102,241,0.2)]'
                  }`}
                >
                  {f === 'all' && 'All Posts'}
                  {f === 'hate' && 'Hate Speech'}
                  {f === 'neutral' && 'Neutral'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post, idx) => (
              <div key={post.id} className={`animate-fade-in-up stagger-child-${(idx % 3) + 3}`}>
                <PostCard
                  post={post}
                  analysisResult={analysisResults[post.id]}
                  isAnalyzing={analyzingIds[post.id] || false}
                  onAnalyze={() => handleAnalyzePost(post)}
                  onDownloadReport={() => handleDownloadPostReport(post, analysisResults[post.id])}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#A0AEC0]">No posts found in dataset</p>
          </div>
        )}
      </div>
    </div>
  )
}
