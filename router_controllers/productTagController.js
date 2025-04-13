const db = require('../db/index')

// ✅ 查詢某商品的所有標籤（JOIN tags）
exports.getProductTags = async (req, res, next) => {
  const productId = req.params.productId

  try {
    const sql = `
      SELECT t.id, t.name, t.description, t.created_time, t.update_time
      FROM product_tag pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.product_id = ?
      ORDER BY t.id DESC
    `
    const [row] = await db.query(sql, [productId])
    res.success(row, "標籤查詢成功")
  } catch (err) {
    next(err)
  }
}

// ✅ 部分更新商品的標籤（支援同時新增與移除多筆）
exports.updateProductTagsPartially = async (req, res, next) => {
  const productId = req.params.productId
  const { add = [], remove = [] } = req.body
  //前端虛傳陣列進來
  //{
  //   "add": [2, 4],      // 要新增綁定的 tag_id 陣列
  //   "remove": [1]       // 要移除的 tag_id 陣列
  // }

  if (!productId || isNaN(productId)) {
    return res.fail("商品 ID 無效")
  }

  if (!Array.isArray(add) || !Array.isArray(remove)) {
    return res.fail("請提供正確的標籤陣列")
  }

  try {
    const date = new Date()
    const tasks = []

    // ➕ 新增標籤（先檢查是否已存在）
    for (let tagId of add) {
      if (!tagId || isNaN(tagId)) continue
      const checkSql = `SELECT COUNT(*) AS count FROM product_tag WHERE product_id = ? AND tag_id = ?`
      const [check] = await db.query(checkSql, [productId, tagId])
      if (check[0].count === 0) {
        const insertSql = `
          INSERT INTO product_tag (product_id, tag_id, created_time, update_time)
          VALUES (?, ?, ?, ?)
        `
        tasks.push(db.query(insertSql, [productId, tagId, date, date]))
      }
    }

    // ➖ 移除標籤
    for (let tagId of remove) {
      if (!tagId || isNaN(tagId)) continue
      const deleteSql = `DELETE FROM product_tag WHERE product_id = ? AND tag_id = ?`
      tasks.push(db.query(deleteSql, [productId, tagId]))
    }

    await Promise.all(tasks)

    res.success(null, "商品標籤更新成功")
  } catch (err) {
    next(err)
  }
}
