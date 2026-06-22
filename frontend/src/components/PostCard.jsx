import React, { useState } from 'react'
import { BadgeLabel } from './BadgeLabel'
import { ExternalLink, Zap, FileDown } from 'lucide-react'

export const PostCard = ({ post, analysisResult, isAnalyzing, onAnalyze, onDownloadReport }) => {
  const [imgError, setImgError] = useState(false)

  const timeAgo = (timestamp) => {
    // Handle different timestamp formats
    let seconds = 0
    if (typeof timestamp === 'string') {
      // Try to parse ISO date string
      try {
        seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
      } catch {
        return 'N/A'
      }
    } else if (typeof timestamp === 'number') {
      seconds = Math.floor(Date.now() / 1000 - timestamp)
    } else {
      return 'N/A'
    }
    
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 }
    for (const [key, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value)
      if (interval >= 1) return interval === 1 ? `${interval} ${key} ago` : `${interval} ${key}s ago`
    }
    return 'just now'
  }

  // Use relative_time from backend if available, otherwise calculate locally
  const displayTime = post.relative_time || timeAgo(post.created_utc || post.timestamp)

  const getImageUrl = () => {
    if (!post.image) return null
    
    // For Instagram posts, proxy through backend to bypass CORS
    if (post.platform === 'Instagram' && post.image) {
      return `http://localhost:8000/api/proxy-image?url=${encodeURIComponent(post.image)}`
    }
    
    // Other platforms can load directly
    return post.image
  }

  const imageUrl = getImageUrl()

  const getPlatformColor = () => {
    return post.platform === 'Reddit' ? '#F97316' : '#8B5CF6'
  }

  const getPlatformAccentStyle = () => {
    const colors = {
      'Reddit': 'border-l-[#F97316]',
      'Mastodon': 'border-l-[#8B5CF6]'
    }
    return colors[post.platform] || 'border-l-[#6366F1]'
  }

  const getPostText = () => {
    const text = post.text || post.content || ''
    return text.substring(0, 200) + (text.length > 200 ? '...' : '')
  }
  const postText = getPostText()

  return (
    <div 
      className="glass-morphism rounded-xl overflow-hidden hover-lift animate-fade-in-up border-l-4 group transition-all duration-300"
      style={{ borderLeftColor: getPlatformColor() }}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Author Avatar */}
            {post.author_avatar && !imgError && (
              <img
                src={post.author_avatar}
                alt={post.author}
                className="w-10 h-10 object-cover rounded-full flex-shrink-0 border border-[rgba(99,102,241,0.3)]"
                onError={() => setImgError(true)}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" 
                  style={{ 
                    backgroundColor: getPlatformColor(),
                    boxShadow: `0 0 8px ${getPlatformColor()}40`
                  }}>
                  {post.platform}
                </span>
                {post.subreddit && (
                  <span className="text-xs text-[#64748B]">
                    {post.platform === 'Reddit' ? `r/${post.subreddit}` : post.subreddit}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[#F1F5F9] truncate">{post.author}</p>
              <p className="text-xs text-[#64748B] mt-1">{displayTime}</p>
            </div>
          </div>

          {/* Thumbnail */}
          {imageUrl && !imgError && (
            <img
              src={imageUrl}
              alt="Post thumbnail"
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-[rgba(99,102,241,0.2)]"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 py-3">
        <p className="text-sm text-[#D1D5DB] line-clamp-4 leading-relaxed">{postText}</p>
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div 
          className="px-4 py-3 border-t border-[rgba(255,255,255,0.05)]"
          style={{
            backgroundColor: 'rgba(18,18,26,0.6)',
            borderLeft: `3px solid ${
              analysisResult.label === 'HATE_SPEECH' ? '#EF4444' :
              analysisResult.label === 'SECTARIAN' ? '#8B5CF6' :
              analysisResult.label === 'RACIAL_ABUSE' ? '#F97316' :
              analysisResult.label === 'RELIGIOUS_THREAT' ? '#B91C1C' :
              '#10B981'
            }`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <BadgeLabel label={analysisResult.label} size="sm" />
            <span className="text-xs font-bold text-[#F1F5F9]">{analysisResult.confidence}%</span>
          </div>
          <div className="w-full bg-[rgba(99,102,241,0.1)] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-1.5 rounded-full transition-all duration-500" 
              style={{ 
                width: `${analysisResult.confidence}%`,
                backgroundColor: 
                  analysisResult.label === 'HATE_SPEECH' ? '#EF4444' :
                  analysisResult.label === 'SECTARIAN' ? '#8B5CF6' :
                  analysisResult.label === 'RACIAL_ABUSE' ? '#F97316' :
                  analysisResult.label === 'RELIGIOUS_THREAT' ? '#B91C1C' :
                  '#10B981'
              }} 
            />
          </div>
          <p className="text-xs text-[#64748B] italic mt-2">{analysisResult.reason}</p>
        </div>
      )}

      {/* Footer Section */}
      <div className="px-4 py-3 bg-[rgba(99,102,241,0.05)] border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-2">
        {!analysisResult && (
          <button 
            onClick={onAnalyze} 
            disabled={isAnalyzing}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-3 h-3 border-1.5 border-[#6366F1] border-t-transparent rounded-full" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Analyze
              </>
            )}
          </button>
        )}
        {analysisResult && (
          <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
            ✓ Analyzed
          </span>
        )}
        {analysisResult && onDownloadReport && (
          <button
            onClick={onDownloadReport}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 ml-2"
            title="Download PDF Report"
          >
            <FileDown className="w-3 h-3" />
            Report
          </button>
        )}
        {/* Only show Source button for real posts, not dataset posts */}
        {post.source !== 'dataset' && (
          <a 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6366F1] hover:text-[#8B5CF6] transition-colors ml-auto"
            title={post.url}
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}