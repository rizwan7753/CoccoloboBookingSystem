import { settingsApi } from "@/lib/settingsApi";
import { restaurantApi } from "@/lib/restaurantApi";
import AnnouncementBar from "./AnnouncementBar";
import HeaderBar from "./HeaderBar";

// Header structure ported from coccolobo-beach-club.html: announcement bar
// → utility nav → main nav with a centred wordmark. Data fetching (settings
// + restaurant menus) is unchanged from the previous implementation.
export default async function Header() {
  const [{ name }, menus] = await Promise.all([settingsApi.getSettings(), restaurantApi.listMenus().catch(() => [])]);
  const menuLinks = menus.map((m) => ({ title: m.title, slug: m.slug }));

  return (
    // display:contents removes this wrapper from the box model — the sticky
    // header's containing block would otherwise be this tiny wrapper (just
    // announcement bar + header tall), so it could only stay "stuck" for
    // that little bit of scroll before running out of room and scrolling
    // away with the rest of the page. Contents makes its children (the
    // announcement bar and header) direct flex items of the page layout,
    // which spans the full page height, so the header can stay pinned for
    // the whole scroll. site-body's font/color still inherit through fine.
    <div className="site-body contents print:hidden">
      <AnnouncementBar id="stingray-haven">
        Experience St. Kitts&apos; Exclusive Stingray Haven — An Unforgettable Marine Life Encounter
      </AnnouncementBar>

      <HeaderBar name={name} menuLinks={menuLinks} />
    </div>
  );
}
