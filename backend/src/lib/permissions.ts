// Fixed catalog of permission keys a Role can be granted (see prisma schema's
// Role/RolePermission models). Unlike roles, permission keys are not
// admin-editable — they're defined here in code, one per module/action, and
// `requirePermission()` middleware checks a request's admin against them.
export const PERMISSIONS = [
  "dashboard.view",
  "excursions.view",
  "excursions.manage",
  "rentals.view",
  "rentals.manage",
  "events.view",
  "events.manage",
  "holidays.view",
  "holidays.manage",
  "restaurant.view",
  "restaurant.manage",
  "restaurant.manage_reservations",
  "bookings.view",
  "bookings.manage",
  "settings.manage",
  "staff.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

// Grouped for the admin "Roles" screen — label text shown next to each checkbox.
export const PERMISSION_GROUPS: { label: string; permissions: { key: Permission; label: string }[] }[] = [
  { label: "Dashboard", permissions: [{ key: "dashboard.view", label: "View dashboard" }] },
  {
    label: "Excursions",
    permissions: [
      { key: "excursions.view", label: "View excursions" },
      { key: "excursions.manage", label: "Create, edit, delete excursions & schedules" },
    ],
  },
  {
    label: "Beach Chairs & Rentals",
    permissions: [
      { key: "rentals.view", label: "View rental items" },
      { key: "rentals.manage", label: "Create, edit, delete rental items & spots" },
    ],
  },
  {
    label: "Events",
    permissions: [
      { key: "events.view", label: "View events" },
      { key: "events.manage", label: "Create, edit, delete events & ticket tiers" },
    ],
  },
  {
    label: "Holidays & Closures",
    permissions: [
      { key: "holidays.view", label: "View holidays" },
      { key: "holidays.manage", label: "Add, edit, delete holidays" },
    ],
  },
  {
    label: "Restaurant",
    permissions: [
      { key: "restaurant.view", label: "View menus & reservations" },
      { key: "restaurant.manage", label: "Create, edit, delete menus" },
      { key: "restaurant.manage_reservations", label: "Update or cancel reservations" },
    ],
  },
  {
    label: "Bookings",
    permissions: [
      { key: "bookings.view", label: "View bookings & export" },
      { key: "bookings.manage", label: "Cancel bookings & mark as paid" },
    ],
  },
  {
    label: "Administration",
    permissions: [
      { key: "settings.manage", label: "Edit system settings (SMTP, payments, branding)" },
      { key: "staff.manage", label: "Manage staff accounts & roles" },
      { key: "audit.view", label: "View activity log" },
    ],
  },
];

// Seeded once by the add_roles_and_permissions migration. Ids match the old
// AdminRole enum's values so existing admin_users.role data kept working
// across the migration with no remapping. Kept here (not just in the SQL) so
// the "Reset to default" action on a built-in role can restore this exact set.
export const BUILT_IN_ROLES: { id: string; name: string; permissions: Permission[] }[] = [
  { id: "SUPER_ADMIN", name: "Super Admin", permissions: [...PERMISSIONS] },
  {
    id: "LOCATION_MANAGER",
    name: "Location Manager",
    permissions: [
      "dashboard.view",
      "excursions.view",
      "excursions.manage",
      "rentals.view",
      "rentals.manage",
      "events.view",
      "events.manage",
      "holidays.view",
      "holidays.manage",
      "restaurant.view",
      "restaurant.manage",
      "restaurant.manage_reservations",
      "bookings.view",
      "bookings.manage",
    ],
  },
  {
    id: "BOOKING_STAFF",
    name: "Booking Staff",
    permissions: [
      "dashboard.view",
      "excursions.view",
      "rentals.view",
      "events.view",
      "holidays.view",
      "restaurant.view",
      "restaurant.manage_reservations",
      "bookings.view",
      "bookings.manage",
    ],
  },
  {
    id: "FINANCE",
    name: "Finance",
    permissions: ["dashboard.view", "excursions.view", "rentals.view", "events.view", "holidays.view", "restaurant.view", "bookings.view"],
  },
  { id: "TRAVEL_AGENT", name: "Travel Agent", permissions: [] },
];
