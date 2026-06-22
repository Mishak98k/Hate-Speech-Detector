import React, { useState, useEffect } from 'react'
import { Activity, Zap, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import performanceTracker from '../utils/performanceTracker'

export function Performance() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    successRate: 100,
    categoryCount: {},
  })
  const [metrics, setMetrics] = useState([])
  const [categoryDistribution, setCategoryDistribution] = useState({})
  const [confidenceByCategory, setConfidenceByCategory] = useState({})
  const [apiStatus, setApiStatus] = useState({
    gemini: 'connected',
    backend: 'running',
  })

  useEffect(() => {
    // Load performance data
    const sessionStats = performanceTracker.getSessionStats()
    setStats({
      totalRequests: sessionStats.totalRequests,
      avgResponseTime: performanceTracker.getAverageResponseTime(),
      successRate: performanceTracker.getSuccessRate(),
      categoryCount: sessionStats.categoryCount,
    })

    // Get last 10 metrics
    const lastMetrics = performanceTracker.getLastMetrics(10)
    setMetrics(lastMetrics)

    // Get category distribution
    const distribution = performanceTracker.getCategoryDistribution()
    setCategoryDistribution(distribution)

    // Get confidence by category
    const confidence = performanceTracker.getConfidenceByCategory()
    setConfidenceByCategory(confidence)
  }, [])

  const categoryColors = {
    HATE_SPEECH: '#EF4444',
    SECTARIAN: '#8B5CF6',
    RACIAL_ABUSE: '#F97316',
    RELIGIOUS_THREAT: '#B91C1C',
    NEUTRAL: '#10B981',
  }

  const getStatusIcon = (status) => {
    return status === 'connected' || status === 'active' || status === 'running' ? (
      <div className="w-2 h-2 rounded-full bg-[#10B981]" style={{
        boxShadow: '0 0 6px rgba(16,185,129,0.6)',
      }} />
    ) : (
      <div className="w-2 h-2 rounded-full bg-[#EF4444]" style={{
        boxShadow: '0 0 6px rgba(239,68,68,0.6)',
      }} />
    )
  }

  const getResponseTimeColor = (ms) => {
    if (ms < 2000) return '#10B981'
    if (ms < 4000) return '#F97316'
    return '#EF4444'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">Performance</h1>
        <p className="text-[#64748B]">Analytics and system metrics</p>
      </div>

      {/* Session Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Requests */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-1"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #6366F1',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[#64748B] text-sm font-medium">Total Requests Made</p>
            <Activity className="w-5 h-5 text-[#6366F1]" />
          </div>
          <p className="text-3xl font-bold text-[#F1F5F9]">{stats.totalRequests}</p>
          <p className="text-xs text-[#6366F1] mt-2">This session</p>
        </div>

        {/* Average Response Time */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-2"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: `4px solid ${getResponseTimeColor(stats.avgResponseTime)}`,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[#64748B] text-sm font-medium">Avg Response Time</p>
            <Zap className="w-5 h-5" style={{ color: getResponseTimeColor(stats.avgResponseTime) }} />
          </div>
          <p className="text-3xl font-bold text-[#F1F5F9]">{stats.avgResponseTime}ms</p>
          <p className="text-xs mt-2" style={{ color: getResponseTimeColor(stats.avgResponseTime) }}>
            {stats.avgResponseTime < 2000
              ? '⚡ Fast'
              : stats.avgResponseTime < 4000
                ? '⏱️ Normal'
                : '🐢 Slow'}
          </p>
        </div>

        {/* Success Rate */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-3"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #10B981',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[#64748B] text-sm font-medium">Success Rate</p>
            <CheckCircle className="w-5 h-5 text-[#10B981]" />
          </div>
          <p className="text-3xl font-bold text-[#F1F5F9]">{stats.successRate}%</p>
          <p className="text-xs text-[#10B981] mt-2">
            {stats.successRate === 100 ? '✓ Perfect' : stats.successRate > 90 ? '✓ Excellent' : '⚠️ Good'}
          </p>
        </div>

        {/* Categories Detected */}
        <div
          className="p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover-lift animate-fade-in-up stagger-child-4"
          style={{
            background: 'rgba(18,18,26,0.8)',
            borderLeft: '4px solid #8B5CF6',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[#64748B] text-sm font-medium">Categories Detected</p>
            <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <p className="text-3xl font-bold text-[#F1F5F9]">
            {Object.keys(stats.categoryCount).length}
          </p>
          <p className="text-xs text-[#8B5CF6] mt-2">Types identified</p>
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 animate-fade-in-up stagger-child-5"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Category Distribution</h2>
        <div className="space-y-4">
          {Object.entries(categoryDistribution).map(([category, count]) => {
            const total = Object.values(categoryDistribution).reduce((a, b) => a + b, 0) || 1
            const percentage = Math.round((count / total) * 100)
            return (
              <div key={category} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="text-sm font-medium text-[#F1F5F9]">
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
                <div className="text-right w-20">
                  <p className="text-sm font-semibold text-[#F1F5F9]">
                    {percentage}% ({count})
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Response Time Log */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 animate-fade-in-up stagger-child-6"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Response Time Log (Last 10)</h2>
        {metrics.length === 0 ? (
          <p className="text-[#64748B]">No metrics recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(99,102,241,0.05)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">
                    Response Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.reverse().map((metric, idx) => {
                  const color = getResponseTimeColor(metric.responseTime || 0)
                  return (
                    <tr
                      key={idx}
                      className="border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(99,102,241,0.05)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#64748B]">{idx + 1}</td>
                      <td className="px-4 py-3 text-[#F1F5F9]">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-[rgba(99,102,241,0.1)]">
                          {metric.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-semibold"
                          style={{
                            color,
                          }}
                        >
                          {metric.responseTime || 0}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#F1F5F9]">
                        {metric.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-[#10B981]">
                          ✓ {metric.status || 'success'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Status */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 animate-fade-in-up stagger-child-7"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Gemini API', icon: '🤖', status: apiStatus.gemini },
            { name: 'Backend Server', icon: '⚙️', status: apiStatus.backend },
          ].map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(99,102,241,0.05)]"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-[#F1F5F9]">{item.name}</p>
                <span className="text-lg">{item.icon}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className="text-xs font-medium text-[#10B981] capitalize">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy Metrics */}
      <div
        className="p-8 rounded-xl border border-[rgba(255,255,255,0.08)] animate-fade-in-up stagger-child-8"
        style={{
          background: 'rgba(18,18,26,0.8)',
        }}
      >
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Accuracy Metrics per Category</h2>
        {Object.keys(confidenceByCategory).length === 0 ? (
          <p className="text-[#64748B]">No accuracy data available yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(confidenceByCategory).map(([category, confidence]) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="text-sm font-medium text-[#F1F5F9]">
                    {category.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-[rgba(99,102,241,0.1)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${confidence}%`,
                        backgroundColor: categoryColors[category],
                      }}
                    />
                  </div>
                </div>
                <div className="text-right w-20">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: categoryColors[category],
                    }}
                  >
                    {confidence}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Performance
