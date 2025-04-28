const db = require('../db/index')

// 建立新標籤
exports.createTag = async (req, res, next) => {
  const { name, description = '' } = req.body
  if (!name) return res.fail('標籤名稱為必填')

  try {
    const date = new Date()
    const sql = `
      INSERT INTO tags (name, description, created_time, update_time)
      VALUES (?, ?, ?, ?)
    `
    const result = await db.query(sql, [name, description, date, date])

    const newId = result.insertId
    const [newTag] = await db.query(
      'SELECT id, name, description, created_time, update_time FROM tags WHERE id = ?',
      [newId]
    )

    res.success(newTag, '標籤建立成功')
  } catch (err) {
    // ✅ 若是名稱重複錯誤
    if (err.code === 'ER_DUP_ENTRY') {
      return res.fail('此標籤名稱已存在')
    }
    res.fail(err)
  }
}

// 批次新增標籤
exports.createTagsInBatch = async (req, res, next) => {
  try {
    const names = req.body.names || []; //前端會傳["新的","標籤"]

    if (!Array.isArray(names) || names.length === 0) {
      return res.fail('標籤名稱不得為空');
    }

    // 過濾空白與重複
    const uniqueNames = [...new Set(names.map(n => n.trim()).filter(Boolean))];

    if (uniqueNames.length === 0) {
      return res.fail('沒有有效的標籤名稱');
    }

    // 查出已存在的標籤
    const [existingRows] = await db.query(
      'SELECT id, name FROM tags WHERE name IN (?)',
      [uniqueNames]
    );

    const existingNames = existingRows.map(tag => tag.name);
    const newNames = uniqueNames.filter(name => !existingNames.includes(name));

    // 插入新的標籤（用多筆插入）- 加入創建時間和更新時間
    if (newNames.length > 0) {
      const date = new Date();
      const values = newNames.map(name => [name, '', date, date]); // 加入空描述和時間
      await db.query('INSERT INTO tags (name, description, created_time, update_time) VALUES ?', [values]);
    }

    // 查出所有對應的標籤（包含新加的）
    const [finalRows] = await db.query(
      'SELECT id, name FROM tags WHERE name IN (?)',
      [uniqueNames]
    );

    res.success(finalRows);
  } catch (err) {
    next(err)
  }
};

// ✅ 取得所有標籤
exports.getAllTags = async (req, res) => {
  try {
    const sql = `
    SELECT id, name, description, created_time, update_time
    FROM tags
    ORDER BY id DESC
    `
    const [row] = await db.query(sql)
    res.success(row)
  } catch (err) {
    res.fail(err)
  }
}

// ✅ 修改標籤後回傳該 row
exports.updateTag = async (req, res) => {
  const { name, description = '' } = req.body
  const id = req.params.id

  if (!name) return res.fail('標籤名稱為必填')

  try {
    const date = new Date()
    //先更新，但update不會有回傳row 所以要在select一次
    const updateSql = `
      UPDATE tags SET name = ?, description = ?, update_time = ?
      WHERE id = ?
    `
    await db.query(updateSql, [name, description, date, id])

    // 再撈出該 row 回傳
    const selectSql = `SELECT id, name, description, created_time, update_time FROM tags WHERE id = ?`
    const [row] = await db.query(selectSql, [id])
    res.success(row, '標籤更新成功')
  } catch (err) {
    res.fail(err)
  }
}

// ✅ 刪除指定標籤
exports.deleteTag = async (req, res) => {
  const id = req.params.id

  try {
    // 先開始一個事務
    await db.query('START TRANSACTION');

    // 先刪除關聯表中的數據
    const deleteRelationSql = `DELETE FROM product_tag WHERE tag_id = ?`;
    await db.query(deleteRelationSql, [id]);

    // 再刪除標籤本身
    const deleteTagSql = `DELETE FROM tags WHERE id = ?`;
    await db.query(deleteTagSql, [id]);

    // 提交事務
    await db.query('COMMIT');

    res.success(null, '標籤已刪除');
  } catch (err) {
    // 發生錯誤時回滾事務
    await db.query('ROLLBACK');
    res.fail(err);
  }
};