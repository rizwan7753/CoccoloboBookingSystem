import "dotenv/config";
import express from "express";
// Express 4 doesn't forward errors thrown in async route handlers to the
// error middleware — they become unhandled rejections, which crash the whole
// Node process (the browser then just sees "Failed to fetch"). This patch
// routes them to the handler at the bottom of this file instead.
import "express-async-errors";
import cors from "cors";
import path from "path";

import excursionsRouter from "./routes/excursions";
import bookingsRouter from "./routes/bookings";
import authRouter from "./routes/auth";
import webhooksRouter from "./routes/webhooks";
import adminExcursionsRouter from "./routes/admin/excursions";
import adminBookingsRouter from "./routes/admin/bookings";
import adminUsersRouter from "./routes/admin/users";
import adminRolesRouter from "./routes/admin/roles";
import adminAuditLogRouter from "./routes/admin/auditLog";
import adminLocationsRouter from "./routes/admin/locations";
import adminDashboardRouter from "./routes/admin/dashboard";
import rentalsRouter from "./routes/rentals";
import rentalBookingsRouter from "./routes/rentalBookings";
import adminRentalsRouter from "./routes/admin/rentals";
import adminRentalBookingsRouter from "./routes/admin/rentalBookings";
import eventsRouter from "./routes/events";
import eventBookingsRouter from "./routes/eventBookings";
import adminEventsRouter from "./routes/admin/events";
import adminEventBookingsRouter from "./routes/admin/eventBookings";
import adminHolidaysRouter from "./routes/admin/holidays";
import adminSettingsRouter from "./routes/admin/settings";
import settingsRouter from "./routes/settings";
import adminUploadsRouter from "./routes/admin/uploads";
import bookingLookupRouter from "./routes/bookingLookup";
import restaurantMenusRouter from "./routes/restaurantMenus";
import restaurantReservationsRouter from "./routes/restaurantReservations";
import adminRestaurantMenusRouter from "./routes/admin/restaurantMenus";
import adminRestaurantReservationsRouter from "./routes/admin/restaurantReservations";
import ordersRouter from "./routes/orders";
import adminOrdersRouter from "./routes/admin/orders";
import reviewsRouter from "./routes/reviews";
import adminReviewsRouter from "./routes/admin/reviews";
import blogPostsRouter from "./routes/blogPosts";
import adminBlogPostsRouter from "./routes/admin/blogPosts";
import { sweepExpiredOrders } from "./services/orderService";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }));

// Stripe webhook needs the raw body for signature verification —
// must be registered BEFORE express.json().
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

app.use(express.json());

// Uploaded card/header images — served statically, path stored on the
// entity is exactly the relative path returned here.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/excursions", excursionsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/excursions", adminExcursionsRouter);
app.use("/api/admin/bookings", adminBookingsRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/roles", adminRolesRouter);
app.use("/api/admin/audit-log", adminAuditLogRouter);
app.use("/api/admin/locations", adminLocationsRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/rentals", rentalsRouter);
app.use("/api/rental-bookings", rentalBookingsRouter);
app.use("/api/admin/rentals", adminRentalsRouter);
app.use("/api/admin/rental-bookings", adminRentalBookingsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/event-bookings", eventBookingsRouter);
app.use("/api/admin/events", adminEventsRouter);
app.use("/api/admin/event-bookings", adminEventBookingsRouter);
app.use("/api/admin/holidays", adminHolidaysRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);
app.use("/api/booking-lookup", bookingLookupRouter);
app.use("/api/restaurant-menus", restaurantMenusRouter);
app.use("/api/restaurant-reservations", restaurantReservationsRouter);
app.use("/api/admin/restaurant-menus", adminRestaurantMenusRouter);
app.use("/api/admin/restaurant-reservations", adminRestaurantReservationsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/blog-posts", blogPostsRouter);
app.use("/api/admin/blog-posts", adminBlogPostsRouter);

// Centralized error handler — receives errors from sync handlers and, via
// express-async-errors above, from async handlers too.
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  // Unexpected (5xx) errors can carry file paths and query details — on
  // production, show them only to signed-in staff (admin routes, where the
  // message is what lets them report the actual problem); public guests
  // just get a generic message and the details stay in the server log.
  const isAdminRoute = req.originalUrl.startsWith("/api/admin");
  const hideDetails = status >= 500 && process.env.NODE_ENV === "production" && !isAdminRoute;
  res.status(status).json({ error: hideDetails ? "Internal server error" : err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Coccolobo booking API listening on http://localhost:${port}`);
});

// Releases capacity for multi-item orders abandoned mid-checkout (see
// orderService.sweepExpiredOrders) — the only expiry mechanism in this
// codebase; single-item bookings still rely solely on the Stripe webhook's
// failure event or a manual admin cancel, unchanged.
setInterval(() => {
  sweepExpiredOrders().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[orders] Expiry sweep failed:", err);
  });
}, 5 * 60 * 1000);
