const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 確保上傳目錄存在(若不存在該目錄則創建)
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });//{ recursive: true }開啟遞迴建立
    console.log(`目錄已創建: ${dirPath}`);
  }
};

// 再次確認必要的目錄
const uploadDir = path.join(__dirname, "../public/upload/images");
const modelDir = path.join(__dirname, "../public/upload/models");
const iconDir = path.join(__dirname, "../public/upload/icons");
ensureDirectoryExists(uploadDir);
ensureDirectoryExists(modelDir);
ensureDirectoryExists(iconDir);

// 允許的類型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'model/gltf-binary',  // GLB 模型的標準 MIME 類型
  'application/octet-stream'  // 有時 GLB 檔案會被識別為這個通用型別
]
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB

// 文件存儲配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/upload/images")); // 暫存目錄
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// 文件過濾器
const fileFilter = (req, file, cb) => {
  console.log("收到上傳檔案:", file.mimetype); // 建議加這行 debug
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('只允許上傳 JPG, PNG, GIF, WEBP 格式的圖片與 glb 模型'), false); // 拒絕文件
  }
};

// 配置 multer
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;