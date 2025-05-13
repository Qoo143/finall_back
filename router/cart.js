// router/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../router_controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');//身分驗證


// 使用中間件驗證所有請求
router.use(authMiddleware);


// 獲取用戶購物車
router.get('/', cartController.getCart);
// 添加商品到購物車
router.post('/items', cartController.addItem);
// 更新購物車商品數量
router.patch('/items/:itemId', cartController.updateItemQuantity);
// 從購物車移除商品
router.delete('/items/:itemId', cartController.removeItem);
// 清空購物車
router.delete('/', cartController.clearCart);

module.exports = router;