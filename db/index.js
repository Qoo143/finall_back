const mysql = require('mysql2'); //因為mysql版本為8 所以使用'mysql2'
require('dotenv').config(); // 載入dotenv以讀取環境變數

const db = mysql.createPool({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  waitForConnections: true,//當連線池已滿，是否要「等待」可用的連線
  connectionLimit: 10//最大連線數限制
});

module.exports = db.promise();//可以使用 async/await

//sql查詢語句回傳 用[rows]解構
//就能拿到回傳的物件