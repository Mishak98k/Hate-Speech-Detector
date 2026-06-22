import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  darkBlue: [30, 58, 138], // #1E3A8A (matches generateSingleItemPDF)
  midBlue: [59, 130, 246], // #3B82F6 (matches generateSingleItemPDF)
  lightBlueRow: [240, 249, 255], // #F0F9FF (matches generateSingleItemPDF)
  greenVerdict: [22, 101, 52], // #166534
  redVerdict: [127, 29, 29], // #7F1D1D
  white: [255, 255, 255],
  black: [0, 0, 0],
  darkGray: [30, 41, 59],
  mediumGray: [100, 116, 139],
}

const CATEGORY_DESCRIPTIONS = {
  HATE_SPEECH: 'Content promoting hatred against individuals or groups',
  SECTARIAN: 'Content inciting sectarian violence or discrimination',
  RACIAL_ABUSE: 'Content containing racial slurs or racial discrimination',
  RELIGIOUS_THREAT: 'Content containing religious threats or extremist messaging',
  NEUTRAL: 'No hate speech detected. Content appears to be safe.',
}

const getRiskLevel = (label) => {
  switch (label) {
    case 'HATE_SPEECH':
      return 'HIGH'
    case 'SECTARIAN':
      return 'HIGH'
    case 'RACIAL_ABUSE':
      return 'HIGH'
    case 'RELIGIOUS_THREAT':
      return 'HIGH'
    case 'NEUTRAL':
      return 'NONE'
    default:
      return 'MEDIUM'
  }
}

const getVerdictColors = (label) => {
  if (label === 'NEUTRAL') {
    return {
      bg: COLORS.greenVerdict,
      text: COLORS.white,
    }
  } else {
    return {
      bg: COLORS.redVerdict,
      text: COLORS.white,
    }
  }
}

const addPageNumber = (doc, pageNum, totalPages) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Footer bar background
  doc.setFillColor(...COLORS.darkBlue)
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')

  // Footer text
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.white)
  doc.text('HateGuard AI Analysis System | Automated Content Detection', 10, pageHeight - 7)

  // Right side - CONFIDENTIAL
  doc.setTextColor(...COLORS.white)
  doc.text('CONFIDENTIAL', pageWidth - 10, pageHeight - 7, { align: 'right' })

  // Page number center
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.mediumGray)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 7, { align: 'center' })
}

const addHeaderBar = (doc, pageWidth) => {
  // Header bar
  doc.setFillColor(...COLORS.darkBlue)
  doc.rect(0, 0, pageWidth, 18, 'F')

  // Left text
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text('HATEGUARD AI ANALYSIS SYSTEM', 10, 11)

  // Right text
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text('ANALYSIS REPORT — CONFIDENTIAL', pageWidth - 10, 11, { align: 'right' })
}

