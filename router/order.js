// router/order.js
const express = require('express');
const router = express.Router();
const orderController = require('../router_controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware'); // 身分驗證中間件

// 使用中間件驗證所有請求
router.use(authMiddleware);

// 獲取用戶所有訂單
router.get('/', orderController.getUserOrders);

// 創建新訂單
router.post('/', orderController.createOrder);

// 刪除訂單(僅限管理員)
router.delete('/:id', orderController.deleteOrder);

// 更新訂單狀態
router.patch('/:id/status', orderController.updateOrderStatus);

// 取消訂單
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;