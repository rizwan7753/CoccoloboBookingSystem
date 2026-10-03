import { PublicSettings } from "@/lib/settingsApi";

const NETWORKS: { key: keyof PublicSettings; label: string; icon: React.ReactNode }[] = [
  {
    key: "socialFacebookUrl",
    label: "Facebook",
    icon: (
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
    ),
  },
  {
    key: "socialInstagramUrl",
    label: "Instagram",
    icon: (
      <>
        <path
          fillRule="evenodd"
          d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
        />
        <circle cx="17.3" cy="6.7" r="1.1" />
      </>
    ),
  },
  {
    key: "socialTiktokUrl",
    label: "TikTok",
    icon: (
      <path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3a7 7 0 0 1-3.9-1.2v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.7 2.4V3h2.9Z" />
    ),
  },
  {
    key: "socialYoutubeUrl",
    label: "YouTube",
    icon: (
      <path
        fillRule="evenodd"
        d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8A27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z"
      />
    ),
  },
  {
    key: "socialXUrl",
    label: "X",
    icon: (
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    ),
  },
];

/** Footer social links — only networks with a link set in Admin → Settings →
 *  Social & WhatsApp are shown; renders nothing if none are set. */
export default function SocialIcons({ settings }: { settings: PublicSettings }) {
  const links = NETWORKS.filter((n) => typeof settings[n.key] === "string" && settings[n.key]);
  if (links.length === 0) return null;

  return (
    <ul className="mt-5 flex flex-wrap gap-2.5" aria-label="Follow us">
      {links.map((n) => (
        <li key={n.key}>
          <a
            href={settings[n.key] as string}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${n.label} (opens in a new tab)`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-foam/25 text-foam transition hover:-translate-y-0.5 hover:border-transparent hover:bg-aqua hover:text-abyss"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {n.icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
