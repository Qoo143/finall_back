const cors = require('cors');

// 建議使用函式導出，方便日後根據環境動態調整
const corsOptions = {
  origin: ['https://your-frontend.com', 'http://localhost:8080'], // 支援線上與本地
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);