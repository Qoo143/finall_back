//--------------------<<導入區>>-------------------------

//一般導入 + 創建實例
const express = require("express");
const app = express();
const cors = require("./utils/cors");//自訂跨域

///自訂中間鍵
const responseHelper = require("./middleware/responseHelper");//自訂成功與失敗中間鍵導入
const errorHandler = require("./middleware/errorHandler");

//路由導入
const loginRoutes = require("./router/login");//登入註冊模組
const productRoutes = require("./router/product");//商品模組
const productTagRouter = require('./router/productTag')//標籤模組
const tagRouter = require('./router/tag')//標籤模組
const productCategoryRouter = require('./router/productCategory')//分類模組
const cartRoutes = require('./router/cart');//購物車模組
const orderRoutes = require('./router/order');


//--------------------<<中間鍵區>>-------------------------

//全局中間鍵
app.use(cors) //跨域
  .use(express.static("public")) //靜態資源 (存放在public)
  .use(express.json()) //json
  .use(express.urlencoded({ extended: true })); //url


//自訂中間鍵
app.use(responseHelper);//'成功與錯誤自訂'中間鍵

//路由中間鍵 
app.use("/api", loginRoutes) //登入註冊模組
  .use('/api/cart', cartRoutes) // 新增購物車路由
  .use('/products', productRoutes)//產品管理模組
  .use('/categories', productCategoryRouter)//分類模組
  .use('/tags', tagRouter)//標籤模組
  .use('/api/products', productTagRouter)//標籤連結模組
  .use('/api/orders', orderRoutes);//訂單模組


//全局捕捉錯誤
app.use(errorHandler)

process.on('uncaughtException', (err) => {
  console.error('未捕獲的異常:', err);
  // 避免進程立即退出，但記錄錯誤
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  // 記錄未處理的 Promise 錯誤
});

//--------------------<<監聽區>>-------------------------

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`伺服器已啟動： http://127.0.0.1:${PORT}`);
});