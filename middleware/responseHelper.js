//--------------------<<全局成功與失敗中間鍵>>-------------------------

module.exports = (req, res, next) => {

  // 統一回應成功
  res.success = (data = null, message = "操作成功", code = 0,) => {
    res.status(200).json({
      data,
      message,// 一致使用 message
      code   // 成功固定是 code: 0
    });
  };

  // 統一回應錯誤，可自訂錯誤狀態
  res.fail = (error = "操作失敗", code = 1, status = 400) => {
    res.status(status).json({
      data: null,
      message: error instanceof Error ? error.message : error, // 一致使用 message
      code,
    });
  };

  next();
}