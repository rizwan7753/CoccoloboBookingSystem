"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const buttonClass = "btn btn-ghost flex-1 text-center";

/** Print/download actions for a booking confirmation — `pdfPath` is the
 *  backend's own confirmation-PDF endpoint, e.g. "/bookings/<id>/pdf". */
export default function BookingActions({ pdfPath }: { pdfPath: string }) {
  return (
    <div className="mt-4 flex gap-3 print:hidden">
      <button type="button" onClick={() => window.print()} className={buttonClass}>
        Print
      </button>
      <a href={`${API_URL}${pdfPath}`} target="_blank" rel="noreferrer" className={buttonClass}>
        Download PDF
      </a>
    </div>
  );
}
