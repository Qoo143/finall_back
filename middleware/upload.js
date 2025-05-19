const multer = require("multer");
const path = require("path");

// 允許的類型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_MODEL_TYPES = [
  'model/gltf-binary',  // GLB 模型的標準 MIME 類型
  'application/octet-stream'  // 有時 GLB 檔案會被識別為這個通用型別
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_MODEL_TYPES];

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB

// 臨時文件存儲配置 - 不再指定最終目的地，只存儲臨時文件
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../temp")); // 所有文件都存放在臨時目錄
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
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true); // 接受文件
  } else {
    cb(new Error('檔案格式不支援。僅支援 JPG, PNG, GIF, WEBP 格式的圖片與 GLB 模型'), false); // 拒絕文件
  }
};

// 配置 multer
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;