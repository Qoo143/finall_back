const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 上傳圖片到 Cloudinary
 * @param {string} filePath - 本地臨時文件路徑
 * @param {Object} options - 上傳選項
 * @returns {Promise<Object>} 上傳結果，包含 url
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'images',
      ...options
    });
    
    // 上傳成功後刪除本地臨時文件
    fs.unlink(filePath, (err) => {
      if (err) console.warn('刪除臨時檔案失敗:', err);
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary 圖片上傳失敗:', error);
    throw error;
  }
};

/**
 * 上傳模型文件到 Cloudinary
 * @param {string} filePath - 本地臨時文件路徑
 * @param {Object} options - 上傳選項
 * @returns {Promise<Object>} 上傳結果，包含 url
 */
const uploadModel = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // 使用 raw 類型來上傳 GLB 文件
      folder: 'models',
      ...options
    });
    
    // 上傳成功後刪除本地臨時文件
    fs.unlink(filePath, (err) => {
      if (err) console.warn('刪除臨時檔案失敗:', err);
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary 模型上傳失敗:', error);
    throw error;
  }
};

/**
 * 刪除 Cloudinary 上的檔案
 * @param {string} publicId - Cloudinary 的 public_id
 * @param {Object} options - 刪除選項
 * @returns {Promise<Object>} 刪除結果
 */
const deleteFile = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error('Cloudinary 檔案刪除失敗:', error);
    throw error;
  }
};

/**
 * 從URL中提取 public_id
 * @param {string} url - Cloudinary URL
 * @returns {string|null} public_id 或 null 如果不是 Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // 檢查是否為 Cloudinary URL
  if (!url.includes('cloudinary.com')) return null;
  
  try {
    // 格式例如: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/filename.jpg
    const urlParts = url.split('/');
    const filenamePart = urlParts[urlParts.length - 1]; // 取得最後的檔名部分
    const versionIndex = urlParts.findIndex(part => part.startsWith('v') && /^\d+$/.test(part.substring(1)));
    
    if (versionIndex !== -1) {
      // 組合 public_id (版本後的路徑，不含檔名的副檔名)
      const folderPath = urlParts.slice(versionIndex + 1, urlParts.length - 1).join('/');
      const filename = filenamePart.split('.')[0]; // 去除副檔名
      return folderPath ? `${folderPath}/${filename}` : filename;
    }
    
    return null;
  } catch (error) {
    console.error('解析 Cloudinary URL 失敗:', error);
    return null;
  }
};

module.exports = {
  uploadImage,
  uploadModel,
  deleteFile,
  getPublicIdFromUrl
};