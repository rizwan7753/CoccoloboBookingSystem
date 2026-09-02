import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import excursionsRouter from "./routes/excursions";
import bookingsRouter from "./routes/bookings";
import authRouter from "./routes/auth";
import webhooksRouter from "./routes/webhooks";
import adminExcursionsRouter from "./routes/admin/excursions";
import adminBookingsRouter from "./routes/admin/bookings";
import adminUsersRouter from "./routes/admin/users";
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

// Centralized error handler (catches anything thrown in async route handlers below Express 5,
// or rejected promises not already try/caught).
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Cocolobo booking API listening on http://localhost:${port}`);
});
