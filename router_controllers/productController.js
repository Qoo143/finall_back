//--------------------<<導入區>>-------------------------

const db = require('../db/index'); //數據庫
const path = require("path"); //路徑
const fs = require("fs"); //文件
const upload = require('../middleware/upload');//multer實例


//--------------------<<路由處理區>>-------------------------
//--------------------<<增>>-------------------------

//新增單一商品
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, is_active, category_id } = req.body;

    // 檢查非空
    if (!name || price === undefined || stock === undefined || is_active === undefined || category_id === undefined) {
      return res.fail("缺少必要欄位", 1);
    }
    const sql = `
      INSERT INTO products (name, description, price, stock, is_active, category_id, created_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const date = new Date()
    const [result] = await db.query(sql, [
      name,
      description || null,
      price,
      stock,
      Number(is_active) || 0,
      category_id,
      date,
      date
    ]);

    res.success(result, "新增商品成功");
  } catch (err) {
    next(err); // 丟給全局錯誤處理
  }
}

//--------------------<<刪>>-------------------------

//刪除單一商品
exports.deleteProductById = async (req, res, next) => {
  try {
    //1.參數解構
    const { id } = req.params
    //2.判斷id
    if (!id || isNaN(id)) { return res.fail('商品 ID 無效') }
    //3.執行查詢語句
    const sql = 'DELETE FROM products WHERE id = ?'
    const [rows] = await db.query(sql, [id])
    //4.判斷回傳值
    if (rows.affectedRows === 0) { return res.fail("查無此商品") }
    //5.成功
    res.success(null, "刪除成功");
  } catch (err) {
    next(err)
  }

};

//--------------------<<修>>-------------------------
/**
 *  更新商品(完整資源) 
 */
exports.updateProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ========= 1. 接收並驗證基本欄位 =========
    const {
      name, price, stock, is_active, category_id, description
    } = req.body;

    // 輸出收到的請求體，方便調試
    console.log("收到的請求體:", req.body);
    console.log("收到的檔案:", req.files);

    if (!name || price === undefined || stock === undefined) {
      return res.fail("缺少必要欄位");
    }

    const date = new Date();

    // ========= 2. 更新基本資料 =========
    await db.query(`
      UPDATE products SET 
        name = ?, 
        price = ?, 
        stock = ?, 
        is_active = ?, 
        category_id = ?, 
        description = ?, 
        update_time = ? 
      WHERE id = ?
    `, [name, price, stock, Number(is_active), category_id, description || null, date, id]);

    // ========= 3. 處理標籤（先刪後建） =========
    let tagIds = req.body['tagIds[]'] || req.body.tagIds || [];
    if (!Array.isArray(tagIds)) {
      try { tagIds = JSON.parse(tagIds); } catch { tagIds = []; }
    }

    // 確保標籤ID是數字
    tagIds = tagIds.map(id => Number(id)).filter(id => !isNaN(id));

    await db.query("DELETE FROM product_tag WHERE product_id = ?", [id]);

    // 只有當有標籤時才執行插入
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.query(`
          INSERT INTO product_tag (product_id, tag_id, created_time, update_time) 
          VALUES (?, ?, ?, ?)`, [id, tagId, date, date]);
      }
    }
    // ========= 4. 處理圖片 =========
    /**
    *   4-1. 刪除圖片資料與檔案 
    */
    //先將formData資料格式若正確可以直接轉陣列
    // 修改後的代碼
    let deletedIds = req.body.deleted_image_ids || req.body['deleted_image_ids[]'] || [];

    // 確保 deletedIds 是陣列
    if (!Array.isArray(deletedIds)) {
      deletedIds = [deletedIds]; // 單一值轉成陣列
    }
    // 確保ID是數字所以清除非數字(ex:nall) - 這邊是刪除照片所以索引便更也不影響
    deletedIds = deletedIds.map(id => Number(id)).filter(id => !isNaN(id));

    // 只有當有要刪除的圖片時才執行
    if (deletedIds.length > 0) {
      // 先找出要刪除的圖片路徑 他會回傳陣列

      const [toDelete] = await db.query(`
        SELECT image_url FROM product_images 
        WHERE id IN (?) AND product_id = ?`, [deletedIds, id]);

      // 從 product_images 表中，刪除這些圖片資料，且
      // 只刪除屬於這個 product_id 的那幾張圖 
      await db.query(`
        DELETE FROM product_images 
        WHERE id IN (?) AND product_id = ?`, [deletedIds, id]);

      // 遍歷剛剛查出來的圖片資訊
      // 刪除檔案系統中的檔案
      for (const img of toDelete) {
        //好好處理圖片路徑
        const imagePath = img.image_url.startsWith('/') ? img.image_url.substring(1) : img.image_url;
        const filePath = path.join(__dirname, "../public", imagePath);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, err => {
            if (err) console.warn("刪除檔案失敗:", err);
          });
        } else {
          console.warn("檔案不存在:", filePath);
        }
      }
    }

    /**
    *    4-2. 重建圖片清單（新圖 + 舊圖主圖設定） =========
    */

    // 4-2. 重建圖片清單（新圖 + 舊圖主圖設定）

    // 確保 upload/images 目錄存在
    const uploadDir = path.join(__dirname, "../public/upload/images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("創建上傳目錄:", uploadDir);
    }

    // 處理請求中的圖片信息
    console.log("處理圖片索引...");
    const imageFiles = req.files || []; // 獲取所有上傳的文件
    console.log("文件總數:", imageFiles.length);

    // 解析 is_main 和 id 設置
    const imageIds = Array.isArray(req.body.image_id) ? req.body.image_id : [req.body.image_id].filter(Boolean);
    const imageIsMains = Array.isArray(req.body.image_is_main) ? req.body.image_is_main : [req.body.image_is_main].filter(Boolean);

    console.log("圖片 ID 列表:", imageIds);
    console.log("圖片 is_main 列表:", imageIsMains);

    // 構建圖片元數據列表
    const imageMetaList = [];

    // 將上傳的文件映射到元數據
    for (let i = 0; i < Math.max(imageIds.length, imageFiles.length); i++) {
      const hasId = i < imageIds.length;
      const hasFile = i < imageFiles.length;

      if (hasId || hasFile) {
        imageMetaList.push({
          id: hasId ? Number(imageIds[i]) : 0,
          is_main: hasId && i < imageIsMains.length ? Number(imageIsMains[i]) : 0,
          file: hasFile ? imageFiles[i] : null
        });
      }
    }

    console.log("構建的圖片列表:", imageMetaList.map(img => ({
      id: img.id,
      is_main: img.is_main,
      hasFile: !!img.file
    })));

    // 清除所有主圖標記
    await db.query("UPDATE product_images SET is_main = 0 WHERE product_id = ?", [id]);
    console.log("已清除商品 ID", id, "的所有主圖標記");

    // 處理每個圖片
    let processedCount = 0;
    let errorCount = 0;

    for (const img of imageMetaList) {
      try {
        if (img.file) {
          // 有上傳新圖
          const ext = path.extname(img.file.originalname);
          const name = path.basename(img.file.filename, path.extname(img.file.filename));
          const newFilename = `${name}${ext}`;
          const savePath = path.join(uploadDir, newFilename);
          const imageUrl = `/upload/images/${newFilename}`;

          console.log("處理新圖片:");
          console.log("- 原始文件名:", img.file.originalname);
          console.log("- 臨時路徑:", img.file.path);
          console.log("- 目標路徑:", savePath);
          console.log("- 數據庫URL:", imageUrl);

          // 檢查源文件是否存在
          if (!fs.existsSync(img.file.path)) {
            console.error("錯誤: 臨時文件不存在:", img.file.path);
            errorCount++;
            continue;
          }

          // 將檔案從臨時目錄移到目標目錄
          fs.renameSync(img.file.path, savePath);
          console.log("文件成功移動到:", savePath);

          // 插入新圖片記錄
          const [insertResult] = await db.query(`
        INSERT INTO product_images (product_id, image_url, is_main, created_time, update_time)
        VALUES (?, ?, ?, ?, ?)`,
            [id, imageUrl, img.is_main, date, date]
          );

          console.log("圖片記錄插入成功, ID:", insertResult.insertId);
          processedCount++;

        } else if (img.id > 0) {
          // 舊圖片只更新主圖狀態
          console.log("更新舊圖片:", img.id, "主圖狀態:", img.is_main);

          const [updateResult] = await db.query(`
        UPDATE product_images
        SET is_main = ?, update_time = ?
        WHERE id = ? AND product_id = ?`,
            [img.is_main, date, img.id, id]
          );

          if (updateResult.affectedRows > 0) {
            console.log("圖片狀態更新成功");
            processedCount++;
          } else {
            console.warn("圖片狀態更新失敗，可能圖片ID不存在:", img.id);
          }
        }
      } catch (err) {
        console.error("處理圖片時發生錯誤:", err);
        errorCount++;
      }
    }

    console.log("圖片處理完成 - 成功:", processedCount, "張, 失敗:", errorCount, "張");
    // ========= 成功回傳 =========
    res.success({ id }, "商品更新成功");
  } catch (err) {
    console.error("商品更新錯誤:", err);
    next(err); // 交由全局錯誤中間件處理
  }
};
//--------------------<<查>>-------------------------

//查全部商品（支援分類條件）
exports.getProductsByFilter = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 8,
      start_date,
      end_date,
      category_id,
      tags,
      name,
      is_active,
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let whereSql = 'WHERE 1';

    // 日期篩選
    if (start_date && end_date) {
      const formattedStart = start_date.replace(/-/g, '');
      const formattedEnd = end_date.replace(/-/g, '');
      whereSql += " AND DATE_FORMAT(p.created_time, '%Y%m%d') BETWEEN ? AND ?";
      params.push(formattedStart, formattedEnd);
    }

    if (category_id) {
      whereSql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (is_active !== undefined && is_active !== '') {
      whereSql += ' AND p.is_active = ?';
      params.push(Number(is_active));
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      if (tagList.length > 0) {
        const tagConditions = tagList.map(() => 't.name LIKE ?').join(' OR ');
        whereSql += ` AND (${tagConditions})`;
        tagList.forEach(tag => params.push(`%${tag}%`));
      }
    }

    if (name) {
      whereSql += ` AND p.name LIKE ?`;
      params.push(`%${name}%`);
    }

    const dataSql = `
      SELECT DISTINCT
        p.*,
        pi.image_url AS main_image_url
      FROM products p
      LEFT JOIN product_tag pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      ${whereSql}
      ORDER BY p.created_time DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN product_tag pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereSql}
    `;

    const [dataRows] = await db.query(dataSql, [...params, Number(limit), Number(offset)]);
    const [countRows] = await db.query(countSql, params);

    res.success(
      {
        page: Number(page),
        limit: Number(limit),
        total: countRows[0].total,
        data: dataRows,
      },
      '查詢成功'
    );
  } catch (err) {
    console.error('[getProductsByFilter Error]', err);
    next(err);
  }
};
//查單一商品byId
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.fail("商品 ID 無效", 1, 400);

    // 1️⃣ 查詢商品主資料
    const sqlProduct = "SELECT * FROM products WHERE id = ?";
    const [productRows] = await db.query(sqlProduct, [id]);
    if (productRows.length < 1) return res.fail("查無此商品", 1, 404);
    const product = productRows[0];

    // 2️⃣ 查詢分類（若有需要 label 可擴充）
    const category_id = product.category_id ?? null;

    // 3️⃣ 查詢標籤
    const [tagRows] = await db.query(
      `SELECT t.id, t.name
       FROM product_tag pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id = ?`,
      [id]
    );
    const tagIds = tagRows.map(t => t.id);
    const tagNames = tagRows.map(t => t.name);

    // 4️⃣ 查詢所有圖片（依 is_main DESC, sort_order ASC）
    const [imageRows] = await db.query(
      `SELECT id, image_url, is_main
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_main DESC, sort_order ASC, id ASC`,
      [id]
    );
    const images = imageRows.map(img => ({
      id: img.id,
      file: img.image_url,
      is_main: img.is_main
    }));

    // 5️⃣ 查詢模型（目前只有 1 對 1）
    const [modelRows] = await db.query(
      `SELECT model_url, camera_position, camera_target
       FROM product_models
       WHERE product_id = ?
       LIMIT 1`,
      [id]
    );

    let model = null;
    if (modelRows.length > 0) {
      const m = modelRows[0];
      try {
        model = {
          glb: m.model_url,
          camera: {
            position: JSON.parse(m.camera_position || '{}'),
            target: JSON.parse(m.camera_target || '{}'),
          },
        };
      } catch (err) {
        console.warn("模型 camera JSON 解析失敗", err);
        model = null;
      }
    }

    // 6️⃣ 最終統整回傳格式
    res.success({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      is_active: product.is_active,
      tagIds,
      tagNames,
      category_id,
      description: product.description || "",
      model,
      images
    }, "查詢成功");

  } catch (err) {
    next(err);
  }
};
//查單一商品之圖片-id
exports.getProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.fail("商品 ID 無效");
    }
    //注意排序 主圖優先，按照sort生序
    const sql = `
      SELECT id, image_url, size, is_main, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_main DESC, sort_order ASC, id ASC
    `;

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.fail("此商品尚未有任何圖片");
    }

    res.success(rows, "圖片查詢成功");
  } catch (err) {
    next(err);
  }
};


