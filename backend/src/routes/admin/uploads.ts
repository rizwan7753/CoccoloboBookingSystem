import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { upload } from "../../lib/upload";

const router = Router();
router.use(requireAdmin);

// POST /api/admin/uploads — accepts a single "file" field, stores it under
// backend/uploads/images, returns the relative path to store on the entity
// (cardImageUrl/headerImageUrl). The frontend resolves this to an absolute
// URL against the backend's own origin at render time. Gated by any one
// content-management permission — uploading a file isn't sensitive on its
// own, the entity save it's attached to is what's actually protected.
router.post(
  "/",
  requirePermission("excursions.manage", "rentals.manage", "events.manage", "restaurant.manage"),
  (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      res.status(201).json({ url: `/uploads/images/${req.file.filename}` });
    });
  }
);

export default router;
