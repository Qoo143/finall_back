//--------------------<<導入區>>-------------------------

const db = require('../db/index'); //數據庫
const path = require("path"); //路徑
const fs = require("fs"); //文件
const upload = require('../middleware/upload');//multer實例


//--------------------<<路由處理區>>-------------------------
//--------------------<<增>>-------------------------

/**
 *  新增單一商品(完整版)
 */
exports.createProduct = async (req, res, next) => {
  try {
    console.log("收到的請求體:", req.body);
    console.log("收到的檔案:", req.files);

    // 1. 提取並驗證基本商品信息
    const {
      name,
      price,
      stock,
      is_active = 0,
      category_id = 1,
      description = null,
      tagIds = []
    } = req.body;

    // 檢查必填字段
    if (!name || price === undefined || stock === undefined) {
      return res.fail("缺少必要欄位 (名稱、價格或庫存)", 1);
    }

    const date = new Date();

    // 2. 插入商品基本信息
    const sql = `
      INSERT INTO products (
        name, description, price, stock, is_active, 
        category_id, created_time, update_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      description,
      price,
      stock,
      Number(is_active),
      category_id,
      date,
      date
    ]);

    const productId = result.insertId;

    // 3. 處理標籤關聯
    // 確保 tagIds 是數組
    let parsedTagIds = tagIds;
    if (!Array.isArray(parsedTagIds)) {
      try {
        // 嘗試解析 JSON 字符串
        parsedTagIds = JSON.parse(parsedTagIds);
      } catch {
        // 如果無法解析，可能是單一值或空
        parsedTagIds = parsedTagIds ? [parsedTagIds] : [];
      }
    }

    // 過濾有效的標籤 ID
    const validTagIds = parsedTagIds
      .map(id => Number(id))
      .filter(id => !isNaN(id));

    if (validTagIds.length > 0) {
      // 批量插入標籤關聯
      const tagInsertPromises = validTagIds.map(tagId => {
        return db.query(
          `INSERT INTO product_tag (product_id, tag_id, created_time, update_time) 
           VALUES (?, ?, ?, ?)`,
          [productId, tagId, date, date]
        );
      });

      await Promise.all(tagInsertPromises);
    }

    // 4. 處理圖片上傳
    const imageFiles = req.files?.filter(file =>
      file.fieldname === 'images[]' || file.fieldname === 'images'
    ) || [];

    const imageInsertPromises = [];

    if (imageFiles.length > 0) {
      // 確保上傳目錄存在
      const uploadDir = path.join(__dirname, "../public/upload/images");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 獲取主圖設置
      let imageMainFlags = req.body['image_is_main[]'] || req.body.image_is_main || [];
      if (!Array.isArray(imageMainFlags)) {
        imageMainFlags = [imageMainFlags];
      }

      // 處理每個圖片
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const isMain = i < imageMainFlags.length ?
          Number(imageMainFlags[i]) :
          (i === 0 ? 1 : 0); // 如果沒有明確指定，第一張為主圖

        // 處理文件名和路徑
        const ext = path.extname(file.originalname);
        const newFilename = `${file.filename}${ext}`;
        const savePath = path.join(uploadDir, newFilename);
        const imageUrl = `/upload/images/${newFilename}`;

        // 移動文件
        fs.renameSync(file.path, savePath);

        // 準備插入數據庫
        imageInsertPromises.push(
          db.query(
            `INSERT INTO product_images (
              product_id, image_url, is_main, sort_order, created_time, update_time
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, imageUrl, isMain, i, date, date]
          )
        );
      }

      if (imageInsertPromises.length > 0) {
        await Promise.all(imageInsertPromises);
      }
    }

    // 5. 處理模型文件上傳 (如果有)
    const modelFile = req.files?.find(file => file.fieldname === 'model');
    if (modelFile) {
      // 確保模型目錄存在
      const modelDir = path.join(__dirname, "../public/upload/models");
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      // 處理文件名和路徑
      const ext = path.extname(modelFile.originalname);
      const newFilename = `${modelFile.filename}${ext}`;
      const savePath = path.join(modelDir, newFilename);
      const modelUrl = `/upload/models/${newFilename}`;

      // 移動文件
      fs.renameSync(modelFile.path, savePath);

      // 更新商品的 model_url
      await db.query(
        "UPDATE products SET model_url = ? WHERE id = ?",
        [modelUrl, productId]
      );
    }

    // 6. 返回成功消息和新創建的商品 ID
    res.success({ id: productId }, "商品創建成功");

  } catch (err) {
    console.error("創建商品錯誤:", err);
    next(err);
  }
};

//--------------------<<刪>>-------------------------

/**
 *  刪除單一商品
 */
