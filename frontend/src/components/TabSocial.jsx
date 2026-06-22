import React, { useState } from 'react'
import { PostCard } from './PostCard'
import { SkeletonCard } from './SkeletonCard'
import { fetchRedditPosts, redditSubreddits } from '../api/reddit'
import { fetchMastodonPosts, mastodonInstances } from '../api/mastodon'
import { analyzeText } from '../api/gemini'
import { Zap, ChevronDown } from 'lucide-react'

export const TabSocial = ({ onShowToast, onUpdateStats }) => {
  const [platform, setPlatform] = useState('Reddit')
  const [selectedItem, setSelectedItem] = useState(redditSubreddits[0])
  const [posts, setPosts] = useState([])
  const [analysisResults, setAnalysisResults] = useState({})
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [analyzingIds, setAnalyzingIds] = useState({})
  const [postLimit, setPostLimit] = useState(5)
  const [error, setError] = useState(null)

  const items = platform === 'Reddit' ? redditSubreddits : mastodonInstances

  const handleFetchPosts = async () => {
    setLoadingPosts(true)
    setError(null)
    setPosts([])
    setAnalysisResults({})
    setAnalyzingIds({})

    try {
      let fetchedPosts = []
      if (platform === 'Reddit') {
        fetchedPosts = await fetchRedditPosts(selectedItem, postLimit)
      } else {
        fetchedPosts = await fetchMastodonPosts(selectedItem, postLimit)
      }
      setPosts(fetchedPosts)
      onShowToast?.({ type: 'success', message: `Fetched ${fetchedPosts.length} posts` })
    } catch (err) {
      setError(`Failed to fetch posts from ${platform}. Please try again.`)
      onShowToast?.({ type: 'error', message: `Failed to fetch ${platform} posts` })
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleAnalyzePost = async (post) => {
    if (analysisResults[post.id]) return

    setAnalyzingIds((prev) => ({ ...prev, [post.id]: true }))

    try {
      const result = await analyzeText(post.text)
      setAnalysisResults((prev) => ({ ...prev, [post.id]: result }))

      const allResults = { ...analysisResults, [post.id]: result }
      onUpdateStats?.({
        total: Object.keys(allResults).length,
        hate: Object.values(allResults).filter((r) => r.label !== 'NEUTRAL').length,
        neutral: Object.values(allResults).filter((r) => r.label === 'NEUTRAL').length,
      })

      onShowToast?.({ type: 'success', message: 'Post analyzed!' })
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Analysis failed. Try again.' })
    } finally {
      setAnalyzingIds((prev) => ({ ...prev, [post.id]: false }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* 3 Dropdowns — Platform, Subreddit, Post Limit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Platform */}
        <div className="animate-fade-in-up stagger-child-1">
          <label className="block text-sm font-semibold gradient-text mb-3">
            Platform
          </label>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value)
                setSelectedItem(e.target.value === 'Reddit' ? redditSubreddits[0] : mastodonInstances[0])
                setPosts([])
                setAnalysisResults({})
              }}
              className="w-full px-4 py-2.5 pr-10 glass-morphism rounded-lg focus-ring text-[#F1F5F9] appearance-none cursor-pointer"
            >
              <option>Reddit</option>
              <option>Mastodon</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6366F1] pointer-events-none" />
          </div>
        </div>

        {/* Subreddit / Instance */}
        <div className="animate-fade-in-up stagger-child-2">
          <label className="block text-sm font-semibold gradient-text mb-3">
            {platform === 'Reddit' ? 'Subreddit' : 'Instance'}
          </label>
          <div className="relative">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 glass-morphism rounded-lg focus-ring text-[#F1F5F9] appearance-none cursor-pointer"
            >
              {items.map((item) => (
                <option key={item} value={item}>
                  {platform === 'Reddit' ? `r/${item}` : item}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6366F1] pointer-events-none" />
          </div>
        </div>

        {/* Post Limit */}
        <div className="animate-fade-in-up stagger-child-3">
          <label className="block text-sm font-semibold gradient-text mb-3">
            Posts to Fetch
          </label>
          <div className="relative">
            <select
              value={postLimit}
              onChange={(e) => setPostLimit(Number(e.target.value))}
              className="w-full px-4 py-2.5 pr-10 glass-morphism rounded-lg focus-ring text-[#F1F5F9] appearance-none cursor-pointer"
            >
              <option value={5}>5 posts</option>
              <option value={10}>10 posts</option>
              <option value={15}>15 posts</option>
              <option value={20}>20 posts</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6366F1] pointer-events-none" />
          </div>
        </div>

      </div>

      <button
        onClick={handleFetchPosts}
        disabled={loadingPosts}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up stagger-child-4"
      >
        {loadingPosts ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Fetching Posts...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Fetch Posts
          </>
        )}
      </button>

      {error && (
        <div className="glass-morphism rounded-xl p-4 border-l-4 border-[#EF4444] animate-fade-in-up">
          <p className="text-sm text-[#FCA5A5]">{error}</p>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingPosts
          ? Array.from({ length: postLimit }).map((_, i) => <SkeletonCard key={i} />)
          : posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                analysisResult={analysisResults[post.id]}
                isAnalyzing={analyzingIds[post.id]}
                onAnalyze={() => handleAnalyzePost(post)}
              />
            ))}
      </div>

      {!loadingPosts && posts.length === 0 && !error && (
        <div className="text-center py-16 text-[#64748B]">
          <p className="text-sm">Select a platform and source, then click "Fetch Posts" to get started.</p>
        </div>
      )}
    </div>
  )
}