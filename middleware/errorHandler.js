//--------------------<<全局未捕捉失敗中間鍵>>-------------------------
//這部分為gpt生成 較不了解邏輯

module.exports = (err, req, res, next) => {
  console.error("全局錯誤攔截：", err);

  // ✅ 專門處理 multer 錯誤（格式錯誤、大小過大）
  if (err.code === "LIMIT_FILE_SIZE") {
    // 根據請求路由判斷
    const isModelUpload = req.originalUrl.includes('/upload-model');
    const isImageUpload = req.originalUrl.includes('/images');

    if (isModelUpload) {
      return res.fail("模型檔案太大，請上傳 100MB 以內", 1, 413);
    }

    if (isImageUpload) {
      return res.fail("圖片太大，請上傳 5MB 以內", 1, 413);
    }

    // fallback（不確定是哪種）
    return res.fail("上傳檔案超過大小限制", 1, 413);
  }

  if (err.message.includes("只允許上傳")) {
    return res.fail(err.message, 1, 400);
  }

  // 如果還沒被 res.fail 包起來，統一格式處理
  if (typeof res.fail === "function") {
    res.fail(err, 1, 500);
  } else {
    // 如果還沒套用 responseHelper，提供基本 fallback
    res.status(500).json({
      data: null,
      message: err instanceof Error ? err.message : String(err),
      code: 500,
    });
  }
};
