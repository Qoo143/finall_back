# QianTa 電商系統 - 後端

> 📖 [返回專案總覽](https://github.com/Qoo143/QianTa)

基於 Express + MySQL 的 RESTful API 服務，提供完整的電商後端功能。

## 🔗 相關連結
- **🏠 [專案總覽](https://github.com/Qoo143/QianTa)** - 完整專案說明  
- **🌐 [前端專案](https://github.com/Qoo143/finall_front)** - 用戶界面

## ⚡ 快速開始

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env

# 啟動服務
npm start
```

### 環境變數設定
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=back_system
JWT_SECRET=your_jwt_secret
```

## 🛠 技術棧

- **Express.js** - Web 框架
- **MySQL** - 關聯式資料庫
- **JWT** - 身份驗證
- **Multer** - 檔案上傳
- **Joi** - 資料驗證
- **bcryptjs** - 密碼加密

## 📁 專案結構

```
├── router/                # API 路由
├── router_controllers/    # 業務邏輯
├── middleware/           # 中間件
│   ├── auth.js          # JWT 驗證
│   ├── upload.js        # 檔案上傳
│   └── errorHandler.js  # 錯誤處理
├── db/                   # 資料庫
└── public/uploads/       # 檔案存儲
```

## 🔌 API 端點

### 商品管理
```
GET    /products          # 商品列表
GET    /products/:id      # 商品詳情  
POST   /products          # 新增商品
PUT    /products/:id      # 更新商品
DELETE /products/:id      # 刪除商品
```

### 用戶認證
```
POST   /api/register      # 用戶註冊
POST   /api/login         # 用戶登入
```

### 購物車
```
GET    /api/cart          # 獲取購物車
POST   /api/cart/items    # 加入商品
PATCH  /api/cart/items/:id # 更新數量
DELETE /api/cart/items/:id # 移除商品
```

### 訂單管理
```
GET    /api/orders        # 訂單列表
POST   /api/orders        # 建立訂單
PATCH  /api/orders/:id/cancel # 取消訂單
```

### 分類與標籤
```
GET    /categories        # 分類列表
POST   /categories        # 新增分類
GET    /tags              # 標籤列表
POST   /tags              # 新增標籤
```

## 🔒 安全機制

- **JWT 身份驗證**：保護需要權限的 API
- **密碼加密**：bcryptjs 雜湊處理
- **檔案驗證**：限制上傳檔案類型與大小
- **錯誤處理**：統一錯誤回應格式

## 💾 資料庫設計

### 核心資料表
- `users` - 用戶資料
- `products` - 商品資料
- `product_images` - 商品圖片
- `shopping_carts` - 購物車
- `orders` - 訂單資料
- `categories` - 商品分類
- `tags` - 商品標籤

## 📊 回應格式

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {...}
}
```

---

> 💡 更多技術細節請參考 [專案總覽文件](https://github.com/Qoo143/QianTa)