exports.deleteProductById = async (req, res, next) => {
  try {
    // 1. 參數解構
    const { id } = req.params;

    // 2. 判斷id
    if (!id || isNaN(id)) {
      return res.fail('商品 ID 無效');
    }

    // 3. 開始事務 (保持與你其他操作一致)
    await db.query('START TRANSACTION');

    try {
      // 4. 查詢商品是否存在
      const [existCheck] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
      if (existCheck.length === 0) {
        await db.query('ROLLBACK');
        return res.fail("查無此商品");
      }

      // 5. 查詢並整理需要刪除的圖片文件路徑 (與你的更新商品API風格一致)
      const [imagesToDelete] = await db.query(
        'SELECT image_url FROM product_images WHERE product_id = ?',
        [id]
      );

      // 6. 查詢模型文件路徑 (如果有)
      const [modelCheck] = await db.query(
        'SELECT model_url FROM products WHERE id = ? AND model_url IS NOT NULL',
        [id]
      );

      // 7. 刪除資料 (按照相依關係順序刪除)
      // 7.1 先刪除標籤關聯
      await db.query('DELETE FROM product_tag WHERE product_id = ?', [id]);

      // 7.2 刪除商品圖片記錄
      await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);

      // 7.3 刪除模型記錄 (如果有)
      if (modelCheck.length > 0) {
        await db.query('UPDATE products SET model_url = NULL WHERE id = ?', [id]);
      }

      // 7.4 最後刪除商品本身
      const [deleteResult] = await db.query('DELETE FROM products WHERE id = ?', [id]);

      // 8. 提交事務
      await db.query('COMMIT');

      // 9. 成功後，刪除實際文件 (不影響事務)
      // 9.1 刪除圖片文件
      for (const img of imagesToDelete) {
        const imagePath = img.image_url.startsWith('/')
          ? img.image_url.substring(1)
          : img.image_url;

        const filePath = path.join(__dirname, "../public", imagePath);

        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, err => {
            if (err) console.warn("刪除圖片檔案失敗:", err);
          });
        }
      }

      // 9.2 刪除模型文件 (如果有)
      if (modelCheck.length > 0 && modelCheck[0].model_url) {
        const modelPath = modelCheck[0].model_url.startsWith('/')
          ? modelCheck[0].model_url.substring(1)
          : modelCheck[0].model_url;

        const modelFilePath = path.join(__dirname, "../public", modelPath);

        if (fs.existsSync(modelFilePath)) {
          fs.unlink(modelFilePath, err => {
            if (err) console.warn("刪除模型檔案失敗:", err);
          });
        }
      }

      // 10. 回應成功
      res.success(null, "刪除成功");

    } catch (err) {
      // 如果過程中有錯誤，回滾事務
      await db.query('ROLLBACK');
      console.error("商品刪除錯誤:", err);
      throw err; // 將錯誤傳遞給外層 catch
    }
  } catch (err) {
    next(err);
  }
};
//--------------------<<修>>-------------------------
/**
 *  更新商品(完整資源) 
 */
