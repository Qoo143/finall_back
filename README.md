<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QianTa 電商系統</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #e1e4e8;
            padding-bottom: 30px;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 1.2rem;
            color: #586069;
            margin-bottom: 20px;
        }
        .badges {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .badge {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .section {
            margin: 40px 0;
        }
        .section h2 {
            color: #1a202c;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            font-size: 1.8rem;
        }
        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 30px 0;
        }
        .tech-category {
            background: #f7fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #4299e1;
        }
        .tech-category h3 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .tech-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .tech-item {
            background: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.9rem;
            color: #4a5568;
            border: 1px solid #e2e8f0;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        .feature-card h3 {
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        .installation {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Monaco', 'Consolas', monospace;
            margin: 15px 0;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .screenshot {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 2px dashed #cbd5e0;
        }
        .contact {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
        }
        .contact a {
            color: #fed7d7;
            text-decoration: none;
        }
        .contact a:hover {
            text-decoration: underline;
        }
        .warning {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .warning h4 {
            color: #c53030;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo">🚗 QianTa</div>
            <div class="subtitle">現代化全端電商平台 - 汽車交易專業系統</div>
            <div class="badges">
                <span class="badge">Vue 3 + TypeScript</span>
                <span class="badge">Express.js</span>
                <span class="badge">MySQL</span>
                <span class="badge">Element Plus</span>
                <span class="badge">3D 模型展示</span>
            </div>
        </div>

        <!-- Project Overview -->
        <div class="section">
            <h2>📋 專案簡介</h2>
            <p>QianTa 是一個功能完整的現代化電商平台，專注於汽車及交通工具的線上展示與交易。結合了前端現代化技術與後端穩定架構，提供管理者完整的後台管理系統，以及用戶友善的購物體驗。</p>
            
            <div class="warning">
                <h4>⚠️ 注意事項</h4>
                <p>此專案為學習作品集項目，包含完整的前後端功能實作，適合用於技術展示與學習參考。</p>
            </div>
        </div>

        <!-- Tech Stack -->
        <div class="section">
            <h2>🛠️ 技術棧</h2>
            <div class="tech-grid">
                <div class="tech-category">
                    <h3>前端技術</h3>
                    <div class="tech-list">
                        <span class="tech-item">Vue 3 Composition API</span>
                        <span class="tech-item">TypeScript</span>
                        <span class="tech-item">Element Plus</span>
                        <span class="tech-item">Vue Router</span>
                        <span class="tech-item">Pinia</span>
                        <span class="tech-item">SCSS</span>
                        <span class="tech-item">GSAP 動畫</span>
                        <span class="tech-item">Model Viewer</span>
                    </div>
                </div>
                <div class="tech-category">
                    <h3>後端技術</h3>
                    <div class="tech-list">
                        <span class="tech-item">Node.js</span>
                        <span class="tech-item">Express.js</span>
                        <span class="tech-item">MySQL 8.0</span>
                        <span class="tech-item">JWT 認證</span>
                        <span class="tech-item">Multer 檔案上傳</span>
                        <span class="tech-item">bcrypt 加密</span>
                        <span class="tech-item">Joi 驗證</span>
                    </div>
                </div>
                <div class="tech-category">
                    <h3>開發工具</h3>
                    <div class="tech-list">
                        <span class="tech-item">Vite</span>
                        <span class="tech-item">ESLint</span>
                        <span class="tech-item">Git</span>
                        <span class="tech-item">VS Code</span>
                        <span class="tech-item">Postman</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features -->
        <div class="section">
            <h2>🌟 核心功能</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🛍️ 前台購物系統</h3>
                    <p>商品瀏覽、搜尋篩選、購物車、訂單管理、用戶認證等完整購物流程</p>
                </div>
                <div class="feature-card">
                    <h3>🎛️ 後台管理系統</h3>
                    <p>商品管理、分類標籤、訂單處理、用戶管理等全方位管理功能</p>
                </div>
                <div class="feature-card">
                    <h3>🎨 3D 模型展示</h3>
                    <p>支援 GLB 格式 3D 模型上傳與展示，提供沉浸式商品體驗</p>
                </div>
                <div class="feature-card">
                    <h3>📱 響應式設計</h3>
                    <p>完全響應式設計，支援桌面端與行動裝置的完美體驗</p>
                </div>
                <div class="feature-card">
                    <h3>🔒 安全認證</h3>
                    <p>JWT Token 認証、密碼加密、權限控制等完整安全機制</p>
                </div>
                <div class="feature-card">
                    <h3>🎞️ 動畫效果</h3>
                    <p>使用 GSAP 實現流暢的頁面轉場與交互動畫效果</p>
                </div>
            </div>
        </div>

        <!-- Installation -->
        <div class="section">
            <h2>🚀 快速開始</h2>
            <div class="installation">
                <h3>環境需求</h3>
                <ul>
                    <li>Node.js 16+ </li>
                    <li>MySQL 8.0+</li>
                    <li>Git</li>
                </ul>

                <h3>安裝步驟</h3>
                <div class="code-block">
# 1. 複製專案
git clone https://github.com/yourusername/qianta-ecommerce.git
cd qianta-ecommerce

# 2. 後端設置
cd backend
npm install

# 3. 設置環境變數
cp .env.example .env
# 編輯 .env 檔案，設置資料庫連線資訊

# 4. 建立資料庫
# 匯入 pw_sql.sql 到你的 MySQL 資料庫

# 5. 啟動後端
npm start

# 6. 前端設置 (新開終端機)
cd ../frontend
npm install

# 7. 啟動前端
npm run dev
                </div>

                <h3>資料庫設置</h3>
                <div class="code-block">
# 1. 建立資料庫
CREATE DATABASE back_system;

# 2. 匯入 SQL 檔案
mysql -u root -p back_system < pw_sql.sql

# 3. 設置 .env 檔案
host=localhost
port=3306
user=your_username
password=your_password
database=back_system
jwtSecretkey=your_jwt_secret
                </div>
            </div>
        </div>

        <!-- Screenshots -->
        <div class="section">
            <h2>📸 系統截圖</h2>
            <div class="screenshot-grid">
                <div class="screenshot">
                    <h4>🏠 首頁展示</h4>
                    <p>動態首頁與商品展示</p>
                </div>
                <div class="screenshot">
                    <h4>🛒 商品瀏覽</h4>
                    <p>商品列表與篩選功能</p>
                </div>
                <div class="screenshot">
                    <h4>🎛️ 後台管理</h4>
                    <p>管理者控制面板</p>
                </div>
                <div class="screenshot">
                    <h4>🔐 用戶系統</h4>
                    <p>登入註冊與個人中心</p>
                </div>
            </div>
        </div>

        <!-- API Documentation -->
        <div class="section">
            <h2>📚 API 文件</h2>
            <h3>主要 API 端點</h3>
            <div class="code-block">
# 用戶認證
POST /api/login          # 用戶登入
POST /api/regist         # 用戶註冊

# 商品管理
GET    /products         # 獲取商品列表
GET    /products/:id     # 獲取單一商品
POST   /products         # 新增商品 (需管理員權限)
PUT    /products/:id     # 更新商品 (需管理員權限)
DELETE /products/:id     # 刪除商品 (需管理員權限)

# 購物車
GET    /api/cart         # 獲取購物車
POST   /api/cart/items   # 加入商品到購物車
PATCH  /api/cart/items/:id  # 更新購物車商品數量
DELETE /api/cart/items/:id  # 移除購物車商品

# 訂單管理
GET    /api/orders       # 獲取用戶訂單
POST   /api/orders       # 建立新訂單
PATCH  /api/orders/:id/cancel  # 取消訂單
            </div>
        </div>

        <!-- Project Structure -->
        <div class="section">
            <h2>📁 專案結構</h2>
            <div class="code-block">
qianta-ecommerce/
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── components/      # 共用組件
│   │   ├── views/          # 頁面組件
│   │   ├── stores/         # Pinia 狀態管理
│   │   ├── api/            # API 請求
│   │   ├── types/          # TypeScript 類型定義
│   │   └── utils/          # 工具函數
│   ├── public/             # 靜態資源
│   └── package.json
├── backend/                 # Express.js 後端
│   ├── router/             # 路由定義
│   ├── router_controllers/ # 控制器
│   ├── middleware/         # 中間件
│   ├── db/                 # 資料庫連線
│   ├── public/            # 上傳檔案存放
│   └── package.json
├── pw_sql.sql              # 資料庫結構
└── README.md
            </div>
        </div>

        <!-- Development Notes -->
        <div class="section">
            <h2>📝 開發筆記</h2>
            <h3>🎯 技術亮點</h3>
            <ul>
                <li><strong>Vue 3 Composition API</strong>：使用最新的組合式 API 提升代碼可維護性</li>
                <li><strong>TypeScript 全面支援</strong>：前端全面使用 TS 確保類型安全</li>
                <li><strong>響應式設計</strong>：Mobile-First 設計理念，完美適配各種裝置</li>
                <li><strong>3D 模型展示</strong>：整合 Model Viewer 提供沉浸式商品體驗</li>
                <li><strong>動畫效果</strong>：使用 GSAP 實現專業級動畫效果</li>
                <li><strong>模組化架構</strong>：前後端分離，API 設計清晰</li>
            </ul>

            <h3>🔧 學習重點</h3>
            <ul>
                <li>Vue 3 最新特性的實際應用</li>
                <li>Express.js RESTful API 設計</li>
                <li>MySQL 資料庫設計與 SQL 優化</li>
                <li>JWT 認證機制實作</li>
                <li>檔案上傳與處理</li>
                <li>前端狀態管理與路由設計</li>
            </ul>
        </div>

        <!-- Contact -->
        <div class="section">
            <div class="contact">
                <h2>📬 聯絡資訊</h2>
                <p>如果您對此專案有任何問題或建議，歡迎與我聯繫！</p>
                <p>
                    <strong>GitHub:</strong> <a href="https://github.com/yourusername">@yourusername</a><br>
                    <strong>Email:</strong> <a href="mailto:your.email@example.com">your.email@example.com</a>
                </p>
                <p><em>⭐ 如果這個專案對您有幫助，請給個 Star 支持一下！</em></p>
            </div>
        </div>
    </div>
</body>
</html>
