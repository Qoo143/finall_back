// 存儲服務的工廠模式 - 便於未來切換其他雲端服務
const cloudinaryStorage = require('./cloudinaryStorage');

// 這裡可以根據環境變數或配置來選擇存儲服務
const getStorageService = () => {
  // 如果後續添加其他存儲服務，可以在這裡選擇
  return cloudinaryStorage;
};

module.exports = getStorageService();