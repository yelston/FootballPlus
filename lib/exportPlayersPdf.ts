import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportPlayerRow {
  name: string
  age: number
  category: 'Schools' | 'Academy' | 'No Team'
  team: string
}

export interface ExportSummary {
  teamCounts: { name: string; count: number }[]
  noTeamCount: number
  categoryCounts: { Schools: number; Academy: number }
}

export function exportPlayersPdf(rows: ExportPlayerRow[], summary: ExportSummary) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Players Export', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25)

  const teamSummaryRows: [string, string][] = [
    ...summary.teamCounts.map((t): [string, string] => [t.name, String(t.count)]),
    ...(summary.noTeamCount > 0 ? ([['No Team', String(summary.noTeamCount)]] as [string, string][]) : []),
  ]
  const categorySummaryRows: [string, string][] = [
    ['Schools', String(summary.categoryCounts.Schools)],
    ['Academy', String(summary.categoryCounts.Academy)],
  ]
  const summaryTableStyle = {
    theme: 'plain' as const,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fontStyle: 'bold' as const, textColor: 40 },
    columnStyles: { 1: { halign: 'right' as const, cellWidth: 16 } },
  }

  autoTable(doc, {
    startY: 32,
    head: [['Team', 'Players']],
    body: teamSummaryRows,
    tableWidth: 90,
    margin: { left: 14 },
    ...summaryTableStyle,
  })
  const teamSummaryEndY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 32

  autoTable(doc, {
    startY: 32,
    head: [['Category', 'Players']],
    body: categorySummaryRows,
    tableWidth: 70,
    margin: { left: 115 },
    ...summaryTableStyle,
  })
  const categorySummaryEndY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 32

  autoTable(doc, {
    startY: Math.max(teamSummaryEndY, categorySummaryEndY) + 8,
    head: [['Name', 'Age', 'School/Academy', 'Team']],
    body: rows.map((r) => [r.name, String(r.age), r.category, r.team]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  })

  doc.save('players-export.pdf')
}
