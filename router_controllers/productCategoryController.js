const db = require('../db/index');
const path = require('path');
const fs = require('fs');

// ✅ 查詢所有分類
exports.getAllCategories = async (req, res, next) => {
  try {
    const sql = `
      SELECT id, name, description, parent_id, icon_url, created_time, update_time
      FROM product_category
      ORDER BY id DESC
    `;
    const [rows] = await db.query(sql);
    res.success(rows, "分類資料查詢成功");
  } catch (err) {
    res.next(err);
  }
};
// ✅ 透過 ID 查詢單一分類
exports.getCategoryById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, parent_id, icon_url, created_time, update_time FROM product_category WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.fail("查無此分類", 1, 404);
    }
    res.success(rows[0], "分類查詢成功");
  } catch (err) {
    next(err);
  }
};
// ✅ 新增分類（icon 可選，並避免名稱重複）
exports.createCategory = async (req, res, next) => {
  const {
    name,
    description = '',
    parent_id = 0,
    icon_url = null
  } = req.body;

  if (!name) return res.fail("分類名稱為必填");

  try {
    // 檢查是否有相同名稱
    const [check] = await db.query('SELECT id FROM product_category WHERE name = ?', [name]);
    if (check.length > 0) {
      return res.fail("此分類名稱已存在");
    }

    const date = new Date();
    const sql = `
      INSERT INTO product_category (name, description, parent_id, icon_url, created_time, update_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [name, description, parent_id, icon_url, date, date]);

    const [newRow] = await db.query(
      'SELECT id, name, description, parent_id, icon_url, created_time, update_time FROM product_category WHERE id = ?',
      [result.insertId]
    );

    res.success(newRow, "新增分類成功");
  } catch (err) {
    next(err);
  }
};

// ✅ 修改分類（支援可選 icon）
exports.updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description = '', parent_id = 0, icon_url = null } = req.body;

  if (!name) return res.fail("分類名稱為必填");

  try {
    const date = new Date();
    const sql = `
      UPDATE product_category
      SET name = ?, description = ?, parent_id = ?, icon_url = ?, update_time = ?
      WHERE id = ?
    `;
    await db.query(sql, [name, description, parent_id, icon_url, date, id]);

    const [updated] = await db.query(
      'SELECT id, name, description, parent_id, icon_url, created_time, update_time FROM product_category WHERE id = ?',
      [id]
    );

    res.success(updated, "分類更新成功");
  } catch (err) {
    next(err);
  }
};

// ✅ 刪除分類（有子分類不得刪除）
exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {

    // 檢查是否為不可刪除的特殊分類
    if (id == 1) {
      return res.fail("「未指定」為系統預設分類，不可刪除");
    }

    // 檢查是否有子分類
    const [checkChild] = await db.query(
      'SELECT COUNT(*) AS count FROM product_category WHERE parent_id = ?',
      [id]
    );
    if (checkChild[0].count > 0) {
      return res.fail("請先移除子分類後再刪除");
    }

    await db.query('DELETE FROM product_category WHERE id = ?', [id]);
    res.success(null, "分類已刪除");
  } catch (err) {
    next(err);
  }
};

// ✅ 上傳 icon 圖示（回傳 URL）
exports.uploadIcon = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.fail("未收到圖示檔案");

    const ext = path.extname(file.originalname);
    const newFilename = `${file.filename}${ext}`;
    const newPath = path.join(__dirname, "../public/upload/icons", newFilename);

    fs.renameSync(file.path, newPath);
    const iconUrl = `/upload/icons/${newFilename}`;

    res.success({ icon_url: iconUrl }, "圖示上傳成功");
  } catch (err) {
    next(err);
  }
};