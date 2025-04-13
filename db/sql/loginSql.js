module.exports = {
  checkAccountExists: "SELECT * FROM users WHERE account = ?",//查詢帳號，若有回傳值則表示存在帳號
  insertUser: "INSERT INTO users SET ?",//註冊資料插入
};