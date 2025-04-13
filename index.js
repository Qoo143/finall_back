//--------------------<<導入區>>-------------------------

//一般導入 + 創建實例
const express = require("express");
const app = express();
const cors = require("cors");//處理跨域

///自訂中間鍵
const responseHelper = require("./middleware/responseHelper");//自訂成功與失敗中間鍵導入
const errorHandler = require("./middleware/errorHandler");

//路由導入
const loginRoutes = require("./router/login");//登入註冊模組
const productRoutes = require("./router/product");//商品模組
const productTagRouter = require('./router/productTag')//標籤模組
const tagRouter = require('./router/tag')//標籤模組
const productCategoryRouter = require('./router/productCategory')//分類模組


//--------------------<<中間鍵區>>-------------------------

//全局中間鍵
app.use(cors()); //跨域
app.use(express.static("public")); //靜態資源 (存放在public)
app.use(express.json()); //json
app.use(express.urlencoded({ extended: true })); //url


//自訂中間鍵
app.use(responseHelper);//'成功與錯誤自訂'中間鍵

//路由中間鍵 
app.use("/api", loginRoutes); //登入註冊模組
app.use('/products', productRoutes)//產品管理模組
app.use('/api/products', productTagRouter)//標籤模組
app.use('/tag', tagRouter)//標籤模組
app.use('/categories', productCategoryRouter)//標籤模組

//全局捕捉錯誤
app.use(errorHandler)

//--------------------<<監聽區>>-------------------------

app.listen("3007", () => {
  console.log("監聽127.0.0.1:3007");
});
