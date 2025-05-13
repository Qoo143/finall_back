//--------------------<<導入區>>-------------------------

const db = require('../db/index'); //數據庫
const joi = require('joi'); //表單較驗
const bcrypt = require('bcryptjs');//轉雜湊值 //改用bycriptjs
const jwt = require('jsonwebtoken');//製作token
const loginSql = require('../db/sql/loginSql')//sql語句
require('dotenv').config(); // 載入dotenv以讀取環境變數

//--------------------<<前期設定>>-------------------------

// 表單驗證條件
const userSchema = joi.object({

  account: joi.string()
    //帳號限制5-12碼
    .min(5)
    .max(12)
    .required(),

  password: joi.string()  //密碼限制
    .pattern(/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,12}$/)
    .required()

})
// 表單驗證函數
const validateUser = (data) => {
  return userSchema.validate(data);
};
// token密鑰
const JWT_SECRET = process.env.jwtSecretkey
// 加鹽
const SALT_ROUNDS = 10;
//--------------------<<路由處理區>>-------------------------

//註冊處理
exports.regist = async (req, res, next) => {
  try {
    //1.先較驗表單
    const checked = validateUser(req.body);
    if (checked.error) return res.fail('您輸入的帳號或密碼有誤');

    //2.解構
    const { account, password } = req.body

    //3.判斷非空
    if (!account || !password) { return res.fail('帳號或密碼為必填項', 1001) }

    //4.判斷帳號是否重複註冊
    const sql = 'select * from users where account = ?'
    const [rows] = await db.query(sql, [account])
    if (rows.length > 0) { return res.fail('輸入帳號重複') }

    //5.將密碼加密
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    //6.插入資料庫
    const date = new Date()
    const sql2 = `INSERT INTO users (account, password, create_time, update_time) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql2, [account, hashedPassword, date, date]);

    //7.成功
    res.success(null, "註冊成功");
  }
  catch (error) {
    next(error)
  }
}

//登入處理
exports.login = async (req, res, next) => {

  try {
    //1.先較驗表單
    const checked = validateUser(req.body);
    if (checked.error) return res.fail('您輸入的帳號或密碼有誤');

    //2.解構
    const { account, password } = req.body;

    //3.檢查非空
    if (!account || !password) { return res.fail("請輸入帳號與密碼"); }

    //4.查詢資料庫
    const [result] = await db.query("SELECT * FROM users WHERE account = ?", [account]);

    //5.檢查是否存在此帳號 
    if (!result[0]) { return res.fail("帳號或密碼錯誤"); }

    //6.是否被凍結
    if (result[0].status == 1) return res.fail('帳號被凍結');//若用戶狀態為1(凍結則不可登入)

    //5.檢查密碼是否正確
    const isPasswordCorrect = await bcrypt.compare(password, result[0].password);
    if (!isPasswordCorrect) { return res.fail("帳號或密碼錯誤"); }

    // 6.產生 token（有效期：7 天）
    const tokenStr = jwt.sign({ id: result[0].id, account: result[0].account }, JWT_SECRET, { expiresIn: "7d" });
    const token = 'Bearer ' + tokenStr

    //8.移除用戶密碼
    const userData = { ...result[0] }; // 複製用戶數據
    userData.password = ""; // 移除密碼

    //7.成功
    res.success({ token, ...userData }, "登入成功")
  } catch (err) {
    next(err);
  }

}

//登出處理
exports.logOut = (req, res) => {

}