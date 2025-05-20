const db = require('../db/index');

/**
 * 獲取用戶所有訂單
 * GET /api/orders
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    // 從 JWT 獲取用戶 ID
    const userId = req.user.id;

    // 查詢用戶的所有訂單（按創建時間降序排列）
    const [orders] = await db.query(`
      SELECT o.id, o.order_number, o.total_amount, o.shipping_fee, o.status, 
             o.payment_method, o.note, o.created_time, 
             sa.receiver_name, sa.receiver_phone, sa.city, sa.district, sa.address
      FROM orders o
      JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
      WHERE o.user_id = ?
      ORDER BY o.created_time DESC
    `, [userId]);

    // 獲取訂單明細
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.product_id, oi.quantity, oi.price, oi.subtotal,
               p.name as product_name,
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      order.items = items;
    }

    res.success(orders, "查詢成功");
  } catch (err) {
    next(err);
  }
};

/**
 * 創建新訂單
 * POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
  try {
    //從JWT確認用戶身分
    const userId = req.user.id;
    //這邊預設先使用貨到付款payment_method = 1
    const { shipping, payment_method = 1, note = "", items } = req.body;

    // 驗證數據
    if (!shipping || !items || !Array.isArray(items) || items.length === 0) {
      return res.fail("訂單數據不完整");
    }

    // 驗證收貨地址信息
    if (!shipping.receiver_name || !shipping.receiver_phone ||
      !shipping.city || !shipping.district || !shipping.address) {
      return res.fail("收貨地址信息不完整");
    }

    // 開始事務
    await db.query('START TRANSACTION');

    try {
      const date = new Date();

      // 1. 創建收貨地址
      const [addressResult] = await db.query(`
        INSERT INTO shipping_addresses 
        (user_id, receiver_name, receiver_phone, city, district, address, created_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, shipping.receiver_name, shipping.receiver_phone,
        shipping.city, shipping.district, shipping.address, date, date]);

      const shippingAddressId = addressResult.insertId;

      // 2. 計算訂單總金額和生成訂單編號
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.price * item.quantity;
      }

      // 加上運費 (這裡假設運費 = 0)
      const shippingFee = 0;
      totalAmount += shippingFee;

      // 生成訂單編號 (年月日時分秒+4位隨機數)
      const now = new Date();
      const orderNumber =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0') +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      // 3. 創建訂單
      const [orderResult] = await db.query(`
        INSERT INTO orders
        (order_number, user_id, shipping_address_id, total_amount, shipping_fee, 
         payment_method, note, status, created_time, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderNumber, userId, shippingAddressId, totalAmount, shippingFee,
        payment_method, note, 0, date, date]);

      const orderId = orderResult.insertId;

      // 4. 創建訂單明細
      for (const item of items) {
        const subtotal = item.price * item.quantity;

        await db.query(`
          INSERT INTO order_items
          (order_id, product_id, quantity, price, subtotal, created_time, update_time)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price, subtotal, date, date]);

        // 5. 更新商品庫存（如果需要的話）
        await db.query(`
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
        `, [item.quantity, item.product_id]);
      }

      // 提交事務
      await db.query('COMMIT');

      // 返回成功信息
      res.success({
        order_id: orderId,
        order_number: orderNumber
      }, "訂單創建成功");

    } catch (error) {
      // 回滾事務
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 刪除訂單（僅後台管理員使用）
 * DELETE /api/orders/:id
 */
exports.deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    // 開始事務
    await db.query('START TRANSACTION');

    try {
      // 1. 獲取訂單信息，以確認它存在
      const [orderCheck] = await db.query('SELECT id, shipping_address_id FROM orders WHERE id = ?', [orderId]);

      if (orderCheck.length === 0) {
        await db.query('ROLLBACK');
        return res.fail("訂單不存在");
      }

      const shippingAddressId = orderCheck[0].shipping_address_id;

      // 2. 刪除訂單明細
      await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // 3. 刪除訂單
      await db.query('DELETE FROM orders WHERE id = ?', [orderId]);

      // 4. 刪除相關的收貨地址
      await db.query('DELETE FROM shipping_addresses WHERE id = ?', [shippingAddressId]);

      // 提交事務
      await db.query('COMMIT');

      res.success(null, "訂單已刪除");
    } catch (error) {
      // 回滾事務
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 更新訂單狀態
 * PATCH /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // 驗證狀態值
    if (status !== 0 && status !== 1) {
      return res.fail("無效的狀態值，狀態必須為 0（未發貨）或 1（已發貨）");
    }

    // 檢查訂單是否存在
    const [orderCheck] = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);

    if (orderCheck.length === 0) {
      return res.fail("訂單不存在");
    }

    // 更新狀態
    const date = new Date();
    await db.query(`
      UPDATE orders
      SET status = ?, update_time = ?
      WHERE id = ?
    `, [status, date, orderId]);

    res.success(null, status === 1 ? "訂單已標記為已發貨" : "訂單已標記為未發貨");
  } catch (err) {
    next(err);
  }
};

/**
 * 取消訂單（用戶僅可取消未發貨訂單）
 * PATCH /api/orders/:id/cancel
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id; // 從JWT獲取用戶ID

    // 開始事務
    await db.query('START TRANSACTION');

    try {
      // 1. 獲取訂單信息，確認是否存在且屬於該用戶
      const [orderCheck] = await db.query(
        'SELECT id, user_id, status FROM orders WHERE id = ?',
        [orderId]
      );

      // 訂單不存在
      if (orderCheck.length === 0) {
        await db.query('ROLLBACK');
        return res.fail("訂單不存在");
      }

      // 檢查訂單是否屬於當前用戶
      if (orderCheck[0].user_id !== userId) {
        await db.query('ROLLBACK');
        return res.fail("無權操作此訂單", 403);
      }

      // 檢查訂單狀態，只能取消未發貨訂單(狀態為0)
      if (orderCheck[0].status !== 0) {
        await db.query('ROLLBACK');
        return res.fail("已發貨訂單無法取消");
      }

      // 2. 獲取訂單中的所有商品項目，用於庫存回寫
      const [orderItems] = await db.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      // 3. 庫存回寫 - 增加商品庫存
      for (const item of orderItems) {
        await db.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // 4. 更新訂單狀態為已取消 (使用新狀態，例如 2 表示已取消)
      await db.query(
        'UPDATE orders SET status = 2, update_time = ? WHERE id = ?',
        [new Date(), orderId]
      );

      // 提交事務
      await db.query('COMMIT');

      res.success(null, "訂單已成功取消");
    } catch (error) {
      // 回滾事務
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    next(err);
  }
};