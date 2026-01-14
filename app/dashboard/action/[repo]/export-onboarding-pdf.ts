/**
 * Onboarding Path PDF Export Utility
 * Generates a comprehensive PDF document for the personalized learning path
 */

import jsPDF from "jspdf";

export interface OnboardingStep {
  id: string;
  nodeId: string;
  nodeName: string;
  order: number;
  title: string;
  description: string;
  type: "explore" | "modify" | "test" | "read";
  estimatedTime: number;
  files?: string[];
  objectives?: string[];
  checkpoints?: string[];
  completed?: boolean;
}

export interface OnboardingPathData {
  overview: string;
  learningPath: OnboardingStep[];
  keyTakeaways: string[];
  estimatedTotalTime: number;
  totalSteps: number;
  repoFullName?: string;
  generatedAt?: string;
  userLevel?: string;
  focusArea?: string;
}

/**
 * Exports onboarding path to PDF
 */
export function exportOnboardingToPDF(
  repoFullName: string,
  data: OnboardingPathData
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    fontSize: number = 10,
    color: [number, number, number] = [0, 0, 0],
    isBold: boolean = false
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, maxWidth - (x - margin));
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      checkPageBreak();
      doc.text(line, x, yPos);
      yPos += lineHeight;
    }

    return yPos;
  };

  // Header
  doc.setFillColor(0, 200, 200); // Cyan
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("ONBOARDING PATH", margin, 20);

  yPos = 45;

  // Repository Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(repoFullName, margin, yPos);
  yPos += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const metadata = `Generated: ${new Date().toLocaleDateString()}${data.userLevel ? ` | Level: ${data.userLevel.toUpperCase()}` : ""}${data.focusArea ? ` | Focus: ${data.focusArea}` : ""}`;
  doc.text(metadata, margin, yPos);
  yPos += 5;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Overview Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 150, 200);
  doc.text("OVERVIEW", margin, yPos);
  yPos += 10;

  addText(data.overview, margin, 10);
  yPos += 5;

  // Stats Box
  checkPageBreak(30);
  doc.setFillColor(240, 248, 255); // Light blue
  doc.roundedRect(margin, yPos, maxWidth, 25, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);

  const statsY = yPos + 10;
  doc.text(`Total Steps: ${data.totalSteps}`, margin + 10, statsY);
  doc.text(
    `Est. Time: ${Math.floor(data.estimatedTotalTime / 60)}h ${data.estimatedTotalTime % 60}m`,
    margin + 80,
    statsY
  );

  const completedCount = data.learningPath.filter((s) => s.completed).length;
  doc.text(`Progress: ${completedCount}/${data.totalSteps}`, margin + 10, statsY + 10);

  yPos += 35;

  // Learning Path
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 150, 200);
  doc.text("LEARNING PATH", margin, yPos);
  yPos += 10;

  // Steps
  for (const step of data.learningPath) {
    checkPageBreak(60);

    // Step Header Box
    const stepColor = step.completed ? [34, 197, 94] : [100, 100, 255]; // Green if completed, blue otherwise
    doc.setFillColor(stepColor[0], stepColor[1], stepColor[2]);
    doc.roundedRect(margin, yPos, maxWidth, 10, 2, 2, "F");

    // Step Number and Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`Step ${step.order}: ${step.title}`, margin + 5, yPos + 7);

    // Completion indicator
    if (step.completed) {
      doc.setFontSize(11);
      doc.text("[DONE]", pageWidth - margin - 20, yPos + 7);
    }

    yPos += 15;

    // Type Badge
    const typeColors: Record<string, [number, number, number]> = {
      explore: [59, 130, 246], // Blue
      modify: [234, 179, 8], // Yellow
      test: [34, 197, 94], // Green
      read: [168, 85, 247], // Purple
    };

    const typeColor = typeColors[step.type] || [100, 100, 100];
    doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
    doc.roundedRect(margin, yPos, 30, 6, 1, 1, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(step.type.toUpperCase(), margin + 2, yPos + 4);

    // Feature Badge
    doc.setFillColor(147, 51, 234); // Purple
    doc.roundedRect(margin + 35, yPos, 60, 6, 1, 1, "F");
    doc.text(`Feature: ${step.nodeName}`, margin + 37, yPos + 4);

    // Time Badge
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(pageWidth - margin - 35, yPos, 35, 6, 1, 1, "F");
    doc.setTextColor(0, 0, 0);
    doc.text(`${step.estimatedTime} min`, pageWidth - margin - 33, yPos + 4);

    yPos += 10;

    // Description
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    yPos = addText(step.description, margin + 2, 9, [60, 60, 60], false);
    yPos += 3;

    // Files
    if (step.files && step.files.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 150, 200);
      doc.text("KEY FILES:", margin + 2, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      for (const file of step.files.slice(0, 5)) {
        checkPageBreak();
        doc.text(`  - ${file}`, margin + 5, yPos);
        yPos += 4;
      }
      if (step.files.length > 5) {
        doc.text(`  ... and ${step.files.length - 5} more`, margin + 5, yPos);
        yPos += 4;
      }
      yPos += 2;
    }

    // Objectives
    if (step.objectives && step.objectives.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94); // Green
      doc.text("OBJECTIVES:", margin + 2, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      for (const objective of step.objectives) {
        checkPageBreak();
        const objLines = doc.splitTextToSize(`  > ${objective}`, maxWidth - 10);
        for (const line of objLines) {
          checkPageBreak();
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      }
      yPos += 2;
    }

    // Checkpoints
    if (step.checkpoints && step.checkpoints.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 179, 8); // Yellow
      doc.text("CHECKPOINTS:", margin + 2, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      for (const checkpoint of step.checkpoints) {
        checkPageBreak();
        const checkLines = doc.splitTextToSize(`  [ ] ${checkpoint}`, maxWidth - 10);
        for (const line of checkLines) {
          checkPageBreak();
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      }
      yPos += 2;
    }

    yPos += 8; // Space between steps
  }

  // Key Takeaways
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 150, 200);
  doc.text("KEY TAKEAWAYS", margin, yPos);
  yPos += 10;

  doc.setFillColor(255, 248, 220); // Light yellow
  doc.roundedRect(margin, yPos, maxWidth, 5 + data.keyTakeaways.length * 7, 3, 3, "F");
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  for (const takeaway of data.keyTakeaways) {
    checkPageBreak();
    const lines = doc.splitTextToSize(`  - ${takeaway}`, maxWidth - 10);
    for (const line of lines) {
      checkPageBreak();
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Footer on last page
  checkPageBreak(30);
  yPos = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Generated by LegacyVibe Onboarding Copilot",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 5;
  doc.text(
    "AI-powered personalized learning paths for developers",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  // Save PDF
  const [owner, repo] = repoFullName.split("/");
  const filename = `${repo}-onboarding${data.userLevel ? `-${data.userLevel}` : ""}.pdf`;
  doc.save(filename);
}
