const express = require('express')
const router = express.Router()
const controller = require('../router_controllers/productTagController')

// 查詢某商品的所有標籤
router.get('/:productId/tags', controller.getProductTags)

// 更新商品的標籤（支援新增與移除）
router.patch('/:productId/tags', controller.updateProductTagsPartially)

module.exports = router
