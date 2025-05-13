// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT密鑰
const JWT_SECRET = process.env.jwtSecretkey;

module.exports = (req, res, next) => {
  // 從請求頭獲取 token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail("未提供身份驗證令牌", 401);
  }
  
  // 提取 JWT
  const token = authHeader.split(' ')[1];
  
  try {
    // 驗證 JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 將用戶信息添加到請求物件中
    req.user = {
      id: decoded.id,
      account: decoded.account
    };
    
    next();
  } catch (error) {
    return res.fail("無效的身份驗證令牌", 401);
  }
};