import React, { useState, useEffect } from 'react'
import { Download, Loader, CheckCircle, X } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import evidenceStorage from '../utils/evidenceStorage'
import { generateSingleItemPDF } from '../utils/generateSingleItemPDF'

const categoryColors = {
  HATE_SPEECH: '#EF4444',
  SECTARIAN: '#8B5CF6',
  RACIAL_ABUSE: '#F97316',
  RELIGIOUS_THREAT: '#B91C1C',
  NEUTRAL: '#10B981',
}

const categoryDescriptions = {
  HATE_SPEECH: 'Content promoting hatred against individuals or groups',
  SECTARIAN: 'Content inciting sectarian violence or discrimination',
  RACIAL_ABUSE: 'Content containing racial slurs or racial discrimination',
  RELIGIOUS_THREAT: 'Content containing religious threats or extremist messaging',
  NEUTRAL: 'No hate speech detected. Content appears to be safe.',
}

function formatCategoryName(category) {
  return category.replace(/_/g, ' ')
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp)
  // Convert to Pakistan Standard Time (UTC+5)
  const pakistanTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
  return {
    date: pakistanTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: pakistanTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

export default function PDFReport() {
  const [evidence, setEvidence] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterType, setFilterType] = useState('Text')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadEvidence()
  }, [])

  const loadEvidence = () => {
    try {
      const data = evidenceStorage.getEvidence()
      setEvidence(data || [])
      if (data && data.length > 0) {
        setSelectedItem(data[0])
      }
    } catch (err) {
      console.error('Error loading evidence:', err)
      setEvidence([])
    }
  }

  const getFilteredEvidence = () => {
    const typeMap = {
      'Text': 'text',
      'Image': 'image',
      'Social': 'social',
    }
    const filtered = evidence.filter((item) => item.type === typeMap[filterType])
    // Sort in descending order (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const handleDownloadSelectedReport = async () => {
    if (!selectedItem) return
    setDownloading(true)
    try {
      generateSingleItemPDF(selectedItem)
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setDownloading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'text':
        return 'bg-[rgba(99,102,241,0.2)] text-[#6366F1]'
      case 'image':
        return 'bg-[rgba(249,115,22,0.2)] text-[#F97316]'
      case 'social':
        return 'bg-[rgba(139,92,246,0.2)] text-[#8B5CF6]'
      default:
        return 'bg-[rgba(100,116,139,0.2)] text-[#64748B]'
    }
  }

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const filteredEvidence = getFilteredEvidence()

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-8 py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2">PDF Report</h1>
        <p className="text-[#64748B]">Review and download detailed analysis reports</p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE - Results Table */}
        <div className="lg:col-span-1 animate-fade-in-up stagger-child-1">
          <div className="glass-morphism rounded-xl overflow-hidden h-full flex flex-col">
            {/* Filter Tabs */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex flex-wrap gap-2">
                {['Text', 'Image', 'Social'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterType === tab
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-[rgba(99,102,241,0.1)] text-[#6366F1] hover:bg-[rgba(99,102,241,0.2)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Table / List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredEvidence.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#64748B] text-sm">No evidence to display</p>
                  <p className="text-[#475569] text-xs mt-2">
                    {evidence.length === 0
                      ? 'Start by analyzing content to generate reports'
                      : `No ${filterType.toLowerCase()} analyses found`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvidence.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-3 rounded-lg transition-all border ${
                        selectedItem?.id === item.id
                          ? 'bg-[rgba(99,102,241,0.2)] border-[#6366F1]'
                          : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.08)]'
                      }`}
                    >
                      {/* Radio button indicator */}
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedItem?.id === item.id
                              ? 'border-[#6366F1] bg-[#6366F1]'
                              : 'border-[#64748B]'
                          }`}
                        >
                          {selectedItem?.id === item.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0F]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Type Badge */}
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1 ${getTypeColor(
                              item.type
                            )}`}
                          >
                            {getTypeLabel(item.type)}
                          </span>

                          {/* Content Preview */}
                          <p className="text-xs text-[#D1D5DB] truncate">
                            {(item.text || '').substring(0, 60)}
                            {(item.text || '').length > 60 ? '...' : ''}
                          </p>

                          {/* Category and Confidence */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: categoryColors[item.category] }}
                            >
                              {formatCategoryName(item.category)}
                            </span>
                            <span className="text-xs text-[#64748B]">{item.confidence}%</span>
                          </div>

                          {/* Date/Time */}
                          <p className="text-xs text-[#475569] mt-1">
                            {formatDateTime(item.timestamp).date}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Report Preview */}
        <div className="lg:col-span-2 animate-fade-in-up stagger-child-2">
          <div className="glass-morphism rounded-xl overflow-hidden h-full flex flex-col">
            {!selectedItem ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <p className="text-[#64748B] text-lg mb-2">Select an analysis to preview</p>
                  <p className="text-[#475569] text-sm">
                    Choose an item from the list on the left to see its full report
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <PDFPreview item={selectedItem} />
                </div>

                {/* Download Button */}
                <div className="p-4 pt-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(99,102,241,0.05)]">
                  <button
                    onClick={handleDownloadSelectedReport}
                    disabled={downloading}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6366F1]/50 disabled:opacity-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Report
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// PDF Preview Component
function PDFPreview({ item }) {
  const categoryName = formatCategoryName(item.category)
  const color = categoryColors[item.category]
  const { date, time } = formatDateTime(item.timestamp)
  
  // Platform name for social posts
  const platformName = item.platform 
    ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
    : 'Social Media'

  return (
    <div className="space-y-6 text-[#F1F5F9]">
      {/* Header Section */}
      <div className="text-center pb-3">
        <p className="text-xs text-[#64748B] mb-2">HATEGUARD AI ANALYSIS SYSTEM</p>
        <h1 className="text-3xl font-bold text-[#6366F1] mb-3 mt-3">HATEGUARD AI</h1>
        <p className="text-sm text-[#64748B]">Automated Hate Speech Detection System</p>
        <p className="text-sm text-[#64748B] mb-4">AI-Powered Content Analysis Report</p>
        {/* Blue divider line */}
        <div className="h-1 bg-[#3B82F6] rounded-full"></div>
      </div>

      {/* Case Information */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">CASE INFORMATION</h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[#64748B] mb-1">Report Number</p>
            <p className="text-[#F1F5F9] font-semibold">RPT-{item.id}</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Date of Analysis</p>
            <p className="text-[#F1F5F9] font-semibold">{date}</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Time of Analysis</p>
            <p className="text-[#F1F5F9] font-semibold">{time}</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Analysis Type</p>
            <p className="text-[#F1F5F9] font-semibold">{formatCategoryName(item.type)} Analysis</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Platform</p>
            <p className="text-[#F1F5F9] font-semibold">{item.platform ? platformName : 'N/A'}</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Content ID</p>
            <p className="text-[#F1F5F9] font-semibold">EXH-{item.id}</p>
          </div>
          <div>
            <p className="text-[#64748B] mb-1">Analyst</p>
            <p className="text-[#F1F5F9] font-semibold">HateGuard AI v1.0</p>
          </div>
        </div>
      </div>

      {/* Analysis Verdict */}
      <div
        className="p-6 rounded-lg"
        style={{ backgroundColor: color }}
      >
        <p className="font-bold text-lg text-white text-center mb-2">
          ANALYSIS VERDICT: {categoryName}
        </p>
        <p className="text-center text-white font-semibold">Confidence: {item.confidence}%</p>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[#64748B] italic bg-[rgba(99,102,241,0.05)] p-3 rounded">
        This report has been generated by HateGuard AI using Google Gemini's multimodal AI model. The findings are based on AI-assisted content analysis and should be reviewed by a qualified analyst before being used in any official or legal proceedings.
      </p>

      {/* Analysis Summary Table */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">ANALYSIS SUMMARY</h2>
        <div className="space-y-2 text-xs border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden">
          {[
            ['AI Classification', categoryName, `${item.confidence}%`],
            ['Category Type', categoryDescriptions[item.category], '—'],
            ['Content Type', `${formatCategoryName(item.type)} Analysis`, '—'],
            [
              'Risk Level',
              item.category === 'NEUTRAL' ? 'LOW' : 'HIGH',
              '—',
            ],
          ].map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-3 p-2 ${
                idx % 2 === 0 ? 'bg-[rgba(99,102,241,0.05)]' : ''
              }`}
            >
              <p className="font-semibold text-[#6366F1]">{row[0]}</p>
              <p className="text-[#D1D5DB]">{row[1]}</p>
              <p className="text-right text-[#64748B]">{row[2]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Reasoning */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">DETAILED REASONING</h2>
        <div className="bg-[rgba(99,102,241,0.05)] p-3 rounded-lg text-xs text-[#D1D5DB] border border-[rgba(99,102,241,0.1)]">
          <p>{item.reason || 'No reasoning provided'}</p>
        </div>
      </div>

      {/* Category Explanation */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">CATEGORY EXPLANATION</h2>
        <div className="space-y-1 text-xs border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden">
          {[
            ['HATE SPEECH', categoryDescriptions.HATE_SPEECH, categoryColors.HATE_SPEECH],
            ['SECTARIAN', categoryDescriptions.SECTARIAN, categoryColors.SECTARIAN],
            ['RACIAL ABUSE', categoryDescriptions.RACIAL_ABUSE, categoryColors.RACIAL_ABUSE],
            ['RELIGIOUS THREAT', categoryDescriptions.RELIGIOUS_THREAT, categoryColors.RELIGIOUS_THREAT],
            ['NEUTRAL', categoryDescriptions.NEUTRAL, categoryColors.NEUTRAL],
          ].map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-2 p-2 ${
                row[0] === categoryName
                  ? 'text-white'
                  : 'bg-[rgba(99,102,241,0.05)] text-[#D1D5DB]'
              }`}
              style={{
                backgroundColor:
                  row[0] === categoryName ? row[2] + '60' : 'rgba(99,102,241,0.05)',
              }}
            >
              <p className="font-semibold">{row[0]}</p>
              <p className="text-right">{row[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">METHODOLOGY</h2>
        <p className="text-xs text-[#D1D5DB] leading-relaxed bg-[rgba(99,102,241,0.05)] p-3 rounded-lg border border-[rgba(99,102,241,0.1)]">
          This analysis employs Google Gemini's multimodal AI model for content classification. The
          system analyzes textual and visual content against trained hate speech detection parameters.
          Confidence scores represent the model's certainty in its classification. Categories are
          defined according to Pakistan's PECA 2016 and international hate speech frameworks.
        </p>
      </div>

      {/* Conclusion */}
      <div>
        <h2 className="text-sm font-bold text-[#6366F1] mb-3">CONCLUSION</h2>
        <p className="text-xs text-[#D1D5DB] leading-relaxed bg-[rgba(99,102,241,0.05)] p-3 rounded-lg border border-[rgba(99,102,241,0.1)]">
          Based on the AI analysis conducted on the submitted {formatCategoryName(item.type)} Analysis,
          the system has determined: {categoryName}. The AI classifier produced a confidence score of{' '}
          {item.confidence}%. The content has been flagged as potentially harmful and requires immediate
          review. The overall analysis verdict is: {categoryName}.
        </p>
      </div>
    </div>
  )
}
