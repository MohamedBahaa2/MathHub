import PDFDocument from "pdfkit";
import { prisma } from "../config/database";
import { AppError } from "../utils/app-error";

export async function generateReportPdf(reportId: string): Promise<Buffer> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { student: { select: { name: true, email: true, studentCode: true } } },
  });

  if (!report) throw new AppError(404, "Report not found", "NOT_FOUND");

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(22)
      .fillColor("#6c3fe4")
      .text("MathHub", { align: "center" })
      .moveDown(0.2)
      .fontSize(14)
      .fillColor("#333")
      .text("Weekly Student Report", { align: "center" })
      .moveDown(1);

    // Student Info
    doc
      .fontSize(12)
      .fillColor("#555")
      .text(`Student: ${report.student.name}`)
      .text(`Code: ${report.student.studentCode ?? "N/A"}`)
      .text(`Email: ${report.student.email}`)
      .text(`Period: ${report.weekStart.toDateString()} — ${report.weekEnd.toDateString()}`)
      .text(`Generated: ${report.generatedAt.toDateString()}`)
      .moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6c3fe4").lineWidth(1).stroke().moveDown(1);

    // Stats
    doc.fontSize(14).fillColor("#222").text("Performance Summary").moveDown(0.5);
    const stats = [
      ["Sessions Attended", report.sessionsAttended],
      ["Assignments Submitted", report.assignmentsSubmitted],
      ["Average Grade", report.avgGrade !== null ? `${report.avgGrade.toFixed(1)}%` : "N/A"],
      ["Quiz Average Score", report.quizAvgScore !== null ? `${report.quizAvgScore.toFixed(1)}%` : "N/A"],
    ];
    for (const [label, value] of stats) {
      doc
        .fontSize(11)
        .fillColor("#444")
        .text(`${label}:`, { continued: true, width: 220 })
        .fillColor("#6c3fe4")
        .text(` ${value}`)
        .moveDown(0.3);
    }
    doc.moveDown(0.8);

    // Teacher Notes
    if (report.teacherNotes) {
      doc
        .fontSize(14)
        .fillColor("#222")
        .text("Teacher Notes")
        .moveDown(0.4)
        .fontSize(11)
        .fillColor("#444")
        .text(report.teacherNotes)
        .moveDown(1);
    }

    // Footer
    doc
      .fontSize(9)
      .fillColor("#aaa")
      .text("This report was generated automatically by MathHub.", { align: "center" });

    doc.end();
  });
}
