/**
 * PDF Export Utility for Repository Analysis
 * Generates a formatted PDF report with tech stack and feature clusters
 */

import { jsPDF } from "jspdf";

interface TechStack {
  languages: string[];
  frameworks: string[];
  libraries: string[];
}

interface FeatureCluster {
  name: string;
  description: string;
  files?: string[];
}

interface AnalysisData {
  techStack?: TechStack;
  featureClusters?: FeatureCluster[];
  analyzedAt?: string;
  cached?: boolean;
}

export function exportAnalysisToPDF(
  repoFullName: string,
  analysis: AnalysisData
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

  // ============================================================================
  // HEADER
  // ============================================================================
  
  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 212, 255); // Cyan
  doc.text("LegacyVibe Analysis", margin, yPosition);
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
  const date = analysis.analyzedAt
    ? new Date(analysis.analyzedAt).toLocaleString()
    : new Date().toLocaleString();
  doc.text(`Generated: ${date}`, margin, yPosition);
  yPosition += 15;

  // Divider line
  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ============================================================================
  // TECH STACK SECTION
  // ============================================================================

  if (analysis.techStack) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Tech Stack", margin, yPosition);
    yPosition += 10;

    // Languages
    if (
      analysis.techStack.languages &&
      analysis.techStack.languages.length > 0
    ) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(70, 130, 180); // Steel blue
      doc.text("Languages", margin + 5, yPosition);
      yPosition += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      analysis.techStack.languages.forEach((lang) => {
        checkPageBreak(7);
        doc.text(`• ${lang}`, margin + 10, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Frameworks
    if (
      analysis.techStack.frameworks &&
      analysis.techStack.frameworks.length > 0
    ) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 212, 255); // Cyan
      doc.text("Frameworks", margin + 5, yPosition);
      yPosition += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      analysis.techStack.frameworks.forEach((framework) => {
        checkPageBreak(7);
        doc.text(`• ${framework}`, margin + 10, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Libraries
    if (
      analysis.techStack.libraries &&
      analysis.techStack.libraries.length > 0
    ) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Libraries", margin + 5, yPosition);
      yPosition += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      
      // Display libraries in a more compact format
      const libsText = analysis.techStack.libraries.join(", ");
      const wrappedLibs = wrapText(libsText, contentWidth - 10);
      wrappedLibs.forEach((line) => {
        checkPageBreak(7);
        doc.text(line, margin + 10, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }
  }

  // Divider
  checkPageBreak(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ============================================================================
  // FEATURE CLUSTERS SECTION
  // ============================================================================

  if (analysis.featureClusters && analysis.featureClusters.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Feature Clusters", margin, yPosition);
    yPosition += 12;

    analysis.featureClusters.forEach((feature, index) => {
      // Check if we need a new page for this feature
      checkPageBreak(40);

      // Feature name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 212, 255);
      doc.text(`${index + 1}. ${feature.name}`, margin + 5, yPosition);
      yPosition += 8;

      // Feature description
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const wrappedDesc = wrapText(feature.description, contentWidth - 10);
      wrappedDesc.forEach((line) => {
        checkPageBreak(7);
        doc.text(line, margin + 10, yPosition);
        yPosition += 6;
      });

      // File count
      if (feature.files && feature.files.length > 0) {
        yPosition += 3;
        checkPageBreak(7);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Includes ${feature.files.length} file${
            feature.files.length > 1 ? "s" : ""
          }`,
          margin + 10,
          yPosition
        );
        yPosition += 5;
      }

      yPosition += 8;
    });
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
      "Generated by LegacyVibe • AI-Powered Code Analysis",
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

  const fileName = `${repoFullName.replace("/", "-")}-analysis.pdf`;
  doc.save(fileName);
}
