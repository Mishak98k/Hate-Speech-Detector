import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TextAnalysis from './pages/TextAnalysis'
import ImageAnalysis from './pages/ImageAnalysis'
import SocialMonitor from './pages/SocialMonitor'
import { DatasetMonitor } from './pages/DatasetMonitor'
import EvidenceLog from './pages/EvidenceLog'
import PDFReport from './pages/PDFReport'
import Performance from './pages/Performance'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/text" element={<TextAnalysis />} />
          <Route path="/image" element={<ImageAnalysis />} />
          <Route path="/social" element={<SocialMonitor />} />
          <Route path="/datasets" element={<DatasetMonitor />} />
          <Route path="/evidence" element={<EvidenceLog />} />
          <Route path="/report" element={<PDFReport />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
