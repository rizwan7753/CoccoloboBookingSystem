import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// backend/uploads — a top-level dir sibling to src/dist/prisma, never
// touched by `tsc` (only writes dist/) or `npm install`. Deploy processes
// that do a clean wipe-and-reextract (rather than an additive git
// pull/rsync) would lose this — flagged as a deploy-process assumption to
// verify before this feature goes to production.
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, "images");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
  },
});

export const UPLOADS_DIR = UPLOAD_ROOT;
