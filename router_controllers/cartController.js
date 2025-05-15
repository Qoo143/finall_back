
const db = require('../db/index');

// 獲取用戶購物車
exports.getCart = async (req, res, next) => {
  try {
    // 從 JWT 獲取用戶 ID
    const userId = req.user.id;
    
    // 查詢用戶的購物車
    const [cart] = await db.query(`
      SELECT id FROM shopping_carts 
      WHERE user_id = ? 
      LIMIT 1
    `, [userId]);
    
    // 如果用戶沒有購物車，返回空數組
    if (cart.length === 0) {
      return res.success([], "購物車為空");
    }
    
    const cartId = cart[0].id;//取出這筆購物車之 id，之後可以查詢對應的商品
    
    // 查詢購物車中的商品
    const [items] = await db.query(`
      SELECT 
        ci.id,
        ci.product_id as productId,
        p.name,
        p.price,
        ci.quantity,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
      FROM 
        cart_items ci
      JOIN 
        products p ON ci.product_id = p.id
      WHERE 
        ci.cart_id = ?
    `, [cartId]);
    
    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += item.price * item.quantity;
    });
    
    res.success({
      items,
      totalItems: items.length,
      totalAmount
    }, "成功獲取購物車");
  } catch (err) {
    next(err);
  }
};

// 添加商品到購物車(加上創建購物車邏輯)
exports.addItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId || isNaN(productId)) {
      return res.fail("商品ID無效");
    }
    
    if (quantity <= 0) {
      return res.fail("商品數量必須大於0");
    }
    
    // 開始事務
    await db.query('START TRANSACTION');
    
    try {
      // 檢查產品是否存在並有足夠庫存
      const [product] = await db.query(`
        SELECT id, stock FROM products 
        WHERE id = ? AND is_active = 1
      `, [productId]);
      
      if (product.length === 0) {
        await db.query('ROLLBACK');
        return res.fail("商品不存在或已下架");
      }
      
      if (product[0].stock < quantity) {
        await db.query('ROLLBACK');
        return res.fail("商品庫存不足");
      }
      
      // 查找或創建用戶的購物車
      const [cart] = await db.query(`
        SELECT id FROM shopping_carts 
        WHERE user_id = ?
      `, [userId]);
      
      const date = new Date();
      let cartId;
      
      if (cart.length === 0) {
        // 創建新購物車
        const [newCart] = await db.query(`
          INSERT INTO shopping_carts (user_id, created_time, update_time)
          VALUES (?, ?, ?)
        `, [userId, date, date]);
        
        cartId = newCart.insertId;
      } else {
        cartId = cart[0].id;
      }
      
      // 檢查商品是否已在購物車中
      const [existingItem] = await db.query(`
        SELECT id, quantity FROM cart_items 
        WHERE cart_id = ? AND product_id = ?
      `, [cartId, productId]);
      
      if (existingItem.length > 0) {
        // 更新數量
        const newQuantity = existingItem[0].quantity + quantity;
        
        await db.query(`
          UPDATE cart_items 
          SET quantity = ?, update_time = ? 
          WHERE id = ?
        `, [newQuantity, date, existingItem[0].id]);
        
        await db.query('COMMIT');
        return res.success({
          itemId: existingItem[0].id,
          quantity: newQuantity
        }, "商品數量已更新");
      } else {
        // 添加新項目
        const [newItem] = await db.query(`
          INSERT INTO cart_items (cart_id, product_id, quantity, created_time, update_time)
          VALUES (?, ?, ?, ?, ?)
        `, [cartId, productId, quantity, date, date]);
        
        await db.query('COMMIT');
        return res.success({
          itemId: newItem.insertId,
          quantity
        }, "商品已添加到購物車");
      }
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

// 更新購物車商品數量
exports.updateItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!itemId || isNaN(itemId)) {
      return res.fail("項目ID無效");
    }
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.fail("數量必須為正數");
    }
    
    // 確認項目存在且屬於該用戶
    const [itemCheck] = await db.query(`
      SELECT ci.id, ci.product_id, p.stock
      FROM cart_items ci
      JOIN shopping_carts sc ON ci.cart_id = sc.id
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND sc.user_id = ?
    `, [itemId, userId]);
    
    if (itemCheck.length === 0) {
      return res.fail("購物車項目不存在");
    }
    
    // 檢查庫存
    if (itemCheck[0].stock < quantity) {
      return res.fail("商品庫存不足");
    }
    
    // 更新數量
    const date = new Date();
    await db.query(`
      UPDATE cart_items 
      SET quantity = ?, update_time = ? 
      WHERE id = ?
    `, [quantity, date, itemId]);
    
    res.success({ itemId, quantity }, "數量已更新");
  } catch (err) {
    next(err);
  }
};

// 從購物車移除商品
exports.removeItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    if (!itemId || isNaN(itemId)) {
      return res.fail("項目ID無效");
    }
    
    // 確認項目存在且屬於該用戶
    const [itemCheck] = await db.query(`
      SELECT ci.id
      FROM cart_items ci
      JOIN shopping_carts sc ON ci.cart_id = sc.id
      WHERE ci.id = ? AND sc.user_id = ?
    `, [itemId, userId]);
    
    if (itemCheck.length === 0) {
      return res.fail("購物車項目不存在");
    }
    
    // 刪除項目
    await db.query(`
      DELETE FROM cart_items 
      WHERE id = ?
    `, [itemId]);
    
    res.success(null, "商品已從購物車移除");
  } catch (err) {
    next(err);
  }
};

// 清空購物車
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 獲取用戶的購物車
    const [cart] = await db.query(`
      SELECT id FROM shopping_carts 
      WHERE user_id = ?
    `, [userId]);
    
    if (cart.length === 0) {
      return res.success(null, "購物車已清空");
    }
    
    // 刪除購物車中所有項目
    await db.query(`
      DELETE FROM cart_items 
      WHERE cart_id = ?
    `, [cart[0].id]);
    
    res.success(null, "購物車已清空");
  } catch (err) {
    next(err);
  }
};