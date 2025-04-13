//--------------------<<導入區>>-------------------------

const db = require('../db/index'); //數據庫
const path = require("path"); //路徑
const fs = require("fs"); //文件
const { imageSize } = require("image-size"); // 圖片自動偵測寬高

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
//上傳圖片(2d，非主圖)
exports.uploadProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) return res.fail("商品 ID 無效");
    if (!req.files || req.files.length === 0) return res.fail("請上傳圖片");

    const savedImages = [];

    for (let file of req.files) {
      const ext = path.extname(file.originalname);
      const newFilename = `${file.filename}${ext}`;
      const newPath = path.join(__dirname, "../public/upload/images", newFilename); // ✅ 存到 images 目錄
      fs.renameSync(file.path, newPath);

      const imageUrl = `/upload/images/${newFilename}`;
      const date = new Date();
      let sizeString = "unknown";

      try {
        const buffer = fs.readFileSync(newPath);
        const dimensions = imageSize(buffer);
        sizeString = `${dimensions.width}x${dimensions.height}`;
      } catch (e) {
        console.warn("圖片尺寸偵測失敗", e.message);
      }

      const isMain = savedImages.length === 0 ? 1 : 0;

      const sql = `
        INSERT INTO product_images
        (product_id, image_url, image_type, size, is_main, sort_order, created_time, update_time)
        VALUES (?, ?, 'image', ?, ?, 0, ?, ?)
      `;
      const [result] = await db.query(sql, [id, imageUrl, sizeString, isMain, date, date]);

      savedImages.push({
        id: result.insertId,
        image_url: imageUrl,
        size: sizeString,
        is_main: !!isMain
      });
    }

    res.success(savedImages, "圖片上傳成功");
  } catch (err) {
    next(err);
  }
};
//上傳3D模型(預覽主圖+3d主圖+3d貼圖)
exports.upload3DModel = async (req, res, next) => {
  try {
    const { id } = req.params;//要跟隨之主圖id，並從網址獲取
    if (!id || isNaN(id)) return res.fail("商品 ID 無效");

    //檢查是否同時收到 .obj 和 .mtl 檔案  
    const files = req.files || {};
    if (!files.obj || !files.mtl) {
      return res.fail("請上傳 .obj 與 .mtl 檔案");
    }

    const date = new Date();

    const saveFile = (file) => {
      const ext = path.extname(file.originalname);    // 獲取副檔名
      const newFilename = `${file.filename}${ext}`;   // 新檔名：不含空白或中文
      const newPath = path.join(__dirname, "../public/upload/models", newFilename);
      fs.renameSync(file.path, newPath);              // 搬移 + 改名
      return `/upload/models/${newFilename}`;         // 給前端用的網址
    };

    const modelUrl = saveFile(files.obj[0]);
    const materialUrl = saveFile(files.mtl[0]);
    let thumbnailUrl = null;//預設為"無"

    //處理預覽圖(此項非必填)
    if (files.thumbnail && files.thumbnail[0]) {
      thumbnailUrl = saveFile(files.thumbnail[0]);
    }

    // ✅ 檢查是否已有主圖
    // 查詢該商品是否已有 3D 主圖（is_main = 1）
    // 如果沒有，就自動把這張設為主圖（isMain = 1）
    // 如果已經有主圖，就不能再設（isMain = 0）
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM product_models WHERE product_id = ? AND is_main = 1",
      [id]
    );
    const isMain = rows[0].count === 0 ? 1 : 0;

    // ✅ 寫入資料庫
    const sql = `
      INSERT INTO product_models
      (product_id, model_type, model_url, material_url, thumbnail_url, is_main, created_time, update_time)
      VALUES (?, 'obj', ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [id, modelUrl, materialUrl, thumbnailUrl, isMain, date, date]);

    res.success({ modelUrl, materialUrl, thumbnailUrl, isMain }, "3D 模型上傳成功");
  } catch (err) {
    next(err);
  }
};

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
//刪除單一圖片
exports.deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    if (!productId || isNaN(productId) || !imageId || isNaN(imageId)) {
      return res.fail("商品 ID 或 圖片 ID 無效");
    }

    // 查詢圖片是否存在且屬於此商品
    const [rows] = await db.query(
      "SELECT image_url FROM product_images WHERE id = ? AND product_id = ?",
      [imageId, productId]
    );

    if (rows.length === 0) {
      return res.fail("圖片不存在或不屬於此商品");
    }

    const imageUrl = rows[0].image_url;
    const imagePath = path.join(__dirname, "../public", imageUrl); // 🔜 硬碟圖片完整路徑

    // 刪除資料庫資料
    await db.query("DELETE FROM product_images WHERE id = ? AND product_id = ?", [imageId, productId]);

    // 刪除實體檔案（try-catch 包起來比較保險）
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      console.warn("圖片檔案刪除失敗，可能已被刪除：", e.message);
    }

    res.success(null, "圖片刪除成功");
  } catch (err) {
    next(err);
  }
};


//--------------------<<修>>-------------------------

//更新商品(完整資源) -- 未完成
exports.updateProductById = async (req, res, next) => {
}
//設定主圖API
exports.setMainImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    //同時需要商品與圖片之ID
    if (!productId || isNaN(productId) || !imageId || isNaN(imageId)) {
      return res.fail("商品 ID 或 圖片 ID 無效");
    }

    // 先確認該圖片是否屬於該商品
    const [check] = await db.query(
      "SELECT * FROM product_images WHERE id = ? AND product_id = ?",
      [imageId, productId]
    );

    if (check.length === 0) {
      return res.fail("查無此圖片或不屬於此商品");
    }

    // Step 1：先清除該商品所有圖片的主圖狀態
    await db.query(
      "UPDATE product_images SET is_main = 0 WHERE product_id = ?",
      [productId]
    );

    // Step 2：將指定圖片設為主圖
    await db.query(
      "UPDATE product_images SET is_main = 1 WHERE id = ? AND product_id = ?",
      [imageId, productId]
    );

    res.success(null, "主圖設定成功");
  } catch (err) {
    next(err);
  }
};


//--------------------<<查>>-------------------------

//查全部商品（支援分類條件）
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category } = req.query;

    let sql = `SELECT * FROM products WHERE 1`; //WHERE 1 代表一定為true
    const params = [];//參數

    //此段為支援分類查詢，可有可無，不影響後續
    if (category && !isNaN(category)) {
      sql += ` AND category_id = ?`; //帶入查詢參數
      params.push(category);
    }
    //依照「最新建立」的順序排序 (未來還可擴充)
    sql += ` ORDER BY created_time DESC`;

    const [rows] = await db.query(sql, params);

    if (rows.length === 0) {
      return res.fail("查無符合條件的商品");
    }

    res.success(rows, "商品查詢成功");
  } catch (err) {
    next(err);
  }
};
//查單一商品-id
exports.getProductById = async (req, res, next) => {
  try {
    //1.利用參數解構
    const { id } = req.params //利用參數查詢，要使用params來獲取
    //2.判斷id
    if (!id || isNaN(id)) { return res.fail('商品 ID 無效', 1, 400) }
    //3.執行查詢語句
    const sql = 'SELECT * FROM products WHERE id = ?'
    const [rows] = await db.query(sql, [id])
    //4.判斷回傳值
    if (rows.length < 1) { return res.fail("查無此商品", 1, 404) }
    //5.成功
    res.success(rows[0], "查詢成功");
  } catch (err) {
    next(err)
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
//查單一商品之模型-id
exports.getProductModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.fail("商品 ID 無效");
    //注意:返回前端的模型只能一個
    const sql = `
      SELECT id, model_type, model_url, material_url, thumbnail_url, created_time
      FROM product_models
      WHERE product_id = ?
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.fail("此商品尚未有模型資料");
    }

    res.success(rows[0], "模型資訊查詢成功");
  } catch (err) {
    next(err);
  }
};

