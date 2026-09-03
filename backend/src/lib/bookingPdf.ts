import PDFDocument from "pdfkit";
import type { Response } from "express";

export type PdfRow = { label: string; value: string };

const ACCENT_BY_TYPE: Record<"excursion" | "rental" | "event", [number, number, number]> = {
  excursion: [15, 118, 110], // teal-700
  rental: [180, 83, 9], // amber-700
  event: [162, 28, 175], // fuchsia-700
};

/**
 * Streams a simple one-page confirmation PDF directly to the response —
 * pdfkit is pure JS (no headless-browser/native binary), which matters on
 * this host given the GLIBC/thread constraints hit earlier with anything
 * Chromium-based.
 */
export function streamBookingConfirmationPdf(
  res: Response,
  params: {
    type: "excursion" | "rental" | "event";
    locationName: string;
    heading: string;
    guestName: string;
    statusLabel: string;
    rows: PdfRow[];
    bookingCode: string;
  }
) {
  const { type, locationName, heading, guestName, statusLabel, rows, bookingCode } = params;
  const accent = ACCENT_BY_TYPE[type];

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${bookingCode}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 90).fill(accent);
  doc
    .fillColor("white")
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(locationName.toUpperCase(), 50, 30, { characterSpacing: 1 });
  doc.fontSize(20).text(heading, 50, 50);

  doc.fillColor("#1c1917").fontSize(12).font("Helvetica").moveDown(4);
  doc.text(`Hi ${guestName},`, 50, 120);
  doc.fontSize(11).fillColor("#57534e").text(statusLabel, 50, 142, { width: 495 });

  let y = 180;
  doc.fontSize(11);
  for (const row of rows) {
    doc.fillColor("#a8a29e").font("Helvetica").text(row.label, 50, y, { width: 200 });
    doc.fillColor("#1c1917").font("Helvetica-Bold").text(row.value, 260, y, { width: 285, align: "right" });
    doc
      .moveTo(50, y + 20)
      .lineTo(545, y + 20)
      .strokeColor("#f5f5f4")
      .stroke();
    y += 30;
  }

  doc
    .fontSize(9)
    .fillColor("#a8a29e")
    .font("Helvetica")
    .text(`Booking reference: ${bookingCode}`, 50, y + 15);

  doc.end();
}
