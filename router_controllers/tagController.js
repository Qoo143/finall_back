const db = require('../db/index')

// 建立新標籤
exports.createTag = async (req, res) => {
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
    const sql = `DELETE FROM tags WHERE id = ?`
    await db.query(sql, [id])
    res.success(null, '標籤已刪除')
  } catch (err) {
    res.fail(err)
  }
}
