const mysql = require('mysql2'); //因為mysql版本為8 所以使用'mysql2'
require('dotenv').config(); // 載入dotenv以讀取環境變數

//// 連接設定
const config = {
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  waitForConnections: true,//當連線池已滿，是否要「等待」可用的連線
  connectionLimit: 5,//最大連線數限制
  queueLimit: 0,//等候請求數量限制
  connectTimeout: 30000,// 連線資料庫最大等待時間（毫秒）
  acquireTimeout: 30000// 從連線池取得連線的最大等待時間（毫秒）
};

// 創建連接池（可以重複使用的資料庫連線）
const db = mysql.createPool(config);

// 連接錯誤處理
db.on('error', (err) => {
  console.error('資料庫連接池錯誤:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('資料庫連接丟失，將嘗試重連...');
    // 自定義的重連邏輯
  }
});

// 測試連接
db.getConnection((err, connection) => {
  if (err) {
    console.error('資料庫連接測試失敗:', err);
    return;
  }
  console.log('資料庫連接測試成功!');
  connection.release();// 釋放連線回連線池
});

// 導出 Promise 版的 pool，讓其他地方可以用 async/await 操作
module.exports = db.promise();
