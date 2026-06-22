// Performance Tracking utilities

const PERFORMANCE_KEY = 'hateguard_performance'
const SESSION_STATS_KEY = 'hateguard_session_stats'

export const performanceTracker = {
  // Track a new analysis performance
  trackAnalysis: (analysisData) => {
    try {
      const metrics = performanceTracker.getMetrics()
      const newMetric = {
        id: Date.now(),
        type: analysisData.type, // 'text', 'image', 'social'
        category: analysisData.category,
        confidence: analysisData.confidence,
        responseTime: analysisData.responseTime, // in ms
        timestamp: new Date().toISOString(),
        status: 'success',
      }
      metrics.push(newMetric)
      localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(metrics))
      
      // Update session stats
      performanceTracker.updateSessionStats(newMetric)
      
      return newMetric
    } catch (error) {
      console.error('Error tracking analysis:', error)
      throw error
    }
  },

  // Get all performance metrics
  getMetrics: () => {
    try {
      const data = localStorage.getItem(PERFORMANCE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading metrics:', error)
      return []
    }
  },

  // Update session statistics
  updateSessionStats: (metric) => {
    try {
      const stats = performanceTracker.getSessionStats()
      stats.totalRequests += 1
      stats.responseTimeSum += metric.responseTime || 0
      stats.lastAnalysisTime = metric.timestamp
      
      // Track category counts
      if (!stats.categoryCount[metric.category]) {
        stats.categoryCount[metric.category] = 0
      }
      stats.categoryCount[metric.category] += 1
      
      localStorage.setItem(SESSION_STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Error updating session stats:', error)
    }
  },

  // Get session statistics
  getSessionStats: () => {
    try {
      const data = localStorage.getItem(SESSION_STATS_KEY)
      if (!data) {
        return {
          totalRequests: 0,
          responseTimeSum: 0,
          lastAnalysisTime: null,
          categoryCount: {},
          sessionStartTime: new Date().toISOString(),
        }
      }
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading session stats:', error)
      return {
        totalRequests: 0,
        responseTimeSum: 0,
        lastAnalysisTime: null,
        categoryCount: {},
        sessionStartTime: new Date().toISOString(),
      }
    }
  },

  // Calculate average response time
  getAverageResponseTime: () => {
    try {
      const metrics = performanceTracker.getMetrics()
      if (metrics.length === 0) return 0
      const sum = metrics.reduce((acc, m) => acc + (m.responseTime || 0), 0)
      return Math.round(sum / metrics.length)
    } catch (error) {
      console.error('Error calculating average response time:', error)
      return 0
    }
  },

  // Calculate success rate percentage
  getSuccessRate: () => {
    try {
      const metrics = performanceTracker.getMetrics()
      if (metrics.length === 0) return 100
      const successful = metrics.filter((m) => m.status === 'success').length
      return Math.round((successful / metrics.length) * 100)
    } catch (error) {
      console.error('Error calculating success rate:', error)
      return 100
    }
  },

  // Get category distribution
  getCategoryDistribution: () => {
    try {
      const stats = performanceTracker.getSessionStats()
      return stats.categoryCount
    } catch (error) {
      console.error('Error getting category distribution:', error)
      return {}
    }
  },

  // Get confidence average per category
  getConfidenceByCategory: () => {
    try {
      const metrics = performanceTracker.getMetrics()
      const categoryConfidence = {}
      
      metrics.forEach((m) => {
        if (!categoryConfidence[m.category]) {
          categoryConfidence[m.category] = { sum: 0, count: 0 }
        }
        categoryConfidence[m.category].sum += m.confidence || 0
        categoryConfidence[m.category].count += 1
      })

      const result = {}
      Object.entries(categoryConfidence).forEach(([category, data]) => {
        result[category] = Math.round(data.sum / data.count)
      })
      
      return result
    } catch (error) {
      console.error('Error getting confidence by category:', error)
      return {}
    }
  },

  // Get metrics by type
  getMetricsByType: (type) => {
    try {
      const metrics = performanceTracker.getMetrics()
      return metrics.filter((m) => m.type === type)
    } catch (error) {
      console.error('Error getting metrics by type:', error)
      return []
    }
  },

  // Clear all metrics
  clearMetrics: () => {
    try {
      localStorage.removeItem(PERFORMANCE_KEY)
      localStorage.removeItem(SESSION_STATS_KEY)
    } catch (error) {
      console.error('Error clearing metrics:', error)
      throw error
    }
  },

  // Get last N metrics
  getLastMetrics: (n = 10) => {
    try {
      const metrics = performanceTracker.getMetrics()
      return metrics.slice(-n)
    } catch (error) {
      console.error('Error getting last metrics:', error)
      return []
    }
  },
}

export default performanceTracker