exports.updateProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = new Date();

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



    // ========= 4. 處理模型文件 =========
    // 
    const modelFile = req.files?.find(file => file.fieldname === 'model');
    const shouldDeleteModel = req.body.delete_model === '1';

    try {
      if (modelFile) {
        // 1. 上傳新模型文件
        // 確保目錄存在
        const modelDir = path.join(__dirname, "../public/upload/models");
        if (!fs.existsSync(modelDir)) {
          fs.mkdirSync(modelDir, { recursive: true });
        }

        // 處理文件名和路徑
        const ext = path.extname(modelFile.originalname);
        const newFilename = `${modelFile.filename}${ext}`;
        const savePath = path.join(modelDir, newFilename);
        const modelUrl = `/upload/models/${newFilename}`;

        // 移動文件
        fs.renameSync(modelFile.path, savePath);

        // 更新數據庫
        await db.query("UPDATE products SET model_url = ? WHERE id = ?", [modelUrl, id]);
        console.log("新模型已上傳:", modelUrl);

      } else if (shouldDeleteModel) {
        // 2. 刪除舊模型
        // 先查詢舊模型URL
        const [oldModel] = await db.query("SELECT model_url FROM products WHERE id = ?", [id]);
        const oldModelUrl = oldModel[0]?.model_url;

        if (oldModelUrl) {
          // 嘗試刪除舊文件
          const oldFilePath = path.join(__dirname, "../public", oldModelUrl.startsWith('/') ? oldModelUrl.substring(1) : oldModelUrl);

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log("已刪除舊模型文件:", oldFilePath);
          }
        }

        // 更新數據庫，清空model_url
        await db.query("UPDATE products SET model_url = NULL WHERE id = ?", [id]);
        console.log("已清除模型URL");
      }
      // 3. 如果兩者都沒有，保持不變
    } catch (err) {
      console.error("處理模型文件時出錯:", err);
    }
    // ========= 5. 處理圖片 =========
    /**
    *   5-1. 刪除圖片資料與檔案 
    */
    //先將formData資料格式若正確可以直接轉陣列
    // 修改後的代碼
    let deletedIds = req.body.deleted_image_ids || req.body['deleted_image_ids[]'] || [];
    console.log("確認刪除陣列", deletedIds);

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
        //清除後端資料庫url開鈄起始/
        const imagePath = img.image_url.startsWith('/') ? img.image_url.substring(1) : img.image_url;
        //相對路徑轉絕對路徑
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

    // 解析 is_main 和 id 設置 - 支持多種可能的參數名稱格式
    let imageIds = req.body.image_id || req.body['image_id[]'] || [];
    let imageIsMains = req.body.image_is_main || req.body['image_is_main[]'] || [];

    // 確保是陣列
    if (!Array.isArray(imageIds)) imageIds = [imageIds].filter(Boolean);
    if (!Array.isArray(imageIsMains)) imageIsMains = [imageIsMains].filter(Boolean);

    console.log("圖片 ID 列表:", imageIds);
    console.log("圖片 is_main 列表:", imageIsMains);

    // 創建一個映射表，用於查找每個文件的主圖狀態
    const fileIsMainMap = new Map();

    // 如果有上傳新文件，且提供了相應的 is_main 值
    if (imageFiles.length > 0 && imageIsMains.length >= imageIds.length) {
      // 計算新文件對應的索引位置
      const startIndex = imageIds.length - imageFiles.length;
      for (let i = 0; i < imageFiles.length; i++) {
        const fileIndex = startIndex + i;
        // 確保索引在範圍內
        if (fileIndex >= 0 && fileIndex < imageIsMains.length) {
          fileIsMainMap.set(imageFiles[i].filename, Number(imageIsMains[fileIndex]));
        }
      }
    }

    console.log("文件主圖映射表:", Array.from(fileIsMainMap.entries()));

    // 構建圖片元數據列表
    const imageMetaList = [];

    // 先處理已有圖片
    for (let i = 0; i < imageIds.length; i++) {
      const id = Number(imageIds[i]);
      if (id > 0) { // 只處理有效ID的現有圖片
        imageMetaList.push({
          id: id,
          is_main: i < imageIsMains.length ? Number(imageIsMains[i]) : 0,
          file: null
        });
      }
    }

    // 再處理新上傳的圖片
    for (const file of imageFiles) {
      const isMain = fileIsMainMap.get(file.filename) || 0;
      imageMetaList.push({
        id: 0,
        is_main: isMain,
        file: file
      });
    }

    console.log("構建的圖片列表:", imageMetaList.map(img => ({
      id: img.id,
      is_main: img.is_main,
      hasFile: !!img.file
    })));

    // 檢查是否至少有一張圖片被設為主圖
    const hasMainImage = imageMetaList.some(img => img.is_main === 1);
    console.log("是否有設定主圖:", hasMainImage);

    // 如果沒有主圖，且有圖片，則將第一張圖片設為主圖
    if (!hasMainImage && imageMetaList.length > 0) {
      imageMetaList[0].is_main = 1;
      console.log("未設置主圖，將第一張圖片設為主圖");
    }

    // 清除所有主圖標記 - 只針對當前商品
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
          console.log("- is_main 值:", img.is_main);  // 記錄 is_main 值

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

          console.log("圖片記錄插入成功, ID:", insertResult.insertId, "is_main:", img.is_main);
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

    // 最後確認：如果商品沒有任何主圖，則設置第一張圖片為主圖
    const [checkMain] = await db.query(`
      SELECT COUNT(*) AS count FROM product_images 
      WHERE product_id = ? AND is_main = 1`, [id]);

    if (checkMain[0].count === 0) {
      console.log("最終檢查：商品仍無主圖，設置第一張為主圖");
      await db.query(`
        UPDATE product_images 
        SET is_main = 1 
        WHERE product_id = ? 
        ORDER BY id ASC 
        LIMIT 1`, [id]);
    }

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
      is_frontend = false, // 標識是否為前台請求
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

    // 如果是前台請求，只顯示上架商品
    if (is_frontend === 'true') {
      whereSql += ' AND p.is_active = 1';
    } else if (is_active !== undefined && is_active !== '') {
      // 後台可以根據上架狀態篩選
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

    // 1️⃣ 查詢商品主資料（包含model_url）
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

    // 5️⃣ 最終統整回傳格式
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
      model_url: product.model_url, // 直接使用products表中的model_url
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


