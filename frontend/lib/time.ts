/** "14:05" -> "2:05 PM" */
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

/** "14:05" + 90 -> "15:35" (wraps past midnight if needed) */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes + 1440 * 7) % 1440; // guard against negative input
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/** "14:05", 90 -> "2:05 PM – 3:35 PM" */
export function formatTimeRange(time: string, durationMinutes: number): string {
  const end = addMinutesToTime(time, durationMinutes);
  return `${formatTime12h(time)} – ${formatTime12h(end)}`;
}
