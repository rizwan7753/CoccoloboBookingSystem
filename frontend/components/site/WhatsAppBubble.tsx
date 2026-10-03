"use client";

import { useEffect, useState } from "react";

const WHATSAPP_ICON = (
  <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.9L2.2 21.8l4.8-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z" />
);

/** Floating WhatsApp button (bottom-right) that opens a small chat card;
 *  "Start chat" opens WhatsApp with the club's number and an editable
 *  greeting. Rendered only when a number is set in Admin → Settings. */
export default function WhatsAppBubble({ name, number, message }: { name: string; number: string; message?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const text = message || `Hi ${name}! I'd like to ask about a booking.`;
  const chatUrl = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

  return (
    <div className="wa-bubble site-body fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label={`Chat with ${name} on WhatsApp`}
          className="w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-abyss/25"
        >
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {WHATSAPP_ICON}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-white/80">Chat with us on WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="bg-[#ece5dd] px-4 py-5">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-abyss shadow-sm">
              Hi there! How can we help you plan your day at {name}?
            </div>
          </div>

          <div className="p-3">
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-2.5 text-sm font-semibold text-[#073b33] transition hover:bg-[#1ebe5b]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {WHATSAPP_ICON}
              </svg>
              Start chat
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close WhatsApp chat" : "Chat with us on WhatsApp"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-abyss/30 transition hover:scale-105 hover:bg-[#1ebe5b]"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {WHATSAPP_ICON}
        </svg>
      </button>
    </div>
  );
}
