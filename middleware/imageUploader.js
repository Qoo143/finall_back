const multer = require("multer");
const path = require("path");

const imageUpload = multer({
  dest: "./public/upload/images",
  limits: {
    fileSize: 5 * 1024 * 1024, // 每張最大 5MB
    files: 10 // 最多上傳 10 張
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedExts.includes(ext)) {
      return cb(new Error("只允許上傳圖片（.jpg/.png/.webp）"));
    }
    cb(null, true);
  }
});

module.exports = imageUpload;
