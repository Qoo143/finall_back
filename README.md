# 🚗 QianTa 電商系統

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2.9-409EFF?style=for-the-badge&logo=element&logoColor=white)

> 🌟 **現代化全端電商平台 - 汽車交易專業系統**
> 
> 結合 Vue 3 + TypeScript + Express.js + MySQL 打造的完整電商解決方案

---

## 📋 專案簡介

**QianTa** 是一個功能完整的現代化電商平台，專注於汽車及交通工具的線上展示與交易。整個系統採用前後端分離架構，提供管理者完整的後台管理系統，以及用戶友善的購物體驗。

### ⚠️ 專案說明
此專案為個人學習作品集項目，展示從 2024 年 12 月開始學習前端開發的成果，包含完整的前後端功能實作。

---

## 🛠️ 技術棧

### 前端技術
```
🎨 UI Framework     │ Vue 3 (Composition API) + TypeScript
🎯 狀態管理         │ Pinia + Pinia Plugin Persistedstate  
🎪 UI 組件庫        │ Element Plus
🛣️ 路由管理         │ Vue Router 4
🎨 樣式處理         │ SCSS + CSS Variables
🎬 動畫效果         │ GSAP + ScrollTrigger
🎭 3D 模型展示      │ Google Model Viewer
📦 構建工具         │ Vite
```

### 後端技術
```
🚀 Runtime         │ Node.js
🌐 Web 框架        │ Express.js 4.21
🗄️ 資料庫          │ MySQL 8.0 + mysql2
🔐 身份驗證         │ JWT + bcryptjs
📁 檔案上傳         │ Multer
✅ 數據驗證         │ Joi
🔧 工具函數         │ cors + dotenv
```

### 開發工具
```
⚡ 開發環境         │ Vite + Hot Reload
📝 代碼編輯         │ VS Code + Volar
🔍 API 測試        │ 內建 Axios 攔截器
📂 版本控制         │ Git
```

---

## 🌟 核心功能

### 🛍️ 前台用戶功能
- ✅ **用戶系統**：註冊、登入、JWT 身份驗證
- ✅ **商品瀏覽**：分類篩選、標籤搜尋、價格排序
- ✅ **3D 展示**：支援 GLB 格式 3D 模型互動展示
- ✅ **購物車**：添加商品、數量調整、即時計算
- ✅ **訂單系統**：下單、付款、訂單查詢與取消
- ✅ **響應式設計**：完美適配桌面端與行動裝置

### 🎛️ 後台管理功能
- ✅ **商品管理**：新增、編輯、刪除、圖片/模型上傳
- ✅ **分類管理**：商品分類的層級管理
- ✅ **標籤系統**：商品標籤的建立與關聯
- ✅ **訂單處理**：訂單狀態管理、發貨處理
- ✅ **權限控制**：管理員身份驗證與功能權限

### 🎨 用戶體驗
- ✅ **動畫效果**：GSAP 打造的流暢頁面轉場
- ✅ **Loading 狀態**：完整的載入狀態反饋
- ✅ **錯誤處理**：友善的錯誤提示與處理
- ✅ **數據持久化**：購物車與用戶狀態保存

---

## 🚀 快速開始

### 環境需求
- **Node.js** 16.0 或更高版本
- **MySQL** 8.0 或更高版本
- **Git** 版本控制工具

### 📥 安裝步驟

#### 1️⃣ 複製專案
```bash
git clone https://github.com/yourusername/qianta-ecommerce.git
cd qianta-ecommerce
```

#### 2️⃣ 後端設置
```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env
```

#### 3️⃣ 設置環境變數
編輯 `.env` 檔案：
```env
# 資料庫設定
host=localhost
port=3306
user=your_username
password=your_password
database=back_system

# JWT 密鑰
jwtSecretkey=your_super_secret_key_here
```

#### 4️⃣ 資料庫設置
```bash
# 登入 MySQL
mysql -u root -p

# 建立資料庫
CREATE DATABASE back_system;
exit

# 匯入資料庫結構
mysql -u root -p back_system < pw_sql.sql
```

#### 5️⃣ 啟動後端服務
```bash
npm start
# 後端將運行在 http://localhost:3007
```

#### 6️⃣ 前端設置
```bash
# 新開終端機，進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
# 前端將運行在 http://localhost:8080
```

### 🎯 訪問應用
- **前台首頁**：http://localhost:8080
- **後台管理**：http://localhost:8080/#/products
- **API 基礎路徑**：http://localhost:3007

---

## 📚 API 文檔

### 🔐 用戶認證
| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| `POST` | `/api/login` | 用戶登入 | 公開 |
| `POST` | `/api/regist` | 用戶註冊 | 公開 |

### 🛍️ 商品管理
| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| `GET` | `/products` | 獲取商品列表 | 公開 |
| `GET` | `/products/:id` | 獲取單一商品 | 公開 |
| `POST` | `/products` | 新增商品 | 管理員 |
| `PUT` | `/products/:id` | 更新商品 | 管理員 |
| `DELETE` | `/products/:id` | 刪除商品 | 管理員 |

### 🛒 購物車系統
| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| `GET` | `/api/cart` | 獲取購物車 | 用戶 |
| `POST` | `/api/cart/items` | 加入商品 | 用戶 |
| `PATCH` | `/api/cart/items/:id` | 更新數量 | 用戶 |
| `DELETE` | `/api/cart/items/:id` | 移除商品 | 用戶 |

