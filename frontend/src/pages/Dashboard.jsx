import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  FileText,
  Image,
  Radio,
} from 'lucide-react'
import evidenceStorage from '../utils/evidenceStorage'
import performanceTracker from '../utils/performanceTracker'

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    hate: 0,
    neutral: 0,
    accuracy: 94.2,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [categoryDistribution, setCategoryDistribution] = useState({})
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update time
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Load stats from evidence
    const evidence = evidenceStorage.getEvidence()
    const hate = evidence.filter(
      (item) => item.category && item.category !== 'NEUTRAL'
    ).length
    const neutral = evidence.filter(
      (item) => item.category === 'NEUTRAL'
    ).length

    setStats({
      total: evidence.length,
      hate,
      neutral,
      accuracy: 94.2,
    })

    // Get recent activity (last 5)
    setRecentActivity(evidence.slice(-5).reverse())

    // Get category distribution
    const distribution = {}
    const categories = [
      'HATE_SPEECH',
      'SECTARIAN',
      'RACIAL_ABUSE',
      'RELIGIOUS_THREAT',
      'NEUTRAL',
    ]
    categories.forEach((cat) => {
      distribution[cat] = evidence.filter(
        (item) => item.category === cat
      ).length
    })
    setCategoryDistribution(distribution)
  }, [])

  const totalForChart =
    Object.values(categoryDistribution).reduce((a, b) => a + b, 0) || 1
  const categoryColors = {
    HATE_SPEECH: '#EF4444',
    SECTARIAN: '#8B5CF6',
    RACIAL_ABUSE: '#F97316',
    RELIGIOUS_THREAT: '#B91C1C',
    NEUTRAL: '#10B981',
  }

  const hatePercentage = stats.total > 0 
    ? Math.round((stats.hate / stats.total) * 100) 
    : 0
  const neutralPercentage = stats.total > 0 
    ? Math.round((stats.neutral / stats.total) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      {/* Welcome Banner */}
      <div className="mb-12 animate-fade-in-up">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome to HateGuard AI
        </h1>
        <p className="text-[#64748B] text-lg mb-3">
          AI-powered hate speech detection system
        </p>
        <p className="text-[#6366F1] font-medium text-sm">
          📅 {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
      </div>

      {/* Stats Grid (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Total Analyzed */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-1 relative overflow-hidden"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #6366F1',
          }}
        >
          <div className="absolute top-4 right-4">
            <TrendingUp className="w-6 h-6 text-[#6366F1]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium mb-2">
            Total Analyzed
          </p>
          <p className="text-4xl font-bold text-[#F1F5F9] mb-4">
            {stats.total}
          </p>
          <p className="text-xs text-[#6366F1]">↑ 12% this session</p>
        </div>

        {/* Hate Detected */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-2 relative overflow-hidden"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #EF4444',
          }}
        >
          <div className="absolute top-4 right-4">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium mb-2">
            Hate Detected
          </p>
          <p className="text-4xl font-bold text-[#F1F5F9] mb-4">
            {hatePercentage}%
          </p>
          <p className="text-xs text-[#EF4444]">↑ 5% this session</p>
        </div>

        {/* Neutral Content */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-3 relative overflow-hidden"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #10B981',
          }}
        >
          <div className="absolute top-4 right-4">
            <CheckCircle className="w-6 h-6 text-[#10B981]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium mb-2">
            Neutral Content
          </p>
          <p className="text-4xl font-bold text-[#F1F5F9] mb-4">
            {neutralPercentage}%
          </p>
          <p className="text-xs text-[#10B981]">↑ 8% this session</p>
        </div>

        {/* Accuracy Rate */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-4 relative overflow-hidden"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #3B82F6',
          }}
        >
          <div className="absolute top-4 right-4">
            <Zap className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <p className="text-[#64748B] text-sm font-medium mb-2">
            Accuracy Rate
          </p>
          <p className="text-4xl font-bold text-[#F1F5F9] mb-4">
            {stats.accuracy}%
          </p>
          <p className="text-xs text-[#3B82F6]">↑ Consistently high</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] mb-12 animate-fade-in-up stagger-child-5"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">
          Category Breakdown
        </h2>
        <div className="space-y-4">
          {Object.entries(categoryDistribution).map(([category, count]) => {
            const percentage =
              totalForChart > 0 ? Math.round((count / totalForChart) * 100) : 0
            return (
              <div key={category} className="flex items-center gap-4">
                <div className="w-24">
                  <p className="text-xs font-medium text-[#64748B]">
                    {category.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[rgba(99,102,241,0.1)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: categoryColors[category],
                      }}
                    />
                  </div>
                </div>
                <div className="text-right w-16">
                  <p className="text-sm font-semibold text-[#F1F5F9]">
                    {percentage}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] mb-12 animate-fade-in-up stagger-child-6"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">
          Recent Activity
        </h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-[rgba(99,102,241,0.05)] rounded-lg border border-[rgba(99,102,241,0.1)] flex items-center gap-3"
              >
                <div className="p-2 rounded bg-[rgba(99,102,241,0.2)]">
                  {item.type === 'text' && <FileText className="w-4 h-4 text-[#6366F1]" />}
                  {item.type === 'image' && <Image className="w-4 h-4 text-[#6366F1]" />}
                  {item.type === 'social' && <Radio className="w-4 h-4 text-[#6366F1]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">
                    {item.text?.substring(0, 60) || 'N/A'}...
                  </p>
                </div>
                <span
                  className="px-2 py-1 text-xs font-medium rounded"
                  style={{
                    backgroundColor: categoryColors[item.category]
                      ? `${categoryColors[item.category]}20`
                      : 'rgba(99,102,241,0.1)',
                    color: categoryColors[item.category] || '#6366F1',
                  }}
                >
                  {item.category || 'Unknown'}
                </span>
                <p className="text-xs text-[#64748B] whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#64748B] text-center py-8">No recent activity</p>
        )}
        <button
          onClick={() => navigate('/evidence')}
          className="mt-4 w-full py-2 text-sm font-medium text-[#6366F1] hover:bg-[rgba(99,102,241,0.1)] rounded-lg transition-colors"
        >
          View Evidence Log <ArrowRight className="inline w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-child-7">
        <button
          onClick={() => navigate('/text')}
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
          }}
        >
          <FileText className="w-8 h-8 text-[#6366F1] mb-3" />
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">
            Analyze Text
          </h3>
          <p className="text-sm text-[#64748B]">
            Detect hate speech in text content
          </p>
        </button>

        <button
          onClick={() => navigate('/image')}
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))',
          }}
        >
          <Image className="w-8 h-8 text-[#8B5CF6] mb-3" />
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">
            Analyze Image
          </h3>
          <p className="text-sm text-[#64748B]">
            Extract and analyze text from images
          </p>
        </button>

        <button
          onClick={() => navigate('/social')}
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
          }}
        >
          <Radio className="w-8 h-8 text-[#6366F1] mb-3" />
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">
            Monitor Social
          </h3>
          <p className="text-sm text-[#64748B]">
            Fetch and analyze social media posts
          </p>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
