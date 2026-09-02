import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { upload } from "../../lib/upload";

const router = Router();
router.use(requireAdmin);

const EDIT_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER"] as const;

// POST /api/admin/uploads — accepts a single "file" field, stores it under
// backend/uploads/images, returns the relative path to store on the entity
// (cardImageUrl/headerImageUrl). The frontend resolves this to an absolute
// URL against the backend's own origin at render time.
router.post("/", requireRole(...EDIT_ROLES), (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.status(201).json({ url: `/uploads/images/${req.file.filename}` });
  });
});

export default router;