### 📦 訂單管理
| 方法 | 端點 | 描述 | 權限 |
|------|------|------|------|
| `GET` | `/api/orders` | 獲取用戶訂單 | 用戶 |
| `POST` | `/api/orders` | 建立新訂單 | 用戶 |
| `PATCH` | `/api/orders/:id/cancel` | 取消訂單 | 用戶 |

---

## 📁 專案結構

```
qianta-ecommerce/
├── 📁 frontend/                 # Vue 3 前端應用
│   ├── 📁 src/
│   │   ├── 📁 api/              # API 請求封裝
│   │   ├── 📁 components/       # 共用組件
│   │   ├── 📁 stores/           # Pinia 狀態管理
│   │   ├── 📁 types/            # TypeScript 類型定義
│   │   ├── 📁 utils/            # 工具函數
│   │   └── 📁 views/            # 頁面組件
│   │       ├── 📁 home/         # 前台頁面
│   │       ├── 📁 login/        # 登入註冊
│   │       └── 📁 products/     # 後台管理
│   ├── 📁 public/               # 靜態資源
│   ├── 📄 index.html
│   ├── 📄 package.json
│   └── 📄 vite.config.ts
├── 📁 backend/                  # Express.js 後端
│   ├── 📁 db/                   # 資料庫連線與 SQL
│   ├── 📁 middleware/           # Express 中間件
│   ├── 📁 public/               # 檔案上傳存放
│   ├── 📁 router/               # 路由定義
│   ├── 📁 router_controllers/   # 控制器邏輯
│   ├── 📄 index.js              # 應用程式入口
│   └── 📄 package.json
├── 📄 pw_sql.sql                # 資料庫結構檔案
├── 📄 .gitignore
└── 📄 README.md
```

---

## 🎯 技術亮點

### 🔥 前端技術亮點
- **Vue 3 Composition API**：使用最新的組合式 API，提升程式碼可維護性
- **TypeScript 全面導入**：前端 100% TypeScript，確保類型安全
- **響應式設計**：Mobile-First 設計理念，完美適配各種裝置
- **3D 模型展示**：整合 Google Model Viewer，提供沉浸式商品體驗
- **專業動畫效果**：GSAP + ScrollTrigger 實現電影級動畫效果
- **狀態管理**：Pinia + 持久化插件，優雅處理應用狀態

### ⚡ 後端技術亮點
- **RESTful API 設計**：標準化的 API 設計，清晰的資源路由
- **JWT 身份驗證**：無狀態的用戶認證機制
- **檔案上傳處理**：支援圖片與 3D 模型檔案上傳
- **資料庫設計**：正規化的關聯式資料庫設計
- **錯誤處理**：統一的錯誤處理與回應格式
- **安全性**：密碼加密、SQL 注入防護、CORS 設定

---

## 📸 系統展示

### 🏠 前台展示
- **首頁動畫**：車輛展示與品牌介紹動畫
- **商品瀏覽**：篩選、搜尋、分頁功能
- **3D 商品展示**：互動式 3D 模型預覽
- **購物流程**：購物車 → 結帳 → 訂單確認

### 🎛️ 後台管理
- **商品管理**：CRUD 操作與批量處理
- **檔案上傳**：拖拉式圖片上傳
- **數據視覺化**：訂單統計與商品管理
- **權限控制**：角色基礎的功能權限

---

## 🔧 開發筆記

### 💡 學習重點
1. **Vue 3 生態系統**：深入理解 Composition API、Pinia、Vue Router
2. **TypeScript 實戰**：在大型專案中的類型設計與管理
3. **全端開發流程**：從需求分析到部署的完整開發週期
4. **資料庫設計**：關聯式資料庫的設計原則與 SQL 優化
5. **API 設計**：RESTful API 的設計原則與最佳實踐
6. **用戶體驗**：響應式設計與動畫效果的實現

### 🚀 技術挑戰與解決
- **檔案上傳**：實現多檔案上傳與預覽功能
- **3D 模型展示**：整合 Model Viewer 與 Vue 3
- **狀態管理**：複雜購物車邏輯的狀態設計
- **權限控制**：前後端權限驗證的一致性
- **響應式設計**：複雜表格在行動裝置上的適配

---

## 🔮 未來規劃

- [ ] 🔍 **搜尋優化**：全文檢索與智能推薦
- [ ] 💳 **支付整合**：串接第三方支付 API
- [ ] 📊 **數據分析**：銷售報表與用戶行為分析
- [ ] 🔔 **即時通知**：WebSocket 實現即時訊息
- [ ] 🌐 **多語言支援**：i18n 國際化實現
- [ ] 📱 **PWA 支援**：漸進式 Web 應用

---

## 📬 聯絡資訊

**開發者**：[你的名字]  
**GitHub**：[@yourusername](https://github.com/yourusername)  
**Email**：your.email@example.com

---

## ⭐ 支持專案

如果這個專案對您有幫助，請給個 **Star** ⭐ 支持一下！

您的支持是我持續學習與改進的動力 💪

---

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

---

<div align="center">

**🚗 Built with ❤️ by [你的名字]**

*從零開始的全端學習之路 | 2024.12 - 2025.05*

</div>
