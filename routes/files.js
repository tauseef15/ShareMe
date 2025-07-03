const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadFile,
  getFile,
  sendFile,
  renderDownloadPage,
  downloadFile,
} = require("../controllers/fileController");

// Ensure uploads directory exists
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("file"), uploadFile);
router.get("/:uuid", getFile);
router.post("/send", sendFile);
router.get("/files/:uuid",renderDownloadPage);
router.get("/files/download/:uuid", downloadFile);
module.exports = router;
