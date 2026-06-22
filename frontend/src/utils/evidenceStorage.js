// Evidence Storage utilities for localStorage management

const EVIDENCE_KEY = 'hateguard_evidence'

export const evidenceStorage = {
  // Save a new analysis to evidence log
  saveEvidence: (item) => {
    try {
      const evidence = evidenceStorage.getEvidence()
      const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...item,
      }
      evidence.push(newItem)
      localStorage.setItem(EVIDENCE_KEY, JSON.stringify(evidence))
      return newItem
    } catch (error) {
      console.error('Error saving evidence:', error)
      throw error
    }
  },

  // Get all evidence
  getEvidence: () => {
    try {
      const data = localStorage.getItem(EVIDENCE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading evidence:', error)
      return []
    }
  },

  // Delete evidence by ID
  deleteEvidence: (id) => {
    try {
      const evidence = evidenceStorage.getEvidence()
      const filtered = evidence.filter((item) => item.id !== id)
      localStorage.setItem(EVIDENCE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting evidence:', error)
      throw error
    }
  },

  // Clear all evidence
  clearEvidence: () => {
    try {
      localStorage.removeItem(EVIDENCE_KEY)
    } catch (error) {
      console.error('Error clearing evidence:', error)
      throw error
    }
  },

  // Export evidence as CSV
  exportAsCSV: () => {
    try {
      const evidence = evidenceStorage.getEvidence()
      if (evidence.length === 0) {
        return 'No evidence to export'
      }

      const headers = ['ID', 'Type', 'Content', 'Category', 'Confidence', 'Date/Time']
      const rows = evidence.map((item) => [
        item.id,
        item.type,
        `"${item.text?.substring(0, 100) || ''}"`,
        item.category || '',
        `${item.confidence || 0}%`,
        new Date(item.timestamp).toLocaleString(),
      ])

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
      
      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `evidence-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      throw error
    }
  },

  // Get evidence filtered by category
  getByCategory: (category) => {
    try {
      const evidence = evidenceStorage.getEvidence()
      return evidence.filter((item) => item.category === category)
    } catch (error) {
      console.error('Error filtering by category:', error)
      return []
    }
  },

  // Search evidence by text
  searchEvidence: (query) => {
    try {
      const evidence = evidenceStorage.getEvidence()
      return evidence.filter(
        (item) =>
          item.text?.toLowerCase().includes(query.toLowerCase()) ||
          item.category?.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching evidence:', error)
      return []
    }
  },
}

export default evidenceStorage
