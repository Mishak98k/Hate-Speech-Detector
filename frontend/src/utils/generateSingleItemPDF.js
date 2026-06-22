import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const categoryColors = {
  HATE_SPEECH: { r: 139, g: 28, b: 28, hex: '#8B1C1C' },
  SECTARIAN: { r: 91, g: 33, b: 182, hex: '#5B21B6' },
  RACIAL_ABUSE: { r: 139, g: 28, b: 28, hex: '#8B1C1C' },
  RELIGIOUS_THREAT: { r: 127, g: 29, b: 29, hex: '#7F1D1D' },
  NEUTRAL: { r: 6, g: 95, b: 70, hex: '#065F46' },
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
    date: pakistanTime.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }),
    time: pakistanTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

export function generateSingleItemPDF(item) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  const color = categoryColors[item.category]
  const categoryName = formatCategoryName(item.category)
  const { date, time } = formatDateTime(item.timestamp)

  // Helper: Add header with blue background
  const addHeader = () => {
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 10, 'F')

    doc.setFontSize(8)
    doc.setTextColor(200, 200, 200)
    doc.text('HATEGUARD AI ANALYSIS SYSTEM', margin, 5)
    doc.text('ANALYSIS REPORT — CONFIDENTIAL', pageWidth - margin, 5, { align: 'right' })
  }

  // Helper: Add footer with dark blue background
  const addFooter = (pageNum, totalPages) => {
    const footerY = pageHeight - 7
    
    // Dark blue background footer (reduced height)
    doc.setFillColor(30, 58, 138)
    doc.rect(0, footerY, pageWidth, pageHeight - footerY, 'F')

    doc.setFontSize(7)
    doc.setTextColor(200, 200, 200)
    // Center all footer text vertically
    doc.text('HateGuard AI Analysis System | Automated Content Detection', margin, footerY + 3.5)
    doc.text(`Page ${pageNum} of ${totalPages} | CONFIDENTIAL`, pageWidth - margin, footerY + 3.5, { align: 'right' })
  }

  // PAGE 1 - HEADER & TITLE
  addHeader()

  let currentY = 18

  // Title with top padding
  currentY += 5  // Add padding above title
  doc.setFontSize(32)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('HATEGUARD AI', pageWidth / 2, currentY, { align: 'center' })
  currentY += 11

  // Subtitles
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.setFont(undefined, 'normal')
  doc.text('Automated Hate Speech Detection System', pageWidth / 2, currentY, { align: 'center' })
  currentY += 4
  doc.text('AI-Powered Content Analysis Report', pageWidth / 2, currentY, { align: 'center' })
  currentY += 8

  // Divider line - thick blue
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(2)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 8

  // CASE INFORMATION SECTION
  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('CASE INFORMATION', margin, currentY)
  currentY += 7

  // Case info table
  // Analysis type with platform name for social posts - capitalize platform name
  const platformName = item.platform 
    ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
    : 'Social Media'
  let analysisType = item.type === 'social' 
    ? `${platformName} Analysis`
    : `${formatCategoryName(item.type)} Analysis`

  const caseData = [
    ['Report Number:', `RPT-${item.id}`],
    ['Date of Analysis:', date],
    ['Time of Analysis:', time],
    ['Analysis Type:', analysisType],
    ...(item.type === 'social' ? [['Platform:', platformName]] : []),
    ['Content ID:', `EXH-${item.id}`],
    ['Analyst:', 'HateGuard AI v1.0 (Gemini-powered)'],
    ['System:', 'HateGuard AI Analysis System'],
    ['Version:', 'v1.0'],
  ]

  autoTable(doc, {
    startY: currentY,
    body: caseData,
    theme: 'plain',
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 9,
      cellPadding: 4,
      lineColor: [219, 234, 254],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [59, 130, 246], fillColor: [240, 249, 255] },
      1: { cellWidth: contentWidth - 50, fillColor: [255, 255, 255] },
    },
    margin: { left: margin, right: margin },
  })

  currentY = doc.lastAutoTable.finalY + 12

  // VERDICT BANNER - with confidence inside
  doc.setFillColor(color.r, color.g, color.b)
  doc.rect(margin, currentY, contentWidth, 22, 'F')

  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.text(`ANALYSIS VERDICT: ${categoryName}`, pageWidth / 2, currentY + 7, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'normal')
  doc.text(`Confidence: ${item.confidence}%`, pageWidth / 2, currentY + 16, { align: 'center' })

  currentY += 28

  // Disclaimer
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont(undefined, 'italic')
  const disclaimer = 'This report has been generated by HateGuard AI using Google Gemini\'s multimodal AI model. The findings are based on AI-assisted content analysis and should be reviewed by a qualified analyst before being used in any official or legal proceedings.'
  const disclaimerSplit = doc.splitTextToSize(disclaimer, contentWidth)
  doc.text(disclaimerSplit, margin, currentY)
  currentY += disclaimerSplit.length * 3.5 + 12

  // SECTION 1: ANALYSIS SUMMARY
  if (currentY > pageHeight - 60) {
    doc.addPage()
    addHeader()
    currentY = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('SECTION 1: ANALYSIS SUMMARY', margin, currentY)
  currentY += 8

  const riskLevel = item.category === 'NEUTRAL' ? 'LOW' : 'HIGH'
  const summaryData = [
    ['Signal', 'Result', 'Confidence'],
    ['AI Classification', categoryName, `${item.confidence}%`],
    ['Category Type', categoryDescriptions[item.category], '—'],
    ['Content Type', analysisType, '—'],
    ['Risk Level', riskLevel, '—'],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: contentWidth - 70 },
      2: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  currentY = doc.lastAutoTable.finalY + 12

  // SECTION 2: DETAILED REASONING
  if (currentY > pageHeight - 60) {
    doc.addPage()
    addHeader()
    currentY = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('SECTION 2: DETAILED REASONING', margin, currentY)
  currentY += 8

  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.setFont(undefined, 'bold')
  doc.text('AI Model Reasoning:', margin, currentY)
  currentY += 5

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  const reasoningSplit = doc.splitTextToSize(item.reason || 'No reasoning provided', contentWidth)
  doc.text(reasoningSplit, margin, currentY)
  currentY += reasoningSplit.length * 3.5 + 12

  // SECTION 3: CATEGORY EXPLANATION
  if (currentY > pageHeight - 80) {
    doc.addPage()
    addHeader()
    currentY = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('SECTION 3: CATEGORY EXPLANATION', margin, currentY)
  currentY += 8

  const categoryData = [
    ['Category', 'Definition'],
    ['HATE SPEECH', categoryDescriptions.HATE_SPEECH],
    ['SECTARIAN', categoryDescriptions.SECTARIAN],
    ['RACIAL ABUSE', categoryDescriptions.RACIAL_ABUSE],
    ['RELIGIOUS THREAT', categoryDescriptions.RELIGIOUS_THREAT],
    ['NEUTRAL', categoryDescriptions.NEUTRAL],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [categoryData[0]],
    body: categoryData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 9,
      cellPadding: 3,
    },
    didDrawCell: (data) => {
      if (data.row.index > 0) {
        const categoryKey = categoryData[data.row.index + 1]?.[0]?.replace(/ /g, '_')
        if (categoryKey === item.category) {
          data.cell.styles.fillColor = [color.r, color.g, color.b]
          data.cell.styles.textColor = [255, 255, 255]
        }
      }
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: contentWidth - 48 },
    },
    margin: { left: margin, right: margin },
  })

  currentY = doc.lastAutoTable.finalY + 12

  // SECTION 4: METHODOLOGY
  if (currentY > pageHeight - 60) {
    doc.addPage()
    addHeader()
    currentY = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('SECTION 4: METHODOLOGY', margin, currentY)
  currentY += 8

  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.setFont(undefined, 'normal')
  const methodText = 'This analysis employs Google Gemini\'s multimodal AI model for content classification. The system analyzes textual and visual content against trained hate speech detection parameters. Confidence scores represent the model\'s certainty in its classification. Categories are defined according to Pakistan\'s PECA 2016 and international hate speech frameworks.'
  const methodSplit = doc.splitTextToSize(methodText, contentWidth)
  doc.text(methodSplit, margin, currentY)
  currentY += methodSplit.length * 3.5 + 12

  // SECTION 5: CONCLUSION
  if (currentY > pageHeight - 60) {
    doc.addPage()
    addHeader()
    currentY = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.setFont(undefined, 'bold')
  doc.text('SECTION 5: CONCLUSION', margin, currentY)
  currentY += 8

  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.setFont(undefined, 'normal')
  const conclusionText = `Based on the AI analysis conducted on the submitted ${analysisType}, the system has determined: ${categoryName}. The AI classifier produced a confidence score of ${item.confidence}%. The content has been flagged as potentially harmful and requires immediate review. The overall analysis verdict is: ${categoryName}.`
  const conclusionSplit = doc.splitTextToSize(conclusionText, contentWidth)
  doc.text(conclusionSplit, margin, currentY)

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  // Download PDF with proper name
  doc.save(`HateGuard_Analysis_Report_${item.id}.pdf`)
}
