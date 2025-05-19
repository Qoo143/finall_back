/**
 * 格式化圖片URL - 將相對路徑轉為完整URL
 * @param {string} url - 圖片URL或路徑
 * @param {boolean} isCloudinary - 是否已經是 Cloudinary URL
 * @returns {string} 格式化後的URL
 */
const formatImageUrl = (url, isCloudinary = false) => {
  if (!url) return '/img/placeholder.png';
  
  // 如果已經是完整的URL
  if (url.startsWith('http')) return url;
  
  // 相對路徑轉為完整URL (本地環境)
  return `${process.env.API_BASE_URL || 'http://127.0.0.1:3007'}${url}`;
};

/**
 * 判斷URL是否為 Cloudinary URL
 * @param {string} url - 要檢查的URL
 * @returns {boolean} 是否為 Cloudinary URL
 */
const isCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudinary.com');
};

/**
 * 格式化模型URL - 將相對路徑轉為完整URL
 * @param {string} url - 模型URL或路徑
 * @returns {string} 格式化後的URL
 */
const formatModelUrl = (url) => {
  if (!url) return '';
  
  // 如果已經是完整的URL
  if (url.startsWith('http')) return url;
  
  // 相對路徑轉為完整URL (本地環境)
  return `${process.env.API_BASE_URL || 'http://127.0.0.1:3007'}${url}`;
};

module.exports = {
  formatImageUrl,
  formatModelUrl,
  isCloudinaryUrl
};