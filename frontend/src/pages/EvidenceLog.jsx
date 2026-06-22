import React, { useState, useEffect } from 'react'
import { Search, Trash2, Eye, Download, Filter, X } from 'lucide-react'
import evidenceStorage from '../utils/evidenceStorage'

const ITEMS_PER_PAGE = 8

export function EvidenceLog() {
  const [evidence, setEvidence] = useState([])
  const [filteredEvidence, setFilteredEvidence] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const categories = [
    'all',
    'HATE_SPEECH',
    'SECTARIAN',
    'RACIAL_ABUSE',
    'RELIGIOUS_THREAT',
    'NEUTRAL',
  ]

  const categoryColors = {
    HATE_SPEECH: '#EF4444',
    SECTARIAN: '#8B5CF6',
    RACIAL_ABUSE: '#F97316',
    RELIGIOUS_THREAT: '#B91C1C',
    NEUTRAL: '#10B981',
  }

  // Load evidence
  useEffect(() => {
    const allEvidence = evidenceStorage.getEvidence().reverse()
    setEvidence(allEvidence)
    applyFilters(allEvidence, searchQuery, categoryFilter)
  }, [])

  const applyFilters = (data, search, category) => {
    let filtered = data

    if (search.trim()) {
      filtered = filtered.filter((item) =>
        item.text?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'all') {
      filtered = filtered.filter((item) => item.category === category)
    }

    setFilteredEvidence(filtered)
    setCurrentPage(1)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    applyFilters(evidence, query, categoryFilter)
  }

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category)
    applyFilters(evidence, searchQuery, category)
  }

  const handleDelete = (id) => {
    evidenceStorage.deleteEvidence(id)
    const updated = evidence.filter((item) => item.id !== id)
    setEvidence(updated)
    applyFilters(updated, searchQuery, categoryFilter)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all evidence?')) {
      evidenceStorage.clearEvidence()
      setEvidence([])
      setFilteredEvidence([])
    }
  }

  const handleExportCSV = () => {
    evidenceStorage.exportAsCSV()
  }

  const paginatedEvidence = filteredEvidence.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const totalPages = Math.ceil(filteredEvidence.length / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      <div className="mb-8 flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">Evidence Log</h1>
          <p className="text-[#64748B]">
            View and manage all saved analyses
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={evidence.length === 0}
          className="px-4 py-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[#10B981] text-[#10B981] hover:bg-[rgba(16,185,129,0.2)] disabled:opacity-50 transition-all font-medium text-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in-up stagger-child-1">
        {/* Search */}
        <div
          className="p-4 rounded-lg border border-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(18,18,26,0.8)',
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by text content..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A0F] border border-[rgba(99,102,241,0.3)] focus:border-[#6366F1] focus:outline-none text-[#F1F5F9] placeholder-[#64748B] text-sm"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div
          className="p-4 rounded-lg border border-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(18,18,26,0.8)',
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[#64748B]" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[rgba(99,102,241,0.1)] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)]'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(searchQuery || categoryFilter !== 'all') && (
        <div className="mb-4 flex items-center gap-2">
          <p className="text-xs text-[#64748B]">Filters active</p>
          <button
            onClick={() => {
              handleSearch('')
              handleCategoryFilter('all')
            }}
            className="text-xs text-[#6366F1] hover:text-[#8B5CF6] transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {evidence.length === 0 ? (
        <div
          className="p-12 text-center rounded-xl border border-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(18,18,26,0.5)',
          }}
        >
          <p className="text-[#64748B] mb-2">No evidence logged yet</p>
          <p className="text-xs text-[#64748B]">
            Analyze text, images, or social posts to build your evidence log
          </p>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div
          className="p-12 text-center rounded-xl border border-[rgba(255,255,255,0.08)]"
          style={{
            background: 'rgba(18,18,26,0.5)',
          }}
        >
          <p className="text-[#64748B]">No evidence matches your filters</p>
        </div>
      ) : (
        <>
          <div
            className="rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden animate-fade-in-up stagger-child-2"
            style={{
              background: 'rgba(18,18,26,0.8)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(99,102,241,0.05)]">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">
                      Content Preview
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">
                      Confidence
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">
                      Date/Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvidence.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(99,102,241,0.05)] transition-colors"
                    >
                      <td className="px-4 py-2 text-[#64748B]">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-2 text-[#F1F5F9]">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-[rgba(99,102,241,0.1)]">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#64748B] max-w-xs truncate">
                        {item.text?.substring(0, 60) || 'N/A'}...
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: `${categoryColors[item.category]}20`,
                            color: categoryColors[item.category],
                          }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-[rgba(99,102,241,0.1)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.confidence}%`,
                                backgroundColor: categoryColors[item.category],
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: categoryColors[item.category],
                            }}
                          >
                            {item.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[#64748B] text-xs">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setShowModal(true)
                          }}
                          className="p-1.5 hover:bg-[rgba(99,102,241,0.1)] rounded transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-[#6366F1]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-[rgba(239,68,68,0.1)] rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-[#EF4444]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-[#64748B]">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvidence.length)} of{' '}
                  {filteredEvidence.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[#6366F1] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-50 transition-all text-sm"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-3 text-sm text-[#64748B]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[#6366F1] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)] disabled:opacity-50 transition-all text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            className="mt-6 px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-all font-medium text-sm"
          >
            Clear All Evidence
          </button>
        </>
      )}

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div
            className="rounded-xl border border-[rgba(255,255,255,0.08)] max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            style={{
              background: 'rgba(18,18,26,0.95)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#F1F5F9]">Evidence Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[rgba(99,102,241,0.1)] rounded transition-all"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Category</p>
                <span
                  className="inline-block px-3 py-1 text-sm font-medium rounded"
                  style={{
                    backgroundColor: `${categoryColors[selectedItem.category]}20`,
                    color: categoryColors[selectedItem.category],
                  }}
                >
                  {selectedItem.category}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Confidence</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[rgba(99,102,241,0.1)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedItem.confidence}%`,
                        backgroundColor: categoryColors[selectedItem.category],
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: categoryColors[selectedItem.category],
                    }}
                  >
                    {selectedItem.confidence}%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Type</p>
                <p className="text-sm text-[#F1F5F9] bg-[rgba(99,102,241,0.1)] rounded px-3 py-2">
                  {selectedItem.type}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Reason</p>
                <p className="text-sm text-[#F1F5F9] bg-[rgba(99,102,241,0.1)] rounded px-3 py-2 italic">
                  "{selectedItem.reason}"
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Analyzed Text</p>
                <div className="bg-[#0A0A0F] rounded px-3 py-2 border border-[rgba(99,102,241,0.2)] font-mono">
                  <p className="text-xs text-[#64748B] leading-relaxed">{selectedItem.text}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Date/Time</p>
                <p className="text-sm text-[#F1F5F9]">
                  {new Date(selectedItem.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedItem.text)
                  setShowModal(false)
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[#6366F1] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)] transition-all font-medium text-sm"
              >
                Copy Text
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedItem.id)
                  setShowModal(false)
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-all font-medium text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[#6366F1] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)] transition-all font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvidenceLog
