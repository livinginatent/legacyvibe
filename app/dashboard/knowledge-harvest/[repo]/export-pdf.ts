/**
 * PDF Export Utility for Knowledge Harvest
 * Generates comprehensive PDF reports with architecture, tech stack, and detailed feature clusters
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
  keyFiles?: string[];
  dependencies?: string[];
}

interface Architecture {
  pattern: string;
  description: string;
}

interface AnalysisData {
  techStack?: TechStack;
  featureClusters?: FeatureCluster[];
  architecture?: Architecture;
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
  doc.text("Knowledge Harvest Report", margin, yPosition);
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
  // ARCHITECTURE SECTION
  // ============================================================================

  if (analysis.architecture) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Architecture Pattern", margin, yPosition);
    yPosition += 10;

    // Pattern name
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 215, 0); // Gold
    doc.text(analysis.architecture.pattern, margin + 5, yPosition);
    yPosition += 8;

    // Description
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const wrappedArch = wrapText(
      analysis.architecture.description,
      contentWidth - 10
    );
    wrappedArch.forEach((line) => {
      checkPageBreak(7);
      doc.text(line, margin + 10, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Divider
    checkPageBreak(20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
  }

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
    doc.text(
      `Feature Clusters (${analysis.featureClusters.length})`,
      margin,
      yPosition
    );
    yPosition += 12;

    analysis.featureClusters.forEach((feature, index) => {
      // Check if we need a new page for this feature
      checkPageBreak(50);

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
      yPosition += 3;

      // Key Files
      if (feature.keyFiles && feature.keyFiles.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 150, 255);
        doc.text("Key Files:", margin + 10, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        feature.keyFiles.forEach((file) => {
          checkPageBreak(5);
          doc.text(`  • ${file}`, margin + 15, yPosition);
          yPosition += 4;
        });
        yPosition += 2;
      }

      // Dependencies
      if (feature.dependencies && feature.dependencies.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 165, 0);
        doc.text("Dependencies:", margin + 10, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const depsText = feature.dependencies.join(", ");
        const wrappedDeps = wrapText(depsText, contentWidth - 20);
        wrappedDeps.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin + 15, yPosition);
          yPosition += 4;
        });
        yPosition += 2;
      }

      // All Related Files (show first 20)
      if (feature.files && feature.files.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Related Files (${feature.files.length} total):`,
          margin + 10,
          yPosition
        );
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        
        // Show first 20 files to keep PDF reasonable
        const filesToShow = feature.files.slice(0, 20);
        filesToShow.forEach((file) => {
          checkPageBreak(4);
          doc.text(`  • ${file}`, margin + 15, yPosition);
          yPosition += 3.5;
        });
        
        if (feature.files.length > 20) {
          checkPageBreak(4);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `  ... and ${feature.files.length - 20} more files`,
            margin + 15,
            yPosition
          );
          yPosition += 3.5;
        }
        
        yPosition += 2;
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
      "Generated by LegacyVibe • Knowledge Harvest System",
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

  const fileName = `${repoFullName.replace("/", "-")}-harvest.pdf`;
  doc.save(fileName);
}
