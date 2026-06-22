import React, { useState, useEffect } from 'react'
import { ChevronDown, Zap, ArrowUpRight, Loader } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { fetchTwitterPosts } from '../api/twitter'
import { fetchInstagramPosts } from '../api/instagram'
import { fetchFacebookPosts } from '../api/facebook'
import { fetchRedditPosts } from '../api/reddit'
import { analyzeText } from '../api/gemini'
import evidenceStorage from '../utils/evidenceStorage'
import { generateSingleItemPDF } from '../utils/generateSingleItemPDF'

export function SocialMonitor() {
  const [platform, setPlatform] = useState('Twitter')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [analysisResults, setAnalysisResults] = useState({})
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [analyzingIds, setAnalyzingIds] = useState({})
  const [postLimit, setPostLimit] = useState(5)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const handleFetchPosts = async () => {
    setLoadingPosts(true)
    setError(null)
    setPosts([])
    setAnalysisResults({})
    setAnalyzingIds({})

    try {
      let fetchedPosts = []
      
      // Fetch real posts from platform APIs
      if (platform === 'Twitter') {
        fetchedPosts = await fetchTwitterPosts(searchQuery, postLimit)
      } else if (platform === 'Instagram') {
        fetchedPosts = await fetchInstagramPosts(searchQuery, postLimit)
      } else if (platform === 'Facebook') {
        fetchedPosts = await fetchFacebookPosts(searchQuery, postLimit)
      } else if (platform === 'Reddit') {
        fetchedPosts = await fetchRedditPosts(searchQuery, postLimit)
      }
      setPosts(fetchedPosts)
    } catch (err) {
      setError(`Failed to fetch posts from ${platform}. Please try again.`)
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
    
    // Handle different timestamp formats from different platforms
    let timestamp = new Date().toISOString()
    if (post.created_utc) {
      timestamp = new Date(post.created_utc * 1000).toISOString()
    } else if (post.timestamp) {
      if (typeof post.timestamp === 'string' && !post.timestamp.includes('T')) {
        // If it's a date string like "2024-01-15 10:30:00"
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
    if (filter === 'all') return posts
    if (filter === 'hate') {
      return posts.filter(
        (post) =>
          analysisResults[post.id] &&
          analysisResults[post.id].label !== 'NEUTRAL'
      )
    }
    if (filter === 'neutral') {
      return posts.filter(
        (post) =>
          analysisResults[post.id] &&
          analysisResults[post.id].label === 'NEUTRAL'
      )
    }
    return posts
  }

  const filteredPosts = getFilteredPosts()
  const hateCount = posts.filter(
    (post) =>
      analysisResults[post.id] && analysisResults[post.id].label !== 'NEUTRAL'
  ).length
  const neutralCount = posts.filter(
    (post) =>
      analysisResults[post.id] && analysisResults[post.id].label === 'NEUTRAL'
  ).length

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">Social Monitor</h1>
        <p className="text-[#64748B]">Monitor and analyze posts from Twitter, Instagram, Facebook, and Reddit</p>
      </div>

      {/* Controls Bar */}
      <div
        className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 animate-fade-in-up stagger-child-1"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
              Platform
            </label>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm appearance-none pr-10 cursor-pointer"
              >
                <option>Twitter</option>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Reddit</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
              {platform === 'Twitter' && 'Search Keyword'}
              {platform === 'Instagram' && 'Username'}
              {platform === 'Facebook' && 'Page'}
              {platform === 'Reddit' && 'Subreddit'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                platform === 'Twitter' ? 'e.g. elections, AI' :
                platform === 'Instagram' ? 'e.g. nasa' :
                platform === 'Facebook' ? 'e.g. meta' :
                platform === 'Reddit' ? 'e.g. technology' :
                ''
              }
              className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm placeholder-[#475569]"
            />
          </div>

          {/* Post Limit */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] uppercase mb-2">
              Post Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={postLimit}
              onChange={(e) => setPostLimit(Math.min(100, parseInt(e.target.value) || 5))}
              className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] text-sm"
            />
          </div>

          {/* Fetch Button */}
          <div className="flex items-end">
            <button
              onClick={handleFetchPosts}
              disabled={loadingPosts}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              {loadingPosts ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Fetching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Fetch Posts
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
                    : 'bg-[rgba(99,102,241,0.1)] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)]'
                }`}
              >
                {f === 'all'
                  ? `All (${posts.length})`
                  : f === 'hate'
                    ? `Hate (${hateCount})`
                    : `Neutral (${neutralCount})`}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-[#64748B]">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(postLimit)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up stagger-child-3">
          {filteredPosts.map((post, idx) => (
            <div key={post.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <PostCard
                post={post}
                analysisResult={analysisResults[post.id]}
                isAnalyzing={analyzingIds[post.id]}
                onAnalyze={() => handleAnalyzePost(post)}
                onDownloadReport={() => handleDownloadPostReport(post, analysisResults[post.id])}
              />
            </div>
          ))}
        </div>
      ) : posts.length === 0 && !loadingPosts ? (
        <div
          className="p-12 text-center rounded-xl border border-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(18,18,26,0.5)',
          }}
        >
          <p className="text-[#64748B]">No posts fetched yet. Select a platform and click "Fetch Posts"</p>
        </div>
      ) : null}
    </div>
  )
}

export default SocialMonitor
