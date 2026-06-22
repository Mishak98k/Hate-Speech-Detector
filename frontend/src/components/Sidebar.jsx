import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  Image,
  Radio,
  Database,
  FileStack,
  FileDown,
  BarChart3,
} from 'lucide-react'
import evidenceStorage from '../utils/evidenceStorage'
import performanceTracker from '../utils/performanceTracker'

export function Sidebar() {
  const location = useLocation()
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)
  const [stats, setStats] = useState({ hate: 0, neutral: 0 })

  useEffect(() => {
    // Update stats from evidence log
    const evidence = evidenceStorage.getEvidence()
    setTotalAnalyzed(evidence.length)

    // Count hate vs neutral
    const hateCount = evidence.filter(
      (item) => item.category && item.category !== 'NEUTRAL'
    ).length
    const neutralCount = evidence.filter(
      (item) => item.category === 'NEUTRAL'
    ).length

    setStats({
      hate: hateCount,
      neutral: neutralCount,
    })
  }, [location.pathname])

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'text', label: 'Text Analysis', icon: FileText, path: '/text' },
    { id: 'image', label: 'Image Analysis', icon: Image, path: '/image' },
    { id: 'social', label: 'Social Monitor', icon: Radio, path: '/social' },
    { id: 'datasets', label: 'Hate Datasets', icon: Database, path: '/datasets' },
    { id: 'evidence', label: 'Evidence Log', icon: FileStack, path: '/evidence' },
    { id: 'report', label: 'PDF Report', icon: FileDown, path: '/report' },
    { id: 'performance', label: 'Performance', icon: BarChart3, path: '/performance' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div
      className="fixed left-0 top-0 h-screen w-[260px] bg-[#0D0D14] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-40 sidebar"
      style={{
        boxShadow: 'inset -1px 0 0 rgba(99,102,241,0.1)',
      }}
    >
      {/* Top Section - Logo & Brand */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="text-3xl"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.6))',
              animation: 'glow 2s ease-in-out infinite',
            }}
          >
            🛡️
          </div>
          <h1 className="text-lg font-bold text-[#F1F5F9]">HateGuard AI</h1>
        </div>
        <div className="inline-block px-3 py-1 bg-[rgba(99,102,241,0.15)] border border-[#6366F1] rounded-full">
          <p className="text-xs font-medium text-[#6366F1]">
            Powered by Gemini ✨
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-300 relative group ${
                active
                  ? 'bg-[rgba(99,102,241,0.15)] text-[#6366F1]'
                  : 'text-[#64748B] hover:bg-[rgba(99,102,241,0.1)] text-[#64748B]'
              }`}
              style={{
                borderLeft: active ? '3px solid #6366F1' : 'none',
                paddingLeft: active ? '17px' : '20px',
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={
                  active
                    ? {
                        filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))',
                      }
                    : {}
                }
              />
              <span className="text-sm font-medium">{item.label}</span>
              {active && (
                <div
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#6366F1]"
                  style={{
                    boxShadow: '0 0 8px rgba(99,102,241,0.8)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section - Stats */}
      <div className="p-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="mb-4 p-3 bg-[rgba(99,102,241,0.1)] rounded-lg">
          <p className="text-xs text-[#64748B] font-medium mb-2">
            Total Analyzed
          </p>
          <p className="text-2xl font-bold text-[#F1F5F9]">{totalAnalyzed}</p>
        </div>

        {/* Ratio Dots */}
        <div className="mb-4 flex items-center gap-2">
          <p className="text-xs text-[#64748B] font-medium flex-1">Ratio:</p>
          <div className="flex gap-1">
            {stats.hate > 0 && (
              <div
                className="w-2 h-2 rounded-full bg-[#EF4444]"
                title={`Hate: ${stats.hate}`}
                style={{
                  boxShadow: '0 0 6px rgba(239,68,68,0.6)',
                }}
              />
            )}
            {stats.neutral > 0 && (
              <div
                className="w-2 h-2 rounded-full bg-[#10B981]"
                title={`Neutral: ${stats.neutral}`}
                style={{
                  boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                }}
              />
            )}
            {totalAnalyzed === 0 && (
              <p className="text-xs text-[#64748B]">No data yet</p>
            )}
          </div>
        </div>

        <div className="text-xs text-[#64748B] font-medium">
          Version: <span className="text-[#6366F1]">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
