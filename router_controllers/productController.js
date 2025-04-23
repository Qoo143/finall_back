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
    `, [name, price, stock, Number(is_active), category_id || null, description || null, date, id]);

    // ========= 3. 處理標籤（先刪後建） =========
    let tagIds = req.body['tagIds[]'] || req.body.tagIds || [];
    if (!Array.isArray(tagIds)) {
      try { tagIds = JSON.parse(tagIds); } catch { tagIds = []; }
    }

    await db.query("DELETE FROM product_tag WHERE product_id = ?", [id]);

    for (const tagId of tagIds) {
      await db.query(`
        INSERT INTO product_tag (product_id, tag_id, created_time, update_time) 
        VALUES (?, ?, ?, ?)`, [id, tagId, date, date]);
    }

    // ========= 4. 處理圖片 =========

    // 4-1. 刪除圖片資料與檔案 =========
    let deletedIds = req.body['deleted_image_ids[]'] || [];
    if (!Array.isArray(deletedIds)) {
      try { deletedIds = JSON.parse(deletedIds); } catch { deletedIds = []; }
    }

    if (deletedIds.length > 0) {
      const [toDelete] = await db.query(`
        SELECT image_url FROM product_images 
        WHERE id IN (?) AND product_id = ?`, [deletedIds, id]);

      await db.query(`
        DELETE FROM product_images 
        WHERE id IN (?) AND product_id = ?`, [deletedIds, id]);

      toDelete.forEach(img => {
        const filePath = path.join(__dirname, "../public", img.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, err => {
            if (err) console.warn("刪除檔案失敗:", err);
          });
        }
      });
    }

    // 4-2. 重建圖片清單（新圖 + 舊圖主圖設定） =========

    const imageMetaList = [];
    for (let i = 0; i < 20; i++) {
      const id = req.body[`image_id[${i}]`];
      const is_main = req.body[`image_is_main[${i}]`];
      const file = req.files?.[`images[${i}]`]?.[0] || null;

      if (id !== undefined && is_main !== undefined) {
        imageMetaList.push({
          id: Number(id),
          is_main: Number(is_main),
          file,
        });
      }
    }

    // 清除所有主圖標記
    await db.query("UPDATE product_images SET is_main = 0 WHERE product_id = ?", [id]);

    for (const img of imageMetaList) {
      if (img.file) {
        // 有上傳新圖
        const ext = path.extname(img.file.originalname);
        const newFilename = `${img.file.filename}${ext}`;
        const savePath = path.join(__dirname, "../public/upload/images", newFilename);
        const imageUrl = `/upload/images/${newFilename}`;

        fs.renameSync(img.file.path, savePath); // 將檔案搬到指定位置

        await db.query(`
          INSERT INTO product_images (product_id, image_url, is_main, created_time, update_time) 
          VALUES (?, ?, ?, ?, ?)`,
          [id, imageUrl, img.is_main ? 1 : 0, date, date]
        );
      } else if (img.id) {
        // 舊圖片只更新主圖狀態
        await db.query(`
          UPDATE product_images 
          SET is_main = ? 
          WHERE id = ? AND product_id = ?`,
          [img.is_main ? 1 : 0, img.id, id]
        );
      }
    }

    // ========= 成功回傳 =========
    res.success(null, "商品更新成功");
  } catch (err) {
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


