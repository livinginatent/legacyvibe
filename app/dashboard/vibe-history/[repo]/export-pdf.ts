/**
 * PDF Export Utility for Vibe History
 * Generates comprehensive PDF reports with conversation-to-code links
 */

import { jsPDF } from "jspdf";

interface CodeChange {
  file: string;
  changes: string;
  timestamp?: string;
  commit?: string;
}

interface VibeLink {
  id: string;
  chatExcerpt: string;
  codeChanges: CodeChange[];
  reasoning: string;
  confidence: number;
  timestamp: string;
}

interface HistoryData {
  vibeLinks: VibeLink[];
  totalMessages: number;
  totalChanges: number;
  analyzedAt: string;
}

export function exportHistoryToPDF(
  repoFullName: string,
  history: HistoryData
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number): string[] => {
    const lines = doc.splitTextToSize(text, maxWidth);
    return lines;
  };

  // Helper function to format timestamp
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // ============================================================================
  // HEADER
  // ============================================================================
  
  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 212, 255); // Cyan
  doc.text("Vibe History Report", margin, yPosition);
  yPosition += 12;

  // Repository name
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.text(repoFullName, margin, yPosition);
  yPosition += 8;

  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const date = formatTimestamp(history.analyzedAt);
  doc.text(`Generated: ${date}`, margin, yPosition);
  yPosition += 15;

  // Divider line
  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ============================================================================
  // SUMMARY STATISTICS
  // ============================================================================

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Analysis Summary", margin, yPosition);
  yPosition += 10;

  // Stats
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  
  doc.text(`• Vibe Links Found: ${history.vibeLinks.length}`, margin + 5, yPosition);
  yPosition += 7;
  
  doc.text(`• Total Messages Analyzed: ${history.totalMessages}`, margin + 5, yPosition);
  yPosition += 7;
  
  doc.text(`• Total Code Changes: ${history.totalChanges}`, margin + 5, yPosition);
  yPosition += 15;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ============================================================================
  // VIBE LINKS SECTION
  // ============================================================================

  if (history.vibeLinks && history.vibeLinks.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Conversation-to-Code Timeline`,
      margin,
      yPosition
    );
    yPosition += 12;

    history.vibeLinks.forEach((link, index) => {
      // Check if we need a new page for this link
      checkPageBreak(60);

      // Link header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 212, 255);
      doc.text(`Link ${index + 1}`, margin + 5, yPosition);
      yPosition += 8;

      // Timestamp and confidence
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Time: ${formatTimestamp(link.timestamp)} | Confidence: ${link.confidence}%`,
        margin + 10,
        yPosition
      );
      yPosition += 8;

      // Chat excerpt
      checkPageBreak(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Conversation Excerpt:", margin + 10, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "italic");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      const wrappedChat = wrapText(`"${link.chatExcerpt}"`, contentWidth - 20);
      wrappedChat.forEach((line) => {
        checkPageBreak(6);
        doc.text(line, margin + 15, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      // Reasoning
      checkPageBreak(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("AI-Detected Reasoning:", margin + 10, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      const wrappedReasoning = wrapText(link.reasoning, contentWidth - 20);
      wrappedReasoning.forEach((line) => {
        checkPageBreak(6);
        doc.text(line, margin + 15, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      // Code changes
      if (link.codeChanges && link.codeChanges.length > 0) {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Related Code Changes (${link.codeChanges.length}):`,
          margin + 10,
          yPosition
        );
        yPosition += 7;

        link.codeChanges.forEach((change, changeIndex) => {
          checkPageBreak(20);
          
          // File name
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 165, 0); // Orange
          doc.text(`${changeIndex + 1}. ${change.file}`, margin + 15, yPosition);
          yPosition += 5;

          // Change description
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.setFontSize(8);
          const wrappedChanges = wrapText(change.changes, contentWidth - 30);
          wrappedChanges.forEach((line) => {
            checkPageBreak(5);
            doc.text(line, margin + 20, yPosition);
            yPosition += 4;
          });

          // Commit info
          if (change.commit) {
            doc.setTextColor(120, 120, 120);
            doc.text(`Commit: ${change.commit}`, margin + 20, yPosition);
            yPosition += 4;
          }

          // Change timestamp
          if (change.timestamp) {
            doc.setTextColor(120, 120, 120);
            doc.text(`Changed: ${formatTimestamp(change.timestamp)}`, margin + 20, yPosition);
            yPosition += 4;
          }

          yPosition += 3;
        });
      }

      yPosition += 10;

      // Divider between links
      if (index < history.vibeLinks.length - 1) {
        checkPageBreak(5);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 10;
      }
    });
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("No vibe links found.", margin + 5, yPosition);
    yPosition += 10;
  }

  // ============================================================================
  // FOOTER
  // ============================================================================

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    
    // Footer text
    doc.text(
      "Generated by LegacyVibe • Vibe History Linking System",
      margin,
      pageHeight - 10
    );
    
    // Page number
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
  }

  // ============================================================================
  // SAVE PDF
  // ============================================================================

  const fileName = `${repoFullName.replace("/", "-")}-vibe-history.pdf`;
  doc.save(fileName);
}