export const generateSingleAnalysisReport = (analysisData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let currentY = 0
  let pageNum = 1
  const totalPages = 2

  // ============ PAGE 1: COVER PAGE ============
  addHeaderBar(doc, pageWidth)
  currentY = 40

  // Title section
  doc.setFontSize(28)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('HATEGUARD AI', pageWidth / 2, currentY, { align: 'center' })
  currentY += 12

  doc.setFontSize(14)
  doc.setTextColor(...COLORS.midBlue)
  doc.setFont('helvetica', 'normal')
  doc.text('Automated Hate Speech Detection System', pageWidth / 2, currentY, { align: 'center' })
  currentY += 7

  doc.setFontSize(12)
  doc.setTextColor(...COLORS.midBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('AI-Powered Content Analysis Report', pageWidth / 2, currentY, { align: 'center' })
  currentY += 18

  // Case Information Table
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'bold')
  doc.text('CASE INFORMATION', 10, currentY)
  currentY += 8

  const timestamp = analysisData.timestamp ? new Date(analysisData.timestamp).getTime() : Date.now()
  const rptNumber = `RPT-${timestamp}`
  const contentId = `EXH-${timestamp}`

  const caseInfoData = [
    ['Report Number:', rptNumber],
    ['Date of Analysis:', new Date(timestamp).toLocaleDateString()],
    ['Time of Analysis:', new Date(timestamp).toLocaleTimeString()],
    ['Analysis Type:', analysisData.type],
    ['Content ID:', contentId],
    ['Analyst:', 'HateGuard AI v1.0 (Gemini-powered)'],
    ['System:', 'HateGuard AI Analysis System'],
    ['Version:', 'v1.0'],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: caseInfoData,
    theme: 'plain',
    columnStyles: {
      0: {
        cellWidth: 40,
        fontStyle: 'bold',
        textColor: COLORS.darkBlue,
        fontSize: 9,
      },
      1: {
        cellWidth: 100,
        textColor: COLORS.darkGray,
        fontSize: 9,
      },
    },
    bodyStyles: {
      lineColor: COLORS.lightBlueRow,
      lineWidth: 0.3,
      minCellHeight: 6,
    },
    margin: { left: 15, right: 15 },
  })

  currentY = doc.lastAutoTable.finalY + 15

  // Verdict Box
  const verdictColors = getVerdictColors(analysisData.label)
  doc.setFillColor(...verdictColors.bg)
  doc.rect(15, currentY, pageWidth - 30, 25, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...verdictColors.text)
  doc.text(`ANALYSIS VERDICT: ${analysisData.label.replace(/_/g, ' ')}`, pageWidth / 2, currentY + 10, {
    align: 'center',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...verdictColors.text)
  doc.text(`Confidence: ${analysisData.confidence}%`, pageWidth / 2, currentY + 19, {
    align: 'center',
  })

  currentY += 35

  // Disclaimer
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.mediumGray)
  doc.setFont('helvetica', 'normal')
  const disclaimerText =
    'This report has been generated by HateGuard AI using Google Gemini\'s multimodal AI model. The findings are based on AI-assisted content analysis and should be reviewed by a qualified analyst before being used in any official or legal proceedings.'
  doc.text(disclaimerText, 10, currentY, { maxWidth: pageWidth - 20, align: 'left' })

  addPageNumber(doc, pageNum, totalPages)

  // ============ PAGE 2: ANALYSIS RESULTS ============
  doc.addPage()
  pageNum = 2
  currentY = 0

  addHeaderBar(doc, pageWidth)
  currentY = 25

  // Section 1: ANALYSIS SUMMARY
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTION 1: ANALYSIS SUMMARY', 15, currentY)
  currentY += 10

  const summaryData = [
    ['Signal', 'Result', 'Confidence'],
    ['AI Classification', analysisData.label.replace(/_/g, ' '), `${analysisData.confidence}%`],
    ['Category Type', CATEGORY_DESCRIPTIONS[analysisData.label] || 'Unknown', '—'],
    ['Content Type', analysisData.type, '—'],
    ['Risk Level', getRiskLevel(analysisData.label), '—'],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.darkBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: COLORS.darkGray,
      fontSize: 9,
      minCellHeight: 7,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlueRow,
    },
    margin: { left: 15, right: 15 },
  })

  currentY = doc.lastAutoTable.finalY + 12

  // Section 2: DETAILED REASONING
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTION 2: DETAILED REASONING', 15, currentY)
  currentY += 7

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'normal')
  doc.text('AI Model Reasoning:', 15, currentY)
  currentY += 5

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.darkGray)
  const reasoningText = analysisData.reason || 'Analysis reasoning not provided.'
  doc.text(reasoningText, 15, currentY, { maxWidth: pageWidth - 30, align: 'left' })
  currentY += doc.getTextDimensions(reasoningText, { maxWidth: pageWidth - 30 }).h + 10

  // Section 3: CATEGORY EXPLANATION
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTION 3: CATEGORY EXPLANATION', 15, currentY)
  currentY += 7

  const categoryData = [
    ['Category', 'Definition'],
    ['HATE SPEECH', CATEGORY_DESCRIPTIONS.HATE_SPEECH],
    ['SECTARIAN', CATEGORY_DESCRIPTIONS.SECTARIAN],
    ['RACIAL ABUSE', CATEGORY_DESCRIPTIONS.RACIAL_ABUSE],
    ['RELIGIOUS THREAT', CATEGORY_DESCRIPTIONS.RELIGIOUS_THREAT],
    ['NEUTRAL', CATEGORY_DESCRIPTIONS.NEUTRAL],
  ]

  autoTable(doc, {
    startY: currentY,
    head: [categoryData[0]],
    body: categoryData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.darkBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: COLORS.darkGray,
      fontSize: 8,
      minCellHeight: 8,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlueRow,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 100 },
    },
    margin: { left: 15, right: 15 },
  })

  currentY = doc.lastAutoTable.finalY + 12

  // Check if we need a new page for remaining sections
  if (currentY > pageHeight - 90) {
    doc.addPage()
    pageNum = 3
    addHeaderBar(doc, pageWidth)
    currentY = 25
  }

  // Section 4: METHODOLOGY
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTION 4: METHODOLOGY', 15, currentY)
  currentY += 7

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'normal')
  const methodologyText =
    'This analysis employs Google Gemini\'s multimodal AI model for content classification. The system analyzes textual and visual content against trained hate speech detection parameters. Confidence scores represent the model\'s certainty in its classification. Categories are defined according to Pakistan\'s PECA 2016 and international hate speech frameworks.'
  doc.text(methodologyText, 15, currentY, { maxWidth: pageWidth - 30, align: 'left' })
  currentY += doc.getTextDimensions(methodologyText, { maxWidth: pageWidth - 30 }).h + 10

  // Section 5: CONCLUSION
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.darkBlue)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTION 5: CONCLUSION', 15, currentY)
  currentY += 7

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'normal')

  const conclusionHateAddition =
    analysisData.label !== 'NEUTRAL'
      ? ' The content has been flagged as potentially harmful and requires immediate review.'
      : ' No harmful content was detected in this analysis.'

  const conclusionText = `Based on the AI analysis conducted on the submitted ${analysisData.type || 'content'}, the system has determined: ${analysisData.label.replace(/_/g, ' ')}. The AI classifier produced a confidence score of ${analysisData.confidence}%.${conclusionHateAddition} The overall analysis verdict is: ${analysisData.label.replace(/_/g, ' ')}.`

  doc.text(conclusionText, 15, currentY, { maxWidth: pageWidth - 30, align: 'left' })
  currentY += doc.getTextDimensions(conclusionText, { maxWidth: pageWidth - 30 }).h + 15

  // Signature Block
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.darkGray)
  doc.setFont('helvetica', 'bold')

  // Left side - Prepared by
  doc.text('Prepared by', 20, currentY)
  doc.setDrawColor(...COLORS.mediumGray)
  doc.setLineWidth(0.5)
  doc.line(20, currentY + 10, 60, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('HateGuard AI v1.0', 25, currentY + 14)

  // Middle - Verified by
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Verified by', 85, currentY)
  doc.setDrawColor(...COLORS.mediumGray)
  doc.line(85, currentY + 10, 125, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Human Reviewer', 90, currentY + 14)

  // Right side - Date
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Date', 150, currentY)
  doc.setDrawColor(...COLORS.mediumGray)
  doc.line(150, currentY + 10, 190, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(new Date().toLocaleDateString(), 155, currentY + 14)

  // Add page numbers to all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addPageNumber(doc, i, pageCount)
  }

  // Save PDF
  const fileName = `HateGuard_Analysis_Report_${timestamp}.pdf`
  doc.save(fileName)
}
