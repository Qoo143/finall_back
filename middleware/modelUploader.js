const multer = require("multer");
const path = require("path");

const modelUpload = multer({
  dest: './public/upload/models',
  limits: {
    fileSize: 100 * 1024 * 1024  // 限制單檔 100MB
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".obj", ".mtl", ".jpg", ".jpeg", ".png", ".webp"];

    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "application/octet-stream",
      "model/obj",         // ✅ 支援 .obj
      "model/mtl",         // ✅ 有些系統也可能出現這個
    ];

    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
      return cb(new Error("只允許上傳 .obj / .mtl / 圖片"));
    }

    cb(null, true);
  }
});

module.exports = modelUpload;

